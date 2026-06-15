export interface User {
  _id: string;
  id: string;
  name: string;
  avatar?: string;
  displayName?: string;
  lastActive?: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isDeleted?: boolean;
  messageType?: "text" | "offer";
  offerDetails?: {
    productName: string;
    productImage: string;
    originalPrice: number;
    offeredPrice: number;
    status?: "pending" | "accepted" | "rejected";
  };
  productDetails?: {
    productId: string;
    productName: string;
    productImage: string;
    originalPrice: number;
  };
}

export interface Participant {
  userId: User;
}

export type UnreadCount = Record<string, number>;

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  participants: Participant[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  groupInfo?: { name: string };
  unreadCount?: UnreadCount;
}

export interface OfferDetails {
  productId: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  offeredPrice: number;
  status?: "pending" | "accepted" | "rejected";
}

export interface Notification {
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

export type MessageType = "text" | "offer";

export interface ChatState {
  // Chat States
  socket: any | null;
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
