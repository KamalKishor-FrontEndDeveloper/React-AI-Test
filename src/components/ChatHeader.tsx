import { MODEL_OPTIONS } from "../config/models";
import type { ModelOption } from "../types";
import { Button } from "./ui/button";
import { Menu, ChevronDown, Sparkles, Check, Scissors } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { StreamMetrics } from "./StreamMetrics";
import type { StreamStats } from "../types";
import { useTheme } from "./ThemeProvider";
import { PopoverContent } from "./ui/popover";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  modelId: string;
  onModelChange: (modelId: string) => void;
  showModelSelector: boolean;
  onToggleModelSelector: () => void;
  onTrimConversation?: () => void;
  streamStats?: StreamStats | null;
  isStreaming?: boolean;
} 

export function ChatHeader({
  onToggleSidebar,
  sidebarOpen,
  modelId,
  onModelChange,
  showModelSelector,
  onToggleModelSelector,
  onTrimConversation,
  streamStats,
  isStreaming,
}: ChatHeaderProps) {
  const { theme } = useTheme();
  const selectedModel = MODEL_OPTIONS.find((m: ModelOption) => m.id === modelId);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onToggleModelSelector();
      }
      if (showMetrics && metricsRef.current && !metricsRef.current.contains(e.target as Node)) {
        setShowMetrics(false);
      }
    };

    if (showModelSelector || showMetrics) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelSelector, onToggleModelSelector, showMetrics]);

  const triggerClass = theme === 'light'
    ? "flex items-center gap-2 px-3 py-2 h-10 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
    : "flex items-center gap-2 px-3 py-2 h-10 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all";

  const popoverClass = theme === 'light'
    ? "left-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl shadow-black/6 z-60"
    : "left-0 top-full mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-black/50 z-60";

  return (
    <header className={`flex items-center gap-3 px-4 py-3.5 border-b ${theme === 'light' ? 'border-gray-200 bg-white/60 text-black' : 'border-white/10 bg-black/40 text-white'} backdrop-blur-sm`} role="banner">
      {!sidebarOpen && (
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="h-10 w-10 p-0 hover:bg-white/10">
          <Menu className="w-6 h-6" />
        </Button>
      )}

      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          onClick={onToggleModelSelector}
          className={triggerClass}
          aria-label="Select model"
          aria-expanded={showModelSelector}
        >
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold">{selectedModel?.label || "Select Model"}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>

        {showModelSelector && (
          <PopoverContent className={popoverClass}>
            <div className="p-1">
              {MODEL_OPTIONS.map((model: ModelOption) => (
                <button
                  key={model.id}
                  className={`flex items-start justify-between w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 ${
                    model.id === modelId ? (theme === 'light' ? "bg-gray-100 text-gray-900 border border-gray-200 shadow-sm" : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-sm") : (theme === 'light' ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900" : "text-gray-400 hover:bg-white/5 hover:text-white")
                  }`}
                  type="button"
                  onClick={() => {
                    onModelChange(model.id);
                    onToggleModelSelector();
                  }}
                  role="menuitem"
                >
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{model.label}</div>
                    <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{model.description}</div>
                  </div>
                  {model.id === modelId && <Check className="w-4 h-4 text-blue-400 mt-0.5 ml-2" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={metricsRef}>
          <button
            type="button"
            onClick={() => setShowMetrics((s) => !s)}
            className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg focus:outline-none focus:ring-1 ${theme === 'light' ? 'bg-gray-100 text-gray-900 focus:ring-gray-300' : 'bg-white/5 text-white focus:ring-white/10'}`}
            aria-label="View stream metrics"
            aria-expanded={showMetrics}
          >
            <span className="text-sm font-medium" aria-live="polite">{streamStats ? `${streamStats.tokens} t` : '—'}</span>
            <span className="text-xs text-gray-400">{streamStats?.durationMs ? `${(streamStats.durationMs/1000).toFixed(2)}s` : ''}</span>
            {isStreaming && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden />}
          </button>

          {showMetrics && (
            <PopoverContent className={popoverClass}>
              <div className="p-3">
                <StreamMetrics stats={streamStats ?? null} />
              </div>
            </PopoverContent>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Trim conversation and summarize earlier messages?')) {
              onTrimConversation?.();
            }
          }} className="h-10 w-10 p-0 hover:bg-white/10" aria-label="Trim conversation">
          <Scissors className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1" />
    </header>
  );
}
