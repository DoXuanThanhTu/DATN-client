"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useChatStore } from "@/app/store/useChatStore";

export const SocketManager = () => {
  const { user } = useAuthStore();
  const { connectSocket, disconnectSocket, socket } = useChatStore();

  // Dùng ref để theo dõi ID đã xử lý, tránh vòng lặp re-render
  const lastProcessedUserId = useRef<string | null>(null);

  useEffect(() => {
    const currentId = user?.id;

    if (currentId) {
      // Nếu ID khác với ID trước đó HOẶC chưa có socket
      if (lastProcessedUserId.current !== currentId || !socket) {
        connectSocket(currentId);
        lastProcessedUserId.current = currentId;
        console.log("🚀 SocketManager: Initializing connection for", currentId);
      }
    } else {
      // Khi user logout (user trở về null)
      if (lastProcessedUserId.current) {
        disconnectSocket();
        lastProcessedUserId.current = null;
        console.log("🔌 SocketManager: User logged out, disconnected");
      }
    }

    // Lưu ý: Chúng ta loại bỏ socket?.connected khỏi dependency
    // để tránh việc useEffect bị kích hoạt sai thời điểm.
  }, [user?.id, connectSocket, disconnectSocket, !!socket]);

  return null;
};
