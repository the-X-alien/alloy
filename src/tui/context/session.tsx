import React, { createContext, useContext, useState, useCallback } from "react";
import type { ChatMessage } from "../../providers/interface.js";

interface SessionContextType {
  messages: ChatMessage[];
  streaming: boolean;
  streamContent: string;
  addMessage: (msg: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setStreaming: (v: boolean) => void;
  setStreamContent: (v: string) => void;
  clearMessages: () => void;
}

const SessionContext = createContext<SessionContextType>(null!);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamContent("");
    setStreaming(false);
  }, []);

  return (
    <SessionContext.Provider value={{
      messages, streaming, streamContent,
      addMessage, setMessages, setStreaming, setStreamContent, clearMessages,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}
