import type { ModelOption } from "../types";

export const MODEL_OPTIONS: ModelOption[] = [
  // --- OpenAI Series (2026 Standard) ---
  {
    id: "gpt-5.2",
    label: "GPT-5.2",
    description: "New flagship standard; highly conversational with adaptive tone."
  },
  {
    id: "o4-mini", // Released late 2025/early 2026
    label: "OpenAI o4 Mini",
    description: "Ultra-fast reasoning for high-volume tasks."
  },
  {
    id: "gpt-5.1-codex-max",
    label: "GPT-5.1 Codex Max",
    description: "Frontier agentic model built for project-scale coding."
  },

  // --- Google Gemini Series (Gemini 3 Era) ---
  {
    id: "gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    description: "Google's new default; PhD-level reasoning at lightning speed."
  },
  {
    id: "gemini-3-pro-preview",
    label: "Gemini 3 Pro",
    description: "Most intelligent multimodal model for advanced math and logic."
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Stable legacy model for high-throughput agentic workflows."
  },

  // --- Mistral AI Series (Mistral 3 Era) ---
  {
    id: "mistral-large-3",
    label: "Mistral Large 3",
    description: "Flagship sparse MoE model with 256k context."
  },
  {
    id: "ministral-3-14b",
    label: "Ministral 3 (14B)",
    description: "Best-in-class intelligence for edge and local deployment."
  },
  {
    id: "magistral-medium-1.2",
    label: "Magistral Medium",
    description: "Specialized model for transparent, multilingual reasoning."
  },

  // --- Developer & Niche Models ---
  {
    id: "devstral-2",
    label: "Devstral 2",
    description: "Frontier code agent model for complex software engineering."
  }
];
