import { memo, useEffect, useRef, useCallback } from "react";
import type { Message, StreamStats } from "../types";
import { MessageBubble } from "./MessageBubble";
import { Sparkles } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  archivedCount: number;
  isStreaming: boolean;
  streamStats?: StreamStats | null;
  onRegenerateMessage?: (messageId: string) => void;
  suggestions?: string[];
  onSuggestion?: (suggestion: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  "Explain quantum computing",
  "Write a short story",
  "How does ML work?",
  "Recipe for chocolate cake"
];

import { useTheme } from "./ThemeProvider";

export const MessageList = memo(({ 
  messages, 
  archivedCount, 
  isStreaming,
  streamStats,
  onRegenerateMessage,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestion
}: MessageListProps & { streamStats?: StreamStats | null }) => {
  const { theme } = useTheme();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollEnabled = useRef(true);
  const prevMessagesLength = useRef(messages.length);

  const hasUserMessage = messages.some((message) => message.role === "user");

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    // If within 50px of bottom, enable auto-scroll
    // We increase threshold slightly to be more forgiving
    isAutoScrollEnabled.current = distanceToBottom < 60;
  }, []);

  // Monitor DOM size changes (rendering markdown, images, etc) to keep scroll at bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    const scrollArea = parentRef.current;
    if (!container || !scrollArea) return;

    const observer = new ResizeObserver(() => {
      if (isAutoScrollEnabled.current) {
        // Use instant scroll to prevent jitter/lag during streaming
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "auto" });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!parentRef.current) return;
    
    // This effect now primarily handles the "New Message" event trigger
    // The ResizeObserver handles the continuous growth of content
    const isNewMessage = messages.length > prevMessagesLength.current;
    
    // If it's a new user message, we might want to force scroll even if slightly scrolled up
    if (isNewMessage && messages[messages.length-1].role === 'user') {
       isAutoScrollEnabled.current = true;
       parentRef.current.scrollTo({ top: parentRef.current.scrollHeight, behavior: "smooth" });
    }

    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    // When streaming stops, ensure the final assistant message is visible if auto-scroll is enabled
    if (!parentRef.current) return;

    // If streaming has just stopped and user is at bottom, scroll to show final content
    if (!isStreaming && isAutoScrollEnabled.current) {
      requestAnimationFrame(() => {
        parentRef.current!.scrollTo({ top: parentRef.current!.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [isStreaming]);


  const renderWelcome = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="text-center mb-16">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 shadow-2xl shadow-purple-500/30 animate-pulse ${theme === 'light' ? 'bg-gradient-to-br from-blue-400 to-purple-300' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'}`}>
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-5xl font-bold mb-4 tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Hello there!</h1>
        <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-xl`}>How can I help you today?</p>
      </div>
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              className={`p-5 rounded-2xl border text-left text-sm transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] backdrop-blur-sm ${theme === 'light' ? 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200' : 'border-white/10 bg-zinc-900/50 text-gray-300 hover:bg-white/5 hover:border-white/20'}`}
              onClick={() => onSuggestion?.(s)}
            >
              <div className="font-medium">{s}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  ), [suggestions, onSuggestion]);

  const showThinking = isStreaming && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div 
      ref={parentRef} 
      onScroll={handleScroll} 
      className="flex-1 overflow-auto focus:outline-none" 
      tabIndex={0} 
      aria-label="Chat History"
    >
      {!hasUserMessage && renderWelcome()}

      {archivedCount > 0 && (
        <div className="px-6 py-2 text-xs text-center text-gray-400" aria-live="polite">
          {archivedCount} earlier messages hidden for performance.
        </div>
      )}

      <div ref={messagesContainerRef} className="flex flex-col pb-4">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isSending = isLast && message.role === "user" && isStreaming;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isSending={isSending}
              streamStats={streamStats}
              onRegenerate={message.role === 'assistant' ? () => onRegenerateMessage?.(message.id) : undefined}
            />
          );
        })}

        {showThinking && (
          <div className="px-6 py-4 flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300" role="status" aria-live="polite">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 shadow-sm">
              <div className="spinner w-4 h-4 rounded-full inline-block mr-2" aria-hidden="true" />
              <span className="text-sm text-gray-400 font-medium">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageList.displayName = "MessageList";
