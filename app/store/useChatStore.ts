"use client";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Message, Conversation, User, Participant } from "../types/chat";
import api from "../services/api";

interface OfferDetails {
  productId: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  offeredPrice: number;
  status?: "pending" | "accepted" | "rejected";
}

interface Notification {
  _id: string;
  receiver: string;
  sender: User;
  type: "CHAT" | "SYSTEM" | "OFFER";
  title: string;
  content: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const messageType = {
  text: "text",
  offer: "offer",
} as const;

type MessageType = (typeof messageType)[keyof typeof messageType];

interface ChatState {
  // Chat States
  socket: Socket | null;
  onlineUsers: string[];
  conversations: Conversation[];
  messages: Message[];
  selectedConversation: Conversation | null;
  isMessagesLoading: boolean;
  users: User[];

  // Notification States
  notifications: Notification[];
  unreadCount: number;

  // Chat Actions
  getUsers: () => Promise<void>;
  selectUser: (targetUser: User) => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  getConversations: () => Promise<void>;
  setSelectedConversation: (conv: Conversation | null) => void;
  getMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    content: string,
    type?: MessageType,
    offerDetails?: OfferDetails,
    imageUrl?: string,
  ) => Promise<void>;
  markConversationAsRead: (
    conversationId: string,
    userId: string,
  ) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  removeConversation: (conversationId: string) => void;

