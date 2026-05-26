// src/store/chat-reducer.ts
import { Conversation, Message } from '../types/models/chat';

export interface ChatState {
  isConnected: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  /** Messages paginés par conversationId */
  messages: Record<string, Message[]>;
  /** curseur de pagination par conversationId */
  cursors: Record<string, string | null>;
  /** userId[] qui tapent par conversationId */
  typingUsers: Record<string, string[]>;
  /** userId → en ligne */
  onlineMap: Record<string, boolean>;
  /** conversationId → nb non-lus */
  unreadCounts: Record<string, number>;
}

export const initialState: ChatState = {
  isConnected: false,
  conversations: [],
  activeConversationId: null,
  messages: {},
  cursors: {},
  typingUsers: {},
  onlineMap: {},
  unreadCounts: {},
};

export type ChatAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | {
      type: 'SET_MESSAGES';
      payload: { conversationId: string; messages: Message[]; nextCursor: string | null };
    }
  | {
      type: 'PREPEND_MESSAGES';
      payload: { conversationId: string; messages: Message[]; nextCursor: string | null };
    }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: { conversationId: string; userId: string; typing: boolean } }
  | { type: 'SET_ONLINE'; payload: { userId: string; online: boolean } }
  | { type: 'SET_UNREAD'; payload: Record<string, number> }
  | { type: 'MARK_READ'; payload: string /* conversationId */ }
  | { type: 'MSG_DELIVERED'; payload: { messageId: string; conversationId: string } };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.payload };

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
        cursors: {
          ...state.cursors,
          [action.payload.conversationId]: action.payload.nextCursor,
        },
      };

    // Pagination — on préfixe les anciens messages
    case 'PREPEND_MESSAGES': {
      const existing = state.messages[action.payload.conversationId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [...action.payload.messages, ...existing],
        },
        cursors: {
          ...state.cursors,
          [action.payload.conversationId]: action.payload.nextCursor,
        },
      };
    }

    case 'ADD_MESSAGE': {
      const conv = action.payload.conversationId;
      const existing = state.messages[conv] ?? [];
      // Déduplique (le socket peut rejouer un message)
      if (existing.some((m) => m.id === action.payload.id)) return state;

      // Met à jour lastMessageAt dans la liste des conversations
      const conversations = state.conversations.map((c) =>
        c.id === conv ? { ...c, lastMessageAt: action.payload.createdAt } : c,
      );

      return {
        ...state,
        conversations,
        messages: { ...state.messages, [conv]: [...existing, action.payload] },
        unreadCounts:
          state.activeConversationId === conv
            ? state.unreadCounts
            : {
                ...state.unreadCounts,
                [conv]: (state.unreadCounts[conv] ?? 0) + 1,
              },
      };
    }

    case 'SET_TYPING': {
      const { conversationId, userId, typing } = action.payload;
      const current = state.typingUsers[conversationId] ?? [];
      const next = typing
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId);
      return {
        ...state,
        typingUsers: { ...state.typingUsers, [conversationId]: next },
      };
    }

    case 'SET_ONLINE':
      return {
        ...state,
        onlineMap: {
          ...state.onlineMap,
          [action.payload.userId]: action.payload.online,
        },
      };

    case 'SET_UNREAD':
      return { ...state, unreadCounts: action.payload };

    case 'MARK_READ':
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.payload]: 0 },
      };

    case 'MSG_DELIVERED':
      return state; // Géré par le backend — l'UI lit le statut depuis les receipts

    default:
      return state;
  }
}
