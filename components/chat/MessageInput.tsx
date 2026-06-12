"use client";

import { useState, useRef } from "react";
import { Send, Smile, PlusCircle, Image as ImageIcon } from "lucide-react";
import { useChatStore } from "@/app/store/useChatStore";
import { useAuthStore } from "@/app/store/useAuthStore"; // Import thêm authStore

export const MessageInput = () => {
  const [text, setText] = useState("");
  const { sendMessage, selectedConversation, markConversationAsRead } =
    useChatStore();
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Lấy ID người dùng hiện tại
  const userId = user?.id;

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  // Logic xử lý khi người dùng click/focus vào ô nhập liệu
  const handleFocus = () => {
    if (selectedConversation?._id && userId) {
      // Chỉ gọi API nếu thực sự có tin nhắn chưa đọc của chính mình
      // Lưu ý: unreadCount ở đây là object { [userId]: count }
      const myUnreadCount = selectedConversation.unreadCount?.[userId] || 0;

      if (myUnreadCount > 0) {
        markConversationAsRead(selectedConversation._id, userId);
      }
    }
  };

  return (
    <div className="p-3 bg-white flex items-center gap-2 ">
      <div className="flex gap-2 text-blue-600 px-1">
        {/* <PlusCircle size={22} className="cursor-pointer hover:opacity-70" /> */}
        {/* <ImageIcon size={22} className="cursor-pointer hover:opacity-70" /> */}
      </div>

      <div className="flex-1 bg-[#f0f2f5] rounded-2xl flex items-end px-3 py-1.5">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onFocus={handleFocus} // <--- Thêm sự kiện này ở đây
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
          }}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.preventDefault(), handleSend())
          }
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-transparent border-none resize-none focus:outline-none text-[15px] py-1"
        />
        {/* <Smile
          size={22}
          className="text-blue-600 mb-1 cursor-pointer hover:opacity-70"
        /> */}
      </div>

      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className={`p-2 transition-all ${
          text.trim() ? "text-blue-600" : "text-gray-300"
        }`}
      >
        <Send size={22} fill={text.trim() ? "currentColor" : "none"} />
      </button>
    </div>
  );
};
