"use client";

import { useEffect, Suspense } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// 1. Tách logic Chat vào một component con
const ChatContent = () => {
  const { conversations, selectedConversation, setSelectedConversation } =
    useChatStore();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const targetConv = conversations.find((c) => c._id === conversationId);
      if (targetConv && selectedConversation?._id !== conversationId) {
        setSelectedConversation(targetConv);
      }
    }
  }, [
    conversationId,
    conversations,
    setSelectedConversation,
    selectedConversation?._id,
  ]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f0ece4" }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
};

// 2. Component chính bọc Suspense để vượt qua bước build
const ChatPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#f0ece4]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-sm text-gray-500 font-medium">
              Đang tải cuộc hội thoại...
            </p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
};

export default ChatPage;
