interface ISendMessage {
  message?: string;
  conversationId?: string;
  userId?: string;
}

interface IMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string;
  createdAt: string;
}

interface IConversationResponse {
  id: string;
  propertyId: string;
  rentalAgreementId: string;
  createdAt: string;
  messages: IMessageResponse[];
}

// src/types/chat.ts
export type MessageStatus1 = 'SENT' | 'DELIVERED' | 'READ';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface ChatUser {
  id: string;
  name: string;
}

export interface MessageReceipt {
  status: MessageStatus;
  readAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sender: ChatUser;
  receipts: MessageReceipt[];
}

export interface ConversationParticipant {
  userId: string;
  user: ChatUser;
  lastReadAt?: string;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'SUPPORT' | 'GROUP';
  title?: string;
  lastMessageAt?: string;
  participants: ConversationParticipant[];
  messages: Pick<Message, 'id' | 'content' | 'type' | 'createdAt' | 'senderId'>[];
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

// types/chat.ts

interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  reactions: Record<string, string[]> | null;
  createdAt: string;
  status?: MessageStatus;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface Conversation1 {
  id: string;
  participants: {
    user: { id: string; name: string; image: string | null };
  }[];
  messages: MessagePayload[];
  updatedAt: string;
}

export type {
  ISendMessage,
  IMessageResponse,
  IConversationResponse,
  MessagePayload,
  Conversation1,
  TypingPayload,
};
