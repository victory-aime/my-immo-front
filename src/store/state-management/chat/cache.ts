import { QUERIES } from 'rise-core-frontend';
import * as Constants from './constants';
import { MODELS } from '_types/index';

interface MessagesPage {
  items: MODELS.MessagePayload[];
  nextCursor: string | null;
}

export const ChatCache = {
  /** Invalide la liste des conversations — refetch preview + tri */
  invalidateConversations: () =>
    QUERIES.QueryCache.invalidate([Constants.CHAT_KEYS.GET_ALL_CONVERSATIONS]),

  /** Lit le cache des messages d'une conversation */
  getMessages: (conversationId: string) =>
    QUERIES.QueryCache.get<MessagesPage>([Constants.CHAT_KEYS.GET_MESSAGES, conversationId]),

  /** Remplace entièrement le cache des messages d'une conversation */
  setMessages: (conversationId: string, data: MessagesPage) =>
    QUERIES.QueryCache.set<MessagesPage>([Constants.CHAT_KEYS.GET_MESSAGES, conversationId], data),

  /**
   * Préfixe un nouveau message en tête de la conversation.
   * No-op si le cache n'existe pas encore (conversation jamais ouverte) —
   * on laisse le fetch initial s'en charger normalement à l'ouverture.

  prependMessage: (message: MODELS.Message) => {
    const current = ChatCache.getMessages(message.conversationId);
    if (!current) return;

    ChatCache.setMessages(message.conversationId, {
      ...current,
      items: [message, ...current.items],
    });
  },
      */
  /**
   * FIX BUG #1 : si le cache n'existe pas encore, on le CRÉE au lieu de no-op.
   * Cas réel : l'user est déjà sur la conversation (room jointe, listeners actifs)
   * mais React Query n'a pas encore résolu son premier fetch, ou le query a été
   * gc collected entre deux messages. On ne doit jamais perdre un message reçu.
   */
  prependMessage: (message: MODELS.MessagePayload) => {
    const current = ChatCache.getMessages(message.conversationId);
    if (!current) return;

    if (!current) {
      ChatCache.setMessages(message.conversationId, {
        items: [message],
        nextCursor: null,
      });
      return;
    }

    // Évite les doublons (ex: optimistic message remplacé par la version serveur)
    const alreadyExists = current.items.some((m) => m.id === message.id);
    if (alreadyExists) return;

    ChatCache.setMessages(message.conversationId, {
      ...current,
      items: [message, ...current.items],
    });
  },
  /**
   * Remplace un message optimiste (id temporaire) par la version confirmée serveur.
   * Utilisé après réception de 'message:sent'.
   */
  replaceOptimisticMessage: (
    conversationId: string,
    tempId: string,
    confirmedMessage: MODELS.MessagePayload,
  ) => {
    const current = ChatCache.getMessages(conversationId);
    if (!current) {
      ChatCache.setMessages(conversationId, { items: [confirmedMessage], nextCursor: null });
      return;
    }

    ChatCache.setMessages(conversationId, {
      ...current,
      items: current.items.map((m) => (m.id === tempId ? confirmedMessage : m)),
    });
  },

  /**
   * Marque un message optimiste comme échoué (sender down, timeout).
   */
  markMessageFailed: (conversationId: string, tempId: string) => {
    const current = ChatCache.getMessages(conversationId);
    if (!current) return;

    ChatCache.setMessages(conversationId, {
      ...current,
      items: current.items.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m)),
    });
  },

  removeMessage: (conversationId: string, messageId: string) => {
    const current = ChatCache.getMessages(conversationId);
    if (!current) return;

    ChatCache.setMessages(conversationId, {
      ...current,
      items: current.items.filter((m) => m.id !== messageId),
    });
  },

  /** Met à jour les réactions d'un message précis dans le cache */
  updateMessageReactions: (
    conversationId: string,
    messageId: string,
    reactions: Record<string, string[]>,
  ) => {
    const current = ChatCache.getMessages(conversationId);
    if (!current) return;

    ChatCache.setMessages(conversationId, {
      ...current,
      items: current.items.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
    });
  },

  /** Présence d'un user (online/offline) */
  setPresence: (userId: string, online: boolean) =>
    QUERIES.QueryCache.set(['presence', userId], online),

  getPresence: (userId: string) => QUERIES.QueryCache.get<boolean>(['presence', userId]),
};
