"use client";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Message, Conversation, User, Participant } from "../types/chat";
import api from "../services/api";

interface ChatState {
  socket: Socket | null;
  onlineUsers: string[];
  conversations: Conversation[];
  messages: Message[];
  selectedConversation: Conversation | null;
  isMessagesLoading: boolean;
  users: User[];
  selectUser: (targetUser: User) => Promise<void>;
  getUsers: () => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  getConversations: () => Promise<void>;
  setSelectedConversation: (conv: Conversation | null) => void;
  getMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  conversations: [],
  messages: [],
  selectedConversation: null,
  isMessagesLoading: false,
  users: [],

  getUsers: async () => {
    try {
      const res = await api.get<User[]>("/users/all");
      set({ users: res.data });
    } catch (error) {
      console.error("Lỗi lấy users:", error);
    }
  },

  connectSocket: (userId) => {
    if (get().socket?.connected) return;
    const socket = io("http://localhost:5000", { query: { userId } });

    socket.on("getOnlineUsers", (users: string[]) =>
      set({ onlineUsers: users }),
    );
    set({ socket });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },

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
      };

      set({
        selectedConversation: tempConversation,
        messages: [],
      });
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

  sendMessage: async (content: string) => {
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
        const newConv = resConv.data.data;
        conversationId = newConv._id;
        set({ selectedConversation: newConv });
      }

      await api.post("/chat/messages", {
        conversationId,
        text: content,
      });

      await getConversations();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  },

  subscribeToMessages: () => {
    const { socket } = get();
    if (!socket) return;

    socket.off("receive_message");

    socket.on("receive_message", (newMessage: Message) => {
      const { selectedConversation } = get();
      if (selectedConversation?._id !== newMessage.conversationId) return;

      set((state) => {
        const isExisted = state.messages.some((m) => m._id === newMessage._id);
        if (isExisted) return state;

        return {
          messages: [...state.messages, newMessage],
        };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const s = get().socket;
    if (s) {
      s.off("receive_message");
    }
  },
}));
