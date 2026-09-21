import { DeliveryRequest } from "./content_workflow.ts";

const valid = {
  requestId: "test-release",
  creator: "Mina Studio",
  title: "Field notes",
  excerpt: "A useful excerpt that is long enough for the request boundary.",
  assetUrl: "https://cdn.example.com/notes.pdf",
  subscribers: ["reader@example.com"],
};

if (!DeliveryRequest.safeParse(valid).success) throw new Error("valid release was rejected");
const rejected = DeliveryRequest.safeParse({ ...valid, subscribers: [] });
if (rejected.success) throw new Error("empty subscriber list was accepted");
console.log("content request boundary: ok");
