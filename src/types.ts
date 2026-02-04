export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
  // Optional UI message parts (e.g., { type: 'text' | 'data-weather' | 'source', text?, data?, value? })
  parts?: Array<Record<string, any>>;
  // Optional metadata attached to the message (model info, tokens, etc.)
  metadata?: Record<string, any> | null;
}

export type StreamStats = {
  modelId: string;
  startedAt: number;
  tokens: number;
  firstTokenMs?: number;
  durationMs?: number;
};

export type ModelOption = {
  id: string;
  label: string;
  description: string;
};
