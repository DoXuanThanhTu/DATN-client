"use client";

import { useEffect } from "react";
import { useChatStore } from "@/app/store/useChatStore";
import { UserPlus, Search } from "lucide-react";
import { User } from "@/app/types/chat";

interface Participant {
  userId: string | User;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

export const Sidebar = () => {
  const {
    selectedConversation,
    users,
    getUsers,
    getConversations,
    onlineUsers,
    selectUser,
  } = useChatStore();

  useEffect(() => {
    getUsers();
    getConversations();
  }, [getUsers, getConversations]);

  return (
    <div className="w-80 h-full border-r bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 mb-3">Moji Chat</h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Danh sách Danh bạ */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
          Danh bạ hệ thống ({users.length})
        </div>

        <div className="divide-y divide-gray-50">
          {users.map((user: User) => {
            const isOnline = onlineUsers.includes(user._id);

            const isSelected = selectedConversation?.participants?.some(
              (p: Participant) => {
                const participantId =
                  typeof p.userId === "object" ? p.userId._id : p.userId;
                return participantId === user._id;
              },
            );

            return (
              <div
                key={user._id}
                onClick={() => selectUser(user)}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-all ${
                  isSelected ? "bg-blue-50/80 border-r-4 border-blue-500" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${user.name}`
                    }
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                    alt="avatar"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p
                      className={`font-semibold truncate ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {user.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {isOnline ? "Đang hoạt động" : "Click để nhắn tin"}
                  </p>
                </div>

                <UserPlus
                  size={16}
                  className={`transition-opacity ${
                    isSelected
                      ? "text-blue-500 opacity-100"
                      : "text-gray-300 opacity-0 group-hover:opacity-100"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
