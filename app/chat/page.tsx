"use client";

import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";

const ChatPage = () => {
  const { connectSocket, disconnectSocket } = useChatStore();

  const currentUserId = "123";

  useEffect(() => {
    connectSocket(currentUserId);
    return () => disconnectSocket();
  }, [currentUserId]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
};

export default ChatPage;
