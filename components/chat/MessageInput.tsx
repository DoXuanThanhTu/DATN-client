import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Smile } from "lucide-react";
import { useChatStore } from "@/app/store/useChatStore";

export const MessageInput = () => {
  const [text, setText] = useState("");
  const { sendMessage, socket, selectedConversation } = useChatStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await sendMessage(text);
    setText("");

    socket?.emit("stop_typing", {
      conversationId: selectedConversation?._id,
      userId: "MY_ID",
    });
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    socket.emit("typing", {
      conversationId: selectedConversation._id,
      userId: "MY_ID",
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: selectedConversation._id,
        userId: "MY_ID",
      });
    }, 2000);
  };

  return (
    <div className="p-4 bg-white border-t">
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ImageIcon size={20} />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
