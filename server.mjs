import "dotenv/config";
import express from "express";
import { streamText, convertToModelMessages } from "ai"; 
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;

    let llm;
    if (model.includes("mistral") || model.includes("devstral")) {
      llm = mistral("mistral-small-latest");
    } else if (model.includes("gemini")) {
      llm = google(model);
    } else {
      llm = google("gemini-3-flash-preview");
    }

    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({ model: llm, messages: modelMessages });
    result.pipeUIMessageStreamToResponse(res);
  } catch (err) {
    console.error("Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    }
  }
});

app.post("/api/telemetry", async (req, res) => {
  try {
    const entry = { receivedAt: new Date().toISOString(), ...(req.body || {}) };
    await fs.appendFile('telemetry.log', JSON.stringify(entry) + '\n');
    res.status(200).json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));