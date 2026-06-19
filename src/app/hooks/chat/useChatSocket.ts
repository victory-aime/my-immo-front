// hooks/chat/useChatSocket.ts
import { useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { ChatModule } from '_store/state-management';
import { playNotificationSound } from '_utils/play-sound';
import { MODELS } from '_types/*';

interface UseChatSocketOptions {
  userId?: string;
  /** conversationId actuellement ouverte à l'écran — pour ne pas jouer le son si déjà visible */
  activeConversationId?: string | null;
}

export function useChatSocket({ userId, activeConversationId }: UseChatSocketOptions) {
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    if (!socket) return;
    if (!socket.connected) socket.connect();

    const onMessageReceive = (message: MODELS.Message) => {
      ChatModule.ChatCache.prependMessage(message);
      ChatModule.ChatCache.invalidateConversations();

      if (activeConversationIdRef.current !== message.conversationId) {
        playNotificationSound();
      }
    };

    const onMessageSent = (message: MODELS.Message) => {
      ChatModule.ChatCache.prependMessage(message);
      ChatModule.ChatCache.invalidateConversations();
    };

    const onPresenceUpdate = (data: { userId: string; online: boolean }) => {
      ChatModule.ChatCache.setPresence(data.userId, data.online);
    };

    socket.on('message:receive', onMessageReceive);
    socket.on('message:sent', onMessageSent);
    socket.on('presence:update', onPresenceUpdate);

    return () => {
      socket.off('message:receive', onMessageReceive);
      socket.off('message:sent', onMessageSent);
      socket.off('presence:update', onPresenceUpdate);
    };
  }, [userId]);

  return { socket: getSocket() };
}
