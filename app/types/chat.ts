export interface User {
  _id: string;
  id: string;
  name: string;
  avatar?: string;
  displayName?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isDeleted?: boolean;
}
export interface Participant {
  userId: User;
}
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
  unreadCount?: number;
}