  // Notification Actions
  getNotifications: () => Promise<void>;
  markAsRead: (notiId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToNotifications: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  conversations: [],
  messages: [],
  selectedConversation: null,
  isMessagesLoading: false,
  users: [],
  notifications: [],
  unreadCount: 0,

  // --- USER ACTIONS ---
  getUsers: async () => {
    try {
      const res = await api.get<User[]>("/users/all");
      set({ users: res.data });
    } catch (error) {
      console.error("Lỗi lấy users:", error);
    }
  },

  // --- SOCKET CORE ---
  connectSocket: (userId) => {
    const existingSocket = get().socket;

    // Nếu socket đã tồn tại và đang kết nối/đã kết nối thì không tạo mới
    if (existingSocket?.connected) return;

    // Nếu có socket cũ nhưng bị ngắt, đóng hẳn trước khi tạo mới
    if (existingSocket) existingSocket.close();

    const socket = io(
      process.env.NEXT_PUBLIC_SERVER || "http://localhost:5000",
      {
        query: { userId },
        reconnectionAttempts: 5,
        transports: ["websocket"], // Ưu tiên websocket để nhanh và ổn định hơn
      },
    );

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("getOnlineUsers", (users: string[]) =>
      set({ onlineUsers: users }),
    );

    set({ socket });

    // Đăng ký lắng nghe sự kiện
    get().subscribeToMessages();
    get().subscribeToNotifications();
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // --- CHAT LOGIC ---
  getConversations: async () => {
    try {
      const res = await api.get<{ data: Conversation[] }>(
        "/chat/conversations",
      );
      set({ conversations: res.data.data });
    } catch (error) {
      console.error("Lỗi lấy danh sách chat:", error);
    }
  },

  selectUser: async (targetUser: User) => {
    const { conversations, getMessages } = get();
    const existingConv = conversations.find((conv) =>
      conv.participants.some(
        (p) =>
          (typeof p.userId === "string" ? p.userId : p.userId._id) ===
          targetUser._id,
      ),
    );

    if (existingConv) {
      set({ selectedConversation: existingConv });
      await getMessages(existingConv._id);
    } else {
      const tempConversation: Conversation = {
        _id: "new",
        type: "direct",
        participants: [{ userId: targetUser } as Participant],
        //eslint-disable-next-line
        unreadCount: new Map() as any,
      };
      set({ selectedConversation: tempConversation, messages: [] });
    }
  },

  setSelectedConversation: (conv) => set({ selectedConversation: conv }),

  getMessages: async (conversationId: string) => {
    if (!conversationId || conversationId === "new") return;
    try {
      set({ isMessagesLoading: true });
      const res = await api.get<{ data: Message[] } | Message[]>(
        `/chat/messages/${conversationId}`,
      );
      const data = "data" in res.data ? res.data.data : res.data;
      set({ messages: data });
    } catch (error) {
      console.error("Lỗi getMessages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (content, type = "text", offerDetails, imageUrl) => {
    const { selectedConversation, getConversations } = get();
    if (!selectedConversation) return;

    try {
      let conversationId = selectedConversation._id;
      if (conversationId === "new") {
        const receiverId = selectedConversation.participants[0].userId._id;
        const resConv = await api.post<{ data: Conversation }>(
          "/chat/conversations",
          { receiverId },
        );
        conversationId = resConv.data.data._id;
        set({ selectedConversation: resConv.data.data });
      }

      await api.post("/chat/messages", {
        conversationId,
        content,
        messageType: type,
        offerDetails:
          type === "offer" ? { ...offerDetails, status: "pending" } : undefined,
        imageUrl,
      });

      await getConversations();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  },

  markConversationAsRead: async (conversationId: string, userId: string) => {
    if (!conversationId || !userId) return;

    try {
      await api.patch(`/chat/conversations/${conversationId}/read`);

      set((state) => {
        // Cập nhật notifications: tìm các thông báo chat liên quan để ẩn badge
        const updatedNotifications = state.notifications.map((n) =>
          n.type === "CHAT" && n.link.includes(conversationId)
            ? { ...n, isRead: true }
            : n,
        );

        return {
          conversations: state.conversations.map((conv) => {
            if (conv._id === conversationId) {
              const safeUnreadCount = conv.unreadCount || {};
              return {
                ...conv,
                unreadCount: { ...safeUnreadCount, [userId]: 0 },
              };
            }
            return conv;
          }),
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter((n) => !n.isRead).length,
          selectedConversation:
            state.selectedConversation?._id === conversationId
              ? {
                  ...state.selectedConversation,
                  unreadCount: {
                    ...(state.selectedConversation.unreadCount || {}),
                    [userId]: 0,
                  },
                }
              : state.selectedConversation,
        };
      });
    } catch (error) {
      console.error("Lỗi cập nhật đã xem:", error);
    }
  },

  subscribeToMessages: () => {
    const { socket } = get();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("offer_status_updated");

    socket.on("receive_message", (newMessage: Message) => {
      const { selectedConversation } = get();
      if (selectedConversation?._id !== newMessage.conversationId) return;

      set((state) => ({
        messages: state.messages.some((m) => m._id === newMessage._id)
          ? state.messages
          : [...state.messages, newMessage],
      }));
    });

    socket.on("offer_status_updated", ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                offerDetails: msg.offerDetails
                  ? { ...msg.offerDetails, status }
                  : undefined,
              }
            : msg,
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const s = get().socket;
    if (s) {
      s.off("receive_message");
      s.off("offer_status_updated");
    }
  },

  removeConversation: (conversationId: string) => {
    set((state) => ({
      conversations: state.conversations.filter(
        (c) => c._id !== conversationId,
      ),
      selectedConversation:
        state.selectedConversation?._id === conversationId
          ? null
          : state.selectedConversation,
    }));
  },

  // --- NOTIFICATION LOGIC ---
  getNotifications: async () => {
    try {
      const res = await api.get<{ data: Notification[] }>("/notifications");
      const notis = res.data.data || [];
      set({
        notifications: notis,
        unreadCount: notis.filter((n) => !n.isRead).length,
      });
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  },

  subscribeToNotifications: () => {
    const { socket } = get();
    if (!socket) return;

    socket.off("newNotification");

    socket.on("newNotification", (newNoti: Notification) => {
      set((state) => {
        const filteredNotifications = state.notifications.filter(
          (n) => n._id !== newNoti._id,
        );
        const updatedList = [newNoti, ...filteredNotifications];
        return {
          notifications: updatedList,
          unreadCount: updatedList.filter((n) => !n.isRead).length,
        };
      });
    });
  },

  markAsRead: async (notiId: string) => {
    try {
      await api.patch(`/notifications/${notiId}/read`);
      set((state) => {
        const updatedNotis = state.notifications.map((n) =>
          n._id === notiId ? { ...n, isRead: true } : n,
        );
        return {
          notifications: updatedNotis,
          unreadCount: updatedNotis.filter((n) => !n.isRead).length,
        };
      });
    } catch (error) {
      console.error("Lỗi cập nhật đã xem:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã xem:", error);
    }
  },
}));
