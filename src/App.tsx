import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTheme } from "./components/ThemeProvider";
import { ChatHeader } from "./components/ChatHeader";
import { Sidebar } from "./components/Sidebar";
import { MessageList } from "./components/MessageList";
import { StreamMetrics } from "./components/StreamMetrics";
import { ChatInput } from "./components/ChatInput";
import { useChat as useAppChat } from "./hooks/useChat";

interface Conversation {
  id: string;
  title: string;
  time: string;
  messages: any[];
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = localStorage.getItem('chat-conversations');
    return stored ? JSON.parse(stored) : [
      { id: "c1", title: "New Conversation", time: "Today", messages: [] }
    ];
  });
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id || 'c1');

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('chat-conversations', JSON.stringify(conversations));
    }, 300);
    return () => clearTimeout(id);
  }, [conversations]);


  const {
    chat,
    messages,
    modelId,
    resetChat,
    setModelId,
    loadConversation,
    trimConversation,
    notification,
    archivedCount,
    isStreaming,
    streamStats,
    sendMessage,
    stopStreaming,
    retryLast,
  } = useAppChat();

  const { theme } = useTheme();

  const handleRegenerateMessage = useCallback((messageId: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex >= 0) {
      const previousUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
      if (previousUserMsg) {
        sendMessage(previousUserMsg.content);
      }
    }
  }, [messages, sendMessage]);

  const handleSuggestion = useCallback((text: string) => sendMessage(text), [sendMessage]);

  const handleNewConversation = () => {
    const newId = `c${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      time: "Today",
      messages: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    resetChat();
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId);
      if (conversationId === activeConversationId && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
        loadConversation(filtered[0].messages);
      } else if (filtered.length === 0) {
        handleNewConversation();
      }
      return filtered;
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      loadConversation(conversation.messages);
    }
  };

  // Update conversation messages when chat messages change
  useEffect(() => {
    if (messages.length > 0) {
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversationId 
          ? { ...conv, messages: [...messages], title: messages[0]?.content.slice(0, 30) + '...' || 'New Conversation' }
          : conv
      ));
    }
  }, [messages, activeConversationId]);

  const [showModelSelector, setShowModelSelector] = useState(false);

  return (
    <div className={`h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-gradient-to-br from-black via-zinc-950 to-black text-white'} flex overflow-hidden`}>
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          modelId={modelId}
          onModelChange={setModelId}
          showModelSelector={showModelSelector}
          onToggleModelSelector={() => setShowModelSelector(!showModelSelector)}
          onTrimConversation={() => trimConversation()}
          streamStats={streamStats}
          isStreaming={isStreaming}
        />
        {notification && (
          <div className={`px-6 py-3 flex items-center gap-4 text-sm ${notification.level === 'error' ? (theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900/20 text-red-200') : (theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/20 text-blue-200')}`} role="status" aria-live="polite">
            <div className="flex-1">{notification.message}</div>
            {notification.level === 'error' && (
              <div className="flex items-center gap-2">
                <button onClick={() => retryLast()} className="px-3 py-1 rounded-md bg-white/90 text-black hover:bg-gray-200">Retry</button>
              </div>
            )}
          </div>
        )}
        <main className="flex-1 flex flex-col overflow-hidden">
          <MessageList 
            messages={messages} 
            archivedCount={archivedCount} 
            isStreaming={isStreaming}
            streamStats={streamStats}
            onRegenerateMessage={handleRegenerateMessage}
            onSuggestion={handleSuggestion}
          />
          <StreamMetrics stats={streamStats} />
          <ChatInput isStreaming={isStreaming} onSend={sendMessage} onStop={stopStreaming} modelId={modelId} />
        </main>
      </div>
    </div>
  );
}

