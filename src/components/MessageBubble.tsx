import { memo, useMemo, useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { Message, StreamStats } from "../types";
import { StreamMetrics } from "./StreamMetrics";
import { Button } from "./ui/button";
import { Check, Copy, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  isSending?: boolean;
  streamStats?: StreamStats | null;
} 

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  const safeHref = href ?? "#";
  const safeTitle = title ? ` title="${title}"` : "";
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${safeTitle}>${text}</a>`;
};

export const MessageBubble = memo(({ message, onRegenerate, isSending, streamStats }: MessageBubbleProps) => {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const contentFromParts = message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') ?? '';
  const displayContent = contentFromParts || message.content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleThumbsUp = () => {
    setFeedback(feedback === 'up' ? null : 'up');
  };

  const handleThumbsDown = () => {
    setFeedback(feedback === 'down' ? null : 'down');
  };

  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const result = marked.parse(displayContent, { breaks: true, gfm: true, renderer });

    const apply = (raw: string) => {
      try {
        const cleaned = DOMPurify.sanitize(raw);
        if (!cancelled) setSanitizedHtml(cleaned);
      } catch (e) {
        console.error('DOMPurify sanitize failed:', e);
        if (!cancelled) setSanitizedHtml(raw);
      }
    };

    const isPromise = result && typeof (result as any).then === 'function';
    if (isPromise) {
      (result as Promise<string>).then(apply).catch((e) => {
        console.error('Marked parse failed:', e);
        if (!cancelled) setSanitizedHtml('');
      });
    } else {
      apply(result as string);
    }

    return () => {
      cancelled = true;
    };
  }, [displayContent]);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const [showStreamIndicator, setShowStreamIndicator] = useState<boolean>(!!message.isStreaming);
  const [streamExiting, setStreamExiting] = useState<boolean>(false);

  useEffect(() => {
    if (message.isStreaming) {
      setStreamExiting(false);
      setShowStreamIndicator(true);
      return;
    }

    // when streaming ends, animate out then hide
    if (showStreamIndicator) {
      setStreamExiting(true);
      const id = setTimeout(() => {
        setShowStreamIndicator(false);
        setStreamExiting(false);
      }, 220);
      return () => clearTimeout(id);
    }
  }, [message.isStreaming]);

  return (
    <div className={`px-6 py-5 flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="mr-3 flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${theme === 'light' ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}`}>
            AI
          </div>
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'text-right' : 'text-left'} ${isSending ? 'opacity-70' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? (theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-zinc-800 text-white')
            : (theme === 'light' ? 'bg-white text-gray-900 border border-gray-200' : 'bg-zinc-700 text-gray-100 border border-white/10')
        }`}>
          <div 
            className={`prose prose-sm ${theme === 'dark' ? 'prose-invert' : ''} max-w-full text-sm leading-relaxed ${theme === 'light' ? 'text-gray-900' : ''} [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`} 
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
            aria-live={isAssistant && message.isStreaming ? "polite" : "off"}
          />

          {isAssistant && showStreamIndicator && (
            <div className={`mt-2 stream-indicator ${streamExiting ? 'stream-exit' : 'stream-enter'}`} role="status" aria-live="polite" aria-atomic="false">
              <div className="flex items-center gap-3">
                <div className="stream-bar minimal w-full rounded-full overflow-hidden relative" aria-hidden="true">
                  <div className="stream-bar-progress minimal" />
                </div>
              </div>
            </div>
          )}
        </div>

        {isAssistant && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy} 
                className={`h-10 w-10 p-2 hover:bg-white/10 rounded-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400 ${copySuccess ? 'text-green-400' : ''}`}
                aria-label="Copy message"
              >
                {copySuccess ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleThumbsUp} 
                className={`h-10 w-10 p-2 hover:bg-white/10 rounded-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400 ${feedback === 'up' ? 'text-blue-400' : ''}`}
                aria-pressed={feedback === 'up'} 
                aria-label="Good response"
              >
                <ThumbsUp className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleThumbsDown} 
                className={`h-10 w-10 p-2 hover:bg-white/10 rounded-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400 ${feedback === 'down' ? 'text-red-400' : ''}`}
                aria-pressed={feedback === 'down'} 
                aria-label="Bad response"
              >
                <ThumbsDown className="w-5 h-5" />
              </Button>
              {onRegenerate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRegenerate} 
                  className="h-10 w-10 p-2 hover:bg-white/10 rounded-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400" 
                  aria-label="Regenerate response"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              )}
            </div>

            {streamStats && (
              <div className="ml-4 hidden md:flex items-center relative">
                <MetricsInline streamStats={streamStats} />
              </div>
            )}
          </div>
        )}

        {message.error && (
          <div className="mt-2 flex flex-col items-start gap-2">
            <div className="text-sm text-red-400 flex items-center gap-2">
              <span>⚠</span>
              <span>{message.error}</span>
            </div>
            {onRegenerate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRegenerate} 
                className="text-xs h-8 gap-2 border-red-400/30 hover:border-red-400/50 hover:bg-red-400/10"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate Response
              </Button>
            )}
          </div>
        )}
      </div>

      {isUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.isSending === nextProps.isSending &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.streamStats === nextProps.streamStats
  );
});

const MetricsInline = ({ streamStats }: { streamStats: StreamStats }) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const speed = streamStats.durationMs ? ((streamStats.tokens / streamStats.durationMs) * 1000).toFixed(1) : '0';
  const ttft = streamStats.firstTokenMs ? `${streamStats.firstTokenMs.toFixed(0)}ms` : 'N/A';
  const totalTime = streamStats.durationMs ? `${(streamStats.durationMs / 1000).toFixed(2)}s` : '0s';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="View stream metrics"
        aria-expanded={open}
        className={`text-xs rounded px-2 py-1 ${theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-white/5 text-white'} focus:outline-none focus:ring-1 focus:ring-blue-400`}
      >
        <span className="font-medium">{streamStats.modelId}</span>
        <span className="ml-2 text-gray-500">{streamStats.tokens} t</span>
        <span className="ml-2 text-gray-500">· {speed} t/s</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 z-50">
          <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-white/95 border border-gray-200 shadow-lg' : 'bg-zinc-900/95 border border-white/20 shadow-lg'}`}>
            <StreamMetrics stats={streamStats} />
          </div>
        </div>
      )}
    </div>
  );
};

MessageBubble.displayName = "MessageBubble";
