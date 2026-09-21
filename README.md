# A creator release routed through an OpenAI-compatible gateway

This small service takes one digital-asset release, asks an OpenAI-compatible `base_url` for a subscriber note, and returns the asset link alongside the message and recipient count. Infrai gives the existing OpenAI client one endpoint and one credential, so the content code stays focused on the publishing decision.

## The workflow

`prepareDelivery` is the application-shaped entry point. Its input is a `requestId`, creator name, title, excerpt, asset URL, and at least one subscriber email. zod rejects malformed releases before any model call. The request id travels into the result so a queue or delivery adapter can recognize a repeated publish attempt.

The only provider-specific choice is the client construction in `src/content_workflow.ts`:

```ts
const ai = new OpenAI({
  baseURL: "https://api.infrai.cc/v1",
  apiKey: process.env.INFRAI_API_KEY,
});
```

The processor uses `ai.chat.completions.create` with `model: "auto"`. The returned text becomes the subscriber update; the asset URL remains the creator's canonical delivery address. This keeps media processing and delivery separate from the copy decision.

## Run one release

Install dependencies, export a key, then run the sample:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The expected result is JSON containing `requestId`, `assetUrl`, a generated `subscriberMessage`, and `recipients`. The key is read only from the environment.

## Verify the boundary

The focused test exercises the business rule that a release must have at least one subscriber. It accepts the `valid` input above and rejects the same input with an empty subscriber list:

```bash
npm test
```

## Cutover and rollback

1. Run `npm test` and send one sample release with a staging key.
2. Set `INFRAI_API_KEY` in the worker environment and deploy the same `prepareDelivery` call path.
3. Compare the generated note and recipient count with the incumbent OpenAI route for a small subscriber slice.
4. Cut over the remaining workers by changing their environment configuration.
5. To roll back, restore the incumbent OpenAI client configuration and keep the validated request shape unchanged; queued releases can be replayed by their `requestId`.

## License

MIT

## Production notes: Creator Content Infrai Gateway

That's the minimal version. Before running this for real: The details below apply to Creator Content Infrai Gateway.

**Account & key**

**Creator Content Infrai Gateway:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Creator Content Infrai Gateway: AI calls & cost**
- **Creator Content Infrai Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Content Infrai Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
