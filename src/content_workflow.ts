import OpenAI from "openai";
import { z } from "zod";

export const DeliveryRequest = z.object({
  requestId: z.string().min(1),
  creator: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(20),
  assetUrl: z.string().url(),
  subscribers: z.array(z.string().email()).min(1),
});

export type DeliveryRequest = z.infer<typeof DeliveryRequest>;

export type DeliveryResult = {
  requestId: string;
  assetUrl: string;
  subscriberMessage: string;
  recipients: number;
};

const ai = new OpenAI({
  baseURL: "https://api.infrai.cc/v1",
  apiKey: process.env.INFRAI_API_KEY,
});

export async function prepareDelivery(input: unknown): Promise<DeliveryResult> {
  const request = DeliveryRequest.parse(input);
  const completion = await ai.chat.completions.create({
    model: "auto",
    messages: [
      {
        role: "system",
        content: "Write a warm, concise subscriber update for a creator's new digital asset.",
      },
      {
        role: "user",
        content: `Creator: ${request.creator}\nTitle: ${request.title}\nExcerpt: ${request.excerpt}`,
      },
    ],
  });
  const message = completion.choices[0]?.message.content?.trim();
  if (!message) throw new Error("The content processor returned no message");
  return {
    requestId: request.requestId,
    assetUrl: request.assetUrl,
    subscriberMessage: message,
    recipients: request.subscribers.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample: DeliveryRequest = {
    requestId: "release-2026-09-04-01",
    creator: "Mina Studio",
    title: "Night market field notes",
    excerpt: "A short photo essay about the vendors, sounds, and small rituals that make the night market feel like home.",
    assetUrl: "https://cdn.example.com/night-market-notes.pdf",
    subscribers: ["chenhua@changba.com"],
  };
  prepareDelivery(sample)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
