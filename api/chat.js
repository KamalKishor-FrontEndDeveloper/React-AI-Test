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

    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const mistralKey = process.env.MISTRAL_API_KEY;

    if (!googleKey && !mistralKey) {
      return new Response(JSON.stringify({ error: "API keys not configured" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let llm;
    if (model.includes("mistral") || model.includes("codestral")) {
      if (!mistralKey) {
        return new Response(JSON.stringify({ error: "Mistral API key not configured" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      llm = mistral(model, { apiKey: mistralKey });
    } else if (model.includes("gemini")) {
      if (!googleKey) {
        return new Response(JSON.stringify({ error: "Google API key not configured" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      llm = google(model, { apiKey: googleKey });
    } else {
      if (!googleKey) {
        return new Response(JSON.stringify({ error: "Google API key not configured" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      llm = google("gemini-2.0-flash-exp", { apiKey: googleKey });
    }

    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({ model: llm, messages: modelMessages });
    
    return result.toDataStreamResponse();
  } catch (err) {
    console.error("API Error:", err);
    return new Response(JSON.stringify({ 
      error: "Failed to process request",
      details: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
