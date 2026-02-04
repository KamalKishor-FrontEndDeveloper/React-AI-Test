import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Paperclip, ArrowUp, Square } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ChatInputProps {
  isStreaming: boolean;
  isOnline?: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
  modelId: string;
}

export function ChatInput({ isStreaming, isOnline = true, onSend, onStop, modelId }: ChatInputProps) {
  const { theme } = useTheme();

  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [onSend, value, isStreaming]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const suggestions = [
    "Explain React hooks",
    "Write a poem about AI",
    "What's quantum computing?",
  ];

  return (
    <div className={theme === 'light' ? 'border-t border-gray-200 bg-white' : 'border-t border-white/10'}>
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className={`relative rounded-3xl border ${
            theme === 'light'
              ? 'border-gray-200 bg-white focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 hover:border-gray-300'
              : 'border-white/10 bg-zinc-900 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 hover:border-white/20'
          } transition-colors`}>
          <div className="flex items-end gap-3 p-4">
            <button
              type="button"
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${theme === 'light' ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              aria-label="Attach file"
              disabled={isStreaming || !isOnline}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className={`flex-1 resize-none overflow-hidden bg-transparent outline-none text-base min-h-[28px] max-h-40 py-1.5 leading-relaxed ${theme === 'light' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-gray-500'}`}
              aria-label="Message input"
              disabled={isStreaming || !isOnline}
              rows={1}
            />

            {isStreaming ? (
              <button
                onClick={onStop}
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                aria-label="Stop generating"
              >
                <Square className={`w-5 h-5 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim() || !isOnline}
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                  value.trim()
                    ? theme === 'light'
                      ? 'bg-white hover:bg-gray-200 text-black'
                      : 'bg-white hover:bg-gray-200 text-black'
                    : theme === 'light'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <ArrowUp className={`w-5 h-5 ${value.trim() ? (theme === 'light' ? 'text-black' : 'text-black') : (theme === 'light' ? 'text-gray-400' : 'text-zinc-600')}`} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        { !isOnline && (
          <div className="mt-2 px-1 text-xs text-yellow-700 text-center">You are offline. Messages will be queued until you are back online.</div>
        )}

        <div className={`mt-2 px-1 text-xs flex items-center justify-center gap-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          <span className="flex items-center gap-1">
            <kbd className={`${theme === 'light' ? 'px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700 text-[10px]' : 'px-1.5 py-0.5 bg-zinc-900 border border-white/10 rounded text-gray-500 text-[10px]'}`}>↵</kbd>
            <span>send</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className={`${theme === 'light' ? 'px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700 text-[10px]' : 'px-1.5 py-0.5 bg-zinc-900 border border-white/10 rounded text-gray-500 text-[10px]'}`}>⇧↵</kbd>
            <span>new line</span>
          </span>
        </div>
      </div>
    </div>
  );
}