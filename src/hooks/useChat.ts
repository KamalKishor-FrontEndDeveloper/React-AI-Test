import { useChat as useVercelChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MODEL_OPTIONS } from "../config/models";
import type { StreamStats, Message } from "../types";

const MAX_VISIBLE_MESSAGES = 60;

type NotificationState = {
  message: string;
  level: "info" | "warning" | "error";
};

const extractTextContent = (message: any): string => {
  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part?.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join(" ")
      .trim();
  }

  return "";
};

const toUiMessage = (message: Message) => ({
  id: message.id,
  role: message.role,
  parts:
    message.parts && message.parts.length > 0
      ? message.parts
      : [
          {
            type: "text",
            text: message.content,
          },
        ],
  metadata: message.metadata ?? undefined,
});

export function useChat() {
  const [modelId, setModelId] = useState<string>(() => MODEL_OPTIONS[6]?.id || "mistral-small");
  const [archivedCount, setArchivedCount] = useState(0);
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [firstTokenTime, setFirstTokenTime] = useState<number | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [input, setInput] = useState("");

  const modelIdRef = useRef(modelId);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: modelIdRef.current }),
      }),
    []
  );

  // retry helper reference for last failed action
  const lastRetryRef = useRef<(() => void | Promise<void>) | null>(null);

  const sendTelemetry = useCallback((payload: any) => {
    console.log("telemetry:", payload);
  }, []);

  const chatHelpers = useVercelChat({
    transport: chatTransport,
    messages: [],
    onFinish: ({ message }) => {
      const duration = performance.now() - startTime;
      const tokens = extractTextContent(message).split(/\s+/).filter(Boolean).length;
      setStreamStats((prev) =>
        prev
          ? {
              ...prev,
              tokens,
              durationMs: duration,
            }
          : null
      );
      sendTelemetry({ event: "stream_finish", model: modelIdRef.current, durationMs: duration, tokens });
    },
    onError: (error: any) => {
      console.warn("Chat error:", error);
      setNotification({ message: (error as any)?.message || "Chat error", level: "error" });
      // set retry action to reload by default
      lastRetryRef.current = () => reload();
      sendTelemetry({ event: "error", error: String(error) });
    },
  });

  // online/offline detection
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setNotification({ message: "Back online", level: "info" });
    };
    const onOffline = () => {
      setIsOnline(false);
      setNotification({ message: "You appear to be offline", level: "warning" });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);


  const {
    messages: aiMessages,
    sendMessage: sendChatMessage,
    stop,
    status,
    error: aiError,
    regenerate,
    setMessages: setAiMessages,
  } = chatHelpers;

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = isLoading;

  const beginStream = useCallback(() => {
    const now = performance.now();
    setStartTime(now);
    setFirstTokenTime(null);
    setStreamStats({
      modelId: modelIdRef.current,
      startedAt: now,
      tokens: 0,
    });
  }, []);

  const handleInputChange = useCallback((event: any) => {
    setInput(event.target.value);
  }, []);

  const append = useCallback(
    async (message: any) => {
      if (message?.role === "user" || message?.role === undefined) {
        beginStream();
      }

      const maxAttempts = 3;
      const isTransientError = (err: any) => {
        const status = err?.status || err?.code;
        if (!status) return true; // network-like error
        const s = Number(status);
        return isNaN(s) ? false : s >= 500 || s === 429;
      };

      const doSend = async () => {
        if (Array.isArray(message?.parts) && message.parts.length > 0) {
          await sendChatMessage({
            id: message.id,
            role: message.role,
            parts: message.parts,
            metadata: message.metadata ?? undefined,
          });
          return;
        }

        if (typeof message?.content === "string") {
          await sendChatMessage({
            text: message.content,
            metadata: message.metadata ?? undefined,
          });
        }
      };

      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          await doSend();
          // success: clear retry
          lastRetryRef.current = null;
          return;
        } catch (err) {
          attempt += 1;
          const transient = isTransientError(err);
          sendTelemetry({ event: "send_error", err: String(err), transient, attempt });
          if (!transient || attempt >= maxAttempts) {
            setNotification({ message: (err as any)?.message || "Failed to send message", level: "error" });
            // store retry action for UI
            lastRetryRef.current = () => append(message);
            console.warn("send failed:", err);
            return;
          }

          // backoff with jitter (shorter when running tests)
          const base = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE === 'test') ? 10 : 500;
          const backoff = base * Math.pow(2, attempt) + Math.random() * 300;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    },
    [beginStream, sendChatMessage, sendTelemetry]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) {
        return;
      }

      await append({
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      });
    },
    [append, isLoading]
  );

  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      if (!input.trim()) {
        return;
      }

      const value = input.trim();
      setInput("");
      sendMessage(value);
    },
    [input, sendMessage]
  );

  useEffect(() => {
    if (isLoading && aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      if (lastMessage.role === "assistant") {
        const tokens = extractTextContent(lastMessage).split(/\s+/).filter(Boolean).length;

        if (!firstTokenTime && tokens > 0) {
          setFirstTokenTime(performance.now());
        }

        setStreamStats((prev) =>
          prev
            ? {
                ...prev,
                tokens,
                firstTokenMs: firstTokenTime ? firstTokenTime - startTime : undefined,
              }
            : null
        );
      }
    }
  }, [aiMessages, isLoading, firstTokenTime, startTime]);

  useEffect(() => {
    if (aiMessages.length === 0) return;
    const lastMessage = aiMessages[aiMessages.length - 1];
    const parts = (lastMessage as any).parts ?? [];
    const notif = parts.find((p: any) => p?.type === "data-notification");
    if (notif) {
      setNotification(notif.data);
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [aiMessages]);

  const messages: Message[] = useMemo(() => {
    return aiMessages.map((msg: any, index: number) => {
      const content = extractTextContent(msg);
      const createdAtValue =
        (msg.createdAt instanceof Date ? msg.createdAt.getTime() : msg.createdAt) || Date.now();

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content,
        createdAt: createdAtValue,
        isStreaming: isLoading && index === aiMessages.length - 1,
        parts: (msg as any).parts ?? undefined,
        metadata: (msg as any).metadata ?? null,
      };
    });
  }, [aiMessages, isLoading]);

  const visibleMessages = useMemo(() => {
    if (messages.length <= MAX_VISIBLE_MESSAGES) {
      return { messages, archivedCount: 0 };
    }
    const overflow = messages.length - MAX_VISIBLE_MESSAGES;
    return {
      messages: messages.slice(-MAX_VISIBLE_MESSAGES),
      archivedCount: overflow,
    };
  }, [messages]);

  useEffect(() => {
    setArchivedCount(visibleMessages.archivedCount);
  }, [visibleMessages.archivedCount]);

  const reload = useCallback(() => {
    beginStream();
    return regenerate();
  }, [beginStream, regenerate]);

  const retryLast = useCallback(() => {
    if (lastRetryRef.current) {
      try {
        const res = lastRetryRef.current();
        return res;
      } catch (e) {
        // ignore
      }
    }
    return reload();
  }, [reload]);

  const resetChat = useCallback(() => {
    stop();
    setAiMessages([]);
    setStreamStats(null);
    setArchivedCount(0);
  }, [stop, setAiMessages]);

  const stopStreaming = useCallback(() => {
    stop();
  }, [stop]);

  const loadConversation = useCallback(
    (conversationMessages: Message[]) => {
      stop();
      const aiSdkMessages = conversationMessages.map(toUiMessage);
      setAiMessages(aiSdkMessages as any);
      setStreamStats(null);
    },
    [stop, setAiMessages]
  );

  const trimConversation = useCallback((keep = 12) => {
    stop();
    setStreamStats(null);
    setAiMessages((prev) => {
      if (!prev || prev.length <= keep) return prev;
      const overflow = prev.length - keep;
      const summaryText = `Summary: ${overflow} earlier messages trimmed.`;
      const summaryMsg = {
        id: `summary-${Date.now()}`,
        role: "system",
        parts: [{ type: "text", text: summaryText }],
        metadata: { summary: true },
      };
      const newMsgs = [...prev.slice(-keep)];
      newMsgs.unshift(summaryMsg as any);
      return newMsgs as any;
    });
  }, [stop, setAiMessages]);

  return {
    chat: {
      ...chatHelpers,
      input,
      handleInputChange,
      handleSubmit,
      append,
      isLoading,
      reload,
    },
    archivedCount,
    error: aiError?.message || null,
    isStreaming,
    messages: visibleMessages.messages,
    modelId,
    streamStats,
    notification,
    retryLast,
    resetChat,
    stopStreaming,
    sendMessage,
    setModelId,
    loadConversation,
    trimConversation,
  };
}
