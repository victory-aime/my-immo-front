// hooks/chat/useChatMessages.ts
// Hooks socket-only pour le chat — n'utilisent pas React Query directement,
// passent par le singleton socket. La mise à jour du cache se fait
// via les events écoutés dans useChatSocket (message:sent / message:receive).

import { useCallback } from 'react';
import { getSocket } from '../../lib/socket';
import { useUserContext } from '_context/user-context';
import { MODELS } from '_types/';
import { ChatCache } from '_store/state-management/chat';

/**
 * Envoi de message — émet sur le socket.
 * Le cache est mis à jour quand le serveur renvoie 'message:sent',
 * pas ici, pour garder une seule source de vérité (cf. useChatSocket).
 */
const SEND_TIMEOUT_MS = 8000;

function createTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useSendMessage() {
  const { user } = useUserContext();

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !user?.id) return;

      const socket = getSocket();
      const tempId = createTempId();

      // ─── 1. Optimistic insert immédiat ──────────────────────────────────────
      const optimisticMessage: MODELS.MessagePayload = {
        id: tempId,
        conversationId,
        senderId: user.id,
        content: trimmed,
        type: 'TEXT',
        reactions: null,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      ChatCache.prependMessage(optimisticMessage);

      // ─── 2. Socket indisponible → échec immédiat ────────────────────────────
      if (!socket || !socket.connected) {
        ChatCache.markMessageFailed(conversationId, tempId);
        return;
      }

      // ─── 3. Timeout si le serveur ne répond jamais ──────────────────────────
      const timeoutId = setTimeout(() => {
        ChatCache.markMessageFailed(conversationId, tempId);
      }, SEND_TIMEOUT_MS);

      // ─── 4. Ack serveur via callback Socket.IO (pas l'event global) ────────
      // Utilise l'ack pattern de Socket.IO pour lier la réponse à CETTE émission
      // précise, plutôt que de compter sur le listener global 'message:sent'
      // qui ne sait pas quel tempId remplacer.
      socket.emit(
        'message:send',
        { conversationId, content: trimmed, tempId },
        (response: { success: boolean; message?: MODELS.MessagePayload; error?: string }) => {
          clearTimeout(timeoutId);

          if (!response?.success || !response.message) {
            ChatCache.markMessageFailed(conversationId, tempId);
            return;
          }

          ChatCache.replaceOptimisticMessage(conversationId, tempId, response.message);
        },
      );
    },
    [user?.id],
  );

  const retryMessage = useCallback(
    (conversationId: string, failedMessage: MODELS.Message) => {
      ChatCache.removeMessage(conversationId, failedMessage.id);
      sendMessage(conversationId, failedMessage.content);
    },
    [sendMessage],
  );
  return { sendMessage, retryMessage };
}

/**
 * Rejoint/quitte la room socket d'une conversation.
 * Nécessaire pour recevoir les events 'typing:update' ciblés sur cette conversation
 * (cf. ChatGateway: client.to(`conversation:${id}`).emit(...)).
 */
export function useConversationRoom(conversationId: string | null) {
  const join = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('conversation:join', { conversationId });
  }, [conversationId]);

  const leave = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('conversation:leave', { conversationId });
  }, [conversationId]);

  return { join, leave };
}
