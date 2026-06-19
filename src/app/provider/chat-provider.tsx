'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createSocket } from '../lib/socket';
import { ChatModule } from '_store/state-management';
import { playNotificationSound } from '_utils/play-sound';
import { useUserContext } from '_context/user-context';
import { MODELS } from '_types/';

interface ChatContextType {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  isSocketConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserContext();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSocketConnected, setSocketConnected] = useState(false);
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  useEffect(() => {
    if (!user?.id) return;

    const socket = createSocket();
    socket.connect();

    const onConnect = () => {
      console.log('[Chat] Socket connecté:', socket.id);
      setSocketConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.warn('[Chat] Socket déconnecté:', reason);
      setSocketConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.error('[Chat] Erreur connexion:', err.message);
      setSocketConnected(false);
    };

    // ─── Message reçu (recipient online, conversation potentiellement fermée) ──
    const onMessageReceive = (message: MODELS.MessagePayload) => {
      ChatModule.ChatCache.prependMessage(message);
      ChatModule.ChatCache.invalidateConversations();

      // Son uniquement si pas déjà en train de regarder cette conversation
      if (activeConversationIdRef.current !== message.conversationId) {
        playNotificationSound();
      }
    };

    // ─── Confirmation d'envoi (pour le sender) ─────────────────────────────────
    const onMessageSent = (message: MODELS.MessagePayload) => {
      ChatModule.ChatCache.prependMessage(message); // gère aussi le cas optimistic via replace
      ChatModule.ChatCache.invalidateConversations();
    };

    const onPresenceUpdate = (data: { userId: string; online: boolean }) => {
      ChatModule.ChatCache.setPresence(data.userId, data.online);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('message:receive', onMessageReceive);
    socket.on('message:sent', onMessageSent);
    socket.on('presence:update', onPresenceUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('message:receive', onMessageReceive);
      socket.off('message:sent', onMessageSent);
      socket.off('presence:update', onPresenceUpdate);
    };
  }, [user?.id]);

  return (
    <ChatContext.Provider
      value={{
        activeConversationId,
        setActiveConversationId,
        isSocketConnected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
