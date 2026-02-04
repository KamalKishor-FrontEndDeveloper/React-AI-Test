import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";

export default async function POST(req) {
  try {
    const { messages, model } = await req.json();

    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const mistralKey = process.env.MISTRAL_API_KEY;

    if (!googleKey && !mistralKey) {
      return Response.json({ error: "API keys not configured" }, { status: 500 });
    }

    let llm;
    if (model.includes("mistral") || model.includes("codestral")) {
      if (!mistralKey) {
        return Response.json({ error: "Mistral API key not configured" }, { status: 500 });
      }
      llm = mistral(model, { apiKey: mistralKey });
    } else if (model.includes("gemini")) {
      if (!googleKey) {
        return Response.json({ error: "Google API key not configured" }, { status: 500 });
      }
      llm = google(model, { apiKey: googleKey });
    } else {
      if (!googleKey) {
        return Response.json({ error: "Google API key not configured" }, { status: 500 });
      }
      llm = google("gemini-2.0-flash-exp", { apiKey: googleKey });
    }

    const result = streamText({
      model: llm,
      messages: messages,
    });
    
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ 
      error: "Failed to process request",
      details: err.message
    }, { status: 500 });
  }
}
