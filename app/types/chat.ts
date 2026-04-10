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
