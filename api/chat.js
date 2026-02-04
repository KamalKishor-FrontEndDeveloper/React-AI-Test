import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, model } = await req.json();

    let llm;
    if (model.includes("mistral") || model.includes("codestral")) {
      llm = mistral(model);
    } else if (model.includes("gemini")) {
      llm = google(model);
    } else if (model.includes("gpt")) {
      llm = google("gemini-2.0-flash-exp");
    } else {
      llm = google("gemini-2.0-flash-exp");
    }

    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({ model: llm, messages: modelMessages });
    
    return result.toDataStreamResponse();
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
