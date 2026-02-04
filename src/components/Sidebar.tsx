import { ThemePopover } from "./ThemePopover";
import { Button } from "./ui/button";
import { MessageSquarePlus, PanelLeftClose, MoreHorizontal } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useEffect, useRef, useState } from "react";

interface Conversation {
  id: string;
  title: string;
  time: string;
  messages: any[];
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleSidebar: () => void;
  themePopoverRef?: React.RefObject<HTMLDivElement>;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onToggleSidebar,
  themePopoverRef,
}: SidebarProps) {
  const { theme } = useTheme();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [openMenuId]);

  return (
    <aside className={`w-64 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-zinc-950/50 backdrop-blur-xl border-white/10'} border-r flex flex-col h-screen`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <span className={`text-sm font-semibold tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>AI Chat</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="h-10 w-10 p-0 hover:bg-white/10 shrink-0">
          <PanelLeftClose className="w-5 h-5" />
        </Button>
      </div>

      {/* New Thread Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          className={`w-full justify-start gap-2.5 h-10 font-medium transition-all shadow-sm ${theme === 'light' ? 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-900' : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white'}`}
          variant="ghost"
        >
          <MessageSquarePlus className="w-5 h-5" />
          New Thread
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length > 0 && (
          <div className="py-2">
            <div className="text-xs text-gray-500 px-3 py-2 font-semibold tracking-wider uppercase">Today</div>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div key={conv.id} className="group relative">
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all mb-1 ${
                      isActive
                        ? (theme === 'light' ? "bg-gray-100 text-gray-900 shadow-sm" : "bg-white/10 text-white shadow-sm")
                        : (theme === 'light' ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900" : "text-gray-400 hover:bg-white/5 hover:text-white")
                    }`}
                  >
                    <div className="truncate pr-6">{conv.title}</div>
                  </button>
                  {isActive && (
                    <div className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1 rounded" ref={openMenuId === conv.id ? menuRef : undefined}>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(prev => prev === conv.id ? null : conv.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                          aria-label="More options"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === conv.id}
                        >
                          <MoreHorizontal className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </button>

                        {openMenuId === conv.id && (
                          <div className={`absolute right-0 mt-2 w-36 ${theme === 'light' ? 'bg-white/95 border border-gray-200' : 'bg-zinc-900/95 border border-white/20'} rounded-xl shadow-2xl z-50`} role="menu">
                            <div className="p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-600"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className={`border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} p-3`}>
        <div className="flex items-center gap-3" ref={themePopoverRef}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
            G
          </div>
          <div className={`flex-1 text-sm truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Guest</div>
          <ThemePopover />
        </div>
      </div>
    </aside>
  );
}