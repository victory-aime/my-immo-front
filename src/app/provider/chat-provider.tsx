// src/providers/ChatProvider.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { authClient } from '../lib/auth-client';
import { createSocket, destroySocket, getSocket } from '../lib/socket';
import { Conversation, Message } from '../../types/models';
import { chatReducer, ChatState, initialState } from '_store/chat-reducer';

interface ChatContextValue {
  state: ChatState;
  joinConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string, type?: string) => void;
  sendTyping: (conversationId: string, typing: boolean) => void;
  markRead: (conversationId: string) => void;
  loadMoreMessages: (conversationId: string) => void;
  setActive: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Initialisation ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      // 1. Récupère le token de session better-auth
      const { data: session } = await authClient.getSession();
      if (!session?.session?.token || !mounted) return;

      const token = session.session.token;

      // 2. Crée et connecte le socket
      const socket = createSocket(token);
      socket.connect();

      // 3. Événements de connexion
      socket.on('connect', () => {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        // Démarre le heartbeat (maintient la présence Redis vivante)
        heartbeatRef.current = setInterval(() => {
          socket.emit('heartbeat');
        }, 25_000);
      });

      socket.on('disconnect', () => {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] connect error', err.message);
      });

      // 4. Événements métier
      socket.on('new_message', (msg: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: msg });
      });

      socket.on(
        'message_delivered',
        ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
          dispatch({ type: 'MSG_DELIVERED', payload: { messageId, conversationId } });
        },
      );

      socket.on('messages_read', ({ conversationId }: { conversationId: string }) => {
        dispatch({ type: 'MARK_READ', payload: conversationId });
      });

      socket.on(
        'user_typing',
        ({ userId, conversationId }: { userId: string; conversationId: string }) => {
          dispatch({ type: 'SET_TYPING', payload: { conversationId, userId, typing: true } });
          // Auto-reset si le back ne renvoie pas typing_stop
          const key = `${conversationId}:${userId}`;
          if (typingTimers.current[key]) clearTimeout(typingTimers.current[key]);
          typingTimers.current[key] = setTimeout(() => {
            dispatch({ type: 'SET_TYPING', payload: { conversationId, userId, typing: false } });
          }, 3000);
        },
      );

      socket.on(
        'user_stopped_typing',
        ({ userId, conversationId }: { userId: string; conversationId: string }) => {
          dispatch({ type: 'SET_TYPING', payload: { conversationId, userId, typing: false } });
        },
      );

      socket.on('presence_update', ({ userId, online }: { userId: string; online: boolean }) => {
        dispatch({ type: 'SET_ONLINE', payload: { userId, online } });
      });

      // 5. Charge les conversations initiales
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations`, {
          credentials: 'include',
        });
        if (res.ok) {
          const conversations: Conversation[] = await res.json();
          dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
        }

        // Unread counts
        const unreadRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations/unread`,
          {
            credentials: 'include',
          },
        );
        if (unreadRes.ok) {
          dispatch({ type: 'SET_UNREAD', payload: await unreadRes.json() });
        }
      } catch (e) {
        console.error('[Chat] initial fetch failed', e);
      }

      // 6. Push Web (demande permission si pas encore accordée)
      try {
        //await registerWebPush();
      } catch (e) {
        console.warn('[Push] registration failed', e);
      }
    }

    init();

    return () => {
      mounted = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      Object.values(typingTimers.current).forEach(clearTimeout);
      destroySocket();
    };
  }, []);

  // ── Actions exposées ────────────────────────────────────────────
  const joinConversation = useCallback(
    async (id: string) => {
      dispatch({ type: 'SET_ACTIVE', payload: id });

      const socket = getSocket();
      socket?.emit('join_conversation', { conversationId: id });

      // Charge les messages si pas encore en cache
      if (!state.messages[id]) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/conversations/${id}/messages`,
            { credentials: 'include' },
          );
          if (res.ok) {
            const { messages, nextCursor } = await res.json();
            dispatch({
              type: 'SET_MESSAGES',
              payload: { conversationId: id, messages: messages.reverse(), nextCursor },
            });
          }
        } catch (e) {
          console.error('[Chat] loadMessages failed', e);
        }
      }

      // Marque comme lu
      socket?.emit('read_conversation', { conversationId: id });
      dispatch({ type: 'MARK_READ', payload: id });
    },
    [state.messages],
  );

  const setActive = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string, type = 'TEXT') => {
    getSocket()?.emit('send_message', { conversationId, content, type });
  }, []);

  const sendTyping = useCallback((conversationId: string, typing: boolean) => {
    getSocket()?.emit(typing ? 'typing_start' : 'typing_stop', { conversationId });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    getSocket()?.emit('read_conversation', { conversationId });
    dispatch({ type: 'MARK_READ', payload: conversationId });
  }, []);

  const loadMoreMessages = useCallback(
    async (conversationId: string) => {
      const cursor = state.cursors[conversationId];
      if (!cursor) return; // plus de messages à charger

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations/${conversationId}/messages?cursor=${cursor}`,
          { credentials: 'include' },
        );
        if (res.ok) {
          const { messages, nextCursor } = await res.json();
          dispatch({
            type: 'PREPEND_MESSAGES',
            payload: { conversationId, messages: messages.reverse(), nextCursor },
          });
        }
      } catch (e) {
        console.error('[Chat] loadMore failed', e);
      }
    },
    [state.cursors],
  );

  return (
    <ChatContext.Provider
      value={{
        state,
        joinConversation,
        sendMessage,
        sendTyping,
        markRead,
        loadMoreMessages,
        setActive,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

/** Hook d'accès au contexte — lance une erreur hors du Provider */
export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
