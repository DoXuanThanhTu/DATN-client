"use client";

import { useEffect, useMemo } from "react";
import { useChatStore } from "@/app/store/useChatStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { MessageSquare, ArrowLeft, Search } from "lucide-react";
import { Conversation, User } from "@/app/types/chat";
import { useRouter, useSearchParams } from "next/navigation";

export const Sidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");

  const {
    conversations,
    selectedConversation,
    onlineUsers,
    getConversations,
    setSelectedConversation,
    getMessages,
  } = useChatStore();

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;

  // 1. Lấy danh sách hội thoại khi component mount
  useEffect(() => {
    getConversations();
  }, [getConversations]);

  // 2. Tự động chọn hội thoại dựa trên URL params (?conversationId=...)
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const target = conversations.find((c) => c._id === conversationIdFromUrl);
      // Chỉ set nếu chưa chọn hoặc chọn sai hội thoại
      if (target && selectedConversation?._id !== conversationIdFromUrl) {
        setSelectedConversation(target);
        getMessages(target._id);
      }
    }
  }, [
    conversationIdFromUrl,
    conversations,
    setSelectedConversation,
    getMessages,
    selectedConversation?._id,
  ]);

  // Lọc danh sách hội thoại của người dùng hiện tại
  const myConversations = useMemo(() => {
    if (!currentUserId) return [];
    return conversations.filter((conv) =>
      conv.participants?.some(
        (p) =>
          String(typeof p.userId === "string" ? p.userId : p.userId._id) ===
          String(currentUserId),
      ),
    );
  }, [conversations, currentUserId]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    getMessages(conv._id);
    // Cập nhật URL mà không làm reload trang để đồng bộ với state
    router.push(`/chat?conversationId=${conv._id}`, { scroll: false });
  };

  return (
    <div className="w-80 md:w-96 h-full flex flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="px-5 py-5 flex flex-col gap-4 border-b border-gray-50 sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button> */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Tin nhắn
              </h1>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                {myConversations.length} cuộc trò chuyện
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
            <MessageSquare size={18} />
          </div>
        </div>

        {/* Search Bar giả lập */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* Danh sách hội thoại */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="py-2">
          {myConversations.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">
                Chưa có cuộc hội thoại nào
              </p>
            </div>
          ) : (
            myConversations.map((conv) => {
              const otherParticipant = conv.participants?.find(
                (p) =>
                  String(
                    typeof p.userId === "string" ? p.userId : p.userId._id,
                  ) !== String(currentUserId),
              );
              const other = otherParticipant?.userId as User;
              if (!other) return null;

              const isSelected = selectedConversation?._id === conv._id;
              const isOnline = onlineUsers.includes(other._id);

              // Lấy số tin nhắn chưa đọc của tôi trong hội thoại này
              const currentUserIdStr = String(currentUserId);
              const myUnreadCount = conv.unreadCount?.[currentUserIdStr] || 0;

              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group relative flex items-center gap-4 px-5 py-4 cursor-pointer transition-all ${
                    isSelected ? "bg-blue-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar & Online Status */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        other.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`
                      }
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        isSelected ? "border-blue-200" : "border-transparent"
                      } transition-all`}
                      alt={other.name}
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p
                        className={`text-sm truncate ${
                          isSelected || myUnreadCount > 0
                            ? "font-bold text-gray-900"
                            : "font-semibold text-gray-700"
                        }`}
                      >
                        {other.name}
                      </p>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(
                            conv.lastMessage.createdAt,
                          ).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                            ? new Date(
                                conv.lastMessage.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : new Date(
                                conv.lastMessage.createdAt,
                              ).toLocaleDateString([], {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <p
                        // className={`text-xs truncate ${
                        //   myUnreadCount > 0
                        //     ? "font-bold text-blue-600"
                        //     : "text-gray-500"
                        // }`}
                        className="text-xs truncate text-gray-500"
                      >
                        {conv.lastMessage?.senderId === currentUserId
                          ? "Bạn: "
                          : ""}
                        {conv.lastMessage?.content || "Bắt đầu trò chuyện ngay"}
                      </p>

                      {/* Badge số tin nhắn chưa đọc */}
                      {/* {myUnreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                          {myUnreadCount > 9 ? "9+" : myUnreadCount}
                        </span>
                      )} */}
                    </div>
                  </div>

                  {/* Indicator cho hội thoại đang chọn */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
