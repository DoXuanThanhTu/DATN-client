"use client";
import { useChatStore } from "@/app/store/useChatStore";
import { useEffect, useRef, useState, useMemo } from "react";
import { MessageInput } from "./MessageInput";
import { useAuthStore } from "@/app/store/useAuthStore";

interface UserDetail {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

interface Participant {
  userId: string | UserDetail;
}

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

export const ChatContainer = () => {
  const {
    selectedConversation,
    messages,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    socket,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    const conversationId = selectedConversation?._id;

    if (conversationId && conversationId !== "new" && socket) {
      getMessages(conversationId);
      socket.emit("join_conversation", conversationId);
      subscribeToMessages();
    }

    return () => {
      if (conversationId && conversationId !== "new" && socket) {
        socket.emit("leave_conversation", conversationId);
      }
      unsubscribeFromMessages();
    };
  }, [
    selectedConversation?._id,
    socket,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ userId }: { userId: string }) =>
      setTypingUser(userId);
    const handleStopTyping = () => setTypingUser(null);

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
    };
  }, [socket]);

  const displayName = useMemo(() => {
    if (!selectedConversation || !currentUserId) return "Đang tải...";

    const otherParticipant = selectedConversation.participants?.find((p) => {
      const pId =
        typeof p.userId === "object" ? p.userId._id || p.userId.id : p.userId;

      return String(pId) !== String(currentUserId);
    });

    if (!otherParticipant) return "Cuộc trò chuyện";

    const user = otherParticipant.userId;

    if (typeof user === "object" && user !== null) {
      const nameCandidate = user.name;

      if (nameCandidate) return nameCandidate;

      return `Người dùng ${String(user._id).slice(-4)}`;
    }

    return "Người dùng";
  }, [selectedConversation, currentUserId]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 opacity-50">
        <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 sticky top-0 bg-white z-10 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-inner">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-gray-800">{displayName}</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
        {messages.map((m: Message, index: number) => {
          const isMe = m.senderId === currentUserId;
          return (
            <div
              key={m._id || `temp-${index}`}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 px-4 rounded-2xl shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                }`}
              >
                <p className="text-sm leading-relaxed">{m.content}</p>
                <span
                  className={`text-[10px] block mt-1 text-right ${isMe ? "text-blue-100" : "text-gray-400"}`}
                >
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <MessageInput />
    </div>
  );
};
