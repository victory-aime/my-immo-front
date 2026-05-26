// src/components/chat/MessageThread.tsx
'use client';

import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../provider/chat-provider';
import { Message } from '../../../types/models/chat';
import { MessageInput } from './MessageInput';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { authClient } from '../../lib/auth-client';
import { Avatar } from '_components/ui/avatar';

export function MessageThread() {
  const { state, loadMoreMessages, markRead } = useChat();
  const { activeConversationId, messages, typingUsers, cursors } = state;
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  const convId = activeConversationId!;
  const convMessages = messages[convId] ?? [];
  const typingIds = typingUsers[convId] ?? [];
  const hasCursor = !!cursors[convId];

  // Auto-scroll vers le bas sur nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  // Marque comme lu quand la conversation est ouverte
  useEffect(() => {
    if (convId) markRead(convId);
  }, [convId, markRead]);

  // Préserve la position du scroll lors du chargement d'anciens messages
  const handleLoadMore = useCallback(async () => {
    if (!containerRef.current) return;
    prevScrollHeight.current = containerRef.current.scrollHeight;
    await loadMoreMessages(convId);
    // Après le rendu, repositionne le scroll
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const diff = containerRef.current.scrollHeight - prevScrollHeight.current;
      containerRef.current.scrollTop = diff;
    });
  }, [convId, loadMoreMessages]);

  if (!convId) return null;

  return (
    <Flex direction="column" h="100%">
      {/* Zone des messages */}
      <Box
        ref={containerRef}
        flex={1}
        overflowY="auto"
        px={4}
        py={4}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        {/* Charger plus */}
        {hasCursor && (
          <Flex justify="center" mb={2}>
            <Button size="xs" variant="ghost" onClick={handleLoadMore}>
              Voir les messages précédents
            </Button>
          </Flex>
        )}

        {convMessages.length === 0 && (
          <Flex flex={1} align="center" justify="center">
            <Text color="fg.subtle" fontSize="sm">
              Aucun message — commencez la conversation !
            </Text>
          </Flex>
        )}

        {convMessages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const prevMsg = convMessages[i - 1];
          const showAvatar = !isMine && prevMsg?.senderId !== msg.senderId;

          return <MessageBubble key={msg.id} msg={msg} isMine={isMine} showAvatar={showAvatar} />;
        })}

        {/* Indicateur de frappe */}
        {typingIds.length > 0 && (
          <Flex align="center" gap={2} pl={2}>
            <Box bg="bg.subtle" px={3} py={2} borderRadius="xl">
              <Flex gap={1} align="center">
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    w={1.5}
                    h={1.5}
                    bg="fg.subtle"
                    borderRadius="full"
                    style={{
                      animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </Flex>
            </Box>
          </Flex>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Saisie */}
      <MessageInput conversationId={convId} />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </Flex>
  );
}

// ── Bulle de message ─────────────────────────────────────────────
function MessageBubble({
  msg,
  isMine,
  showAvatar,
}: {
  msg: Message;
  isMine: boolean;
  showAvatar: boolean;
}) {
  const status = msg.receipts?.[0]?.status;

  return (
    <Flex align="flex-end" gap={2} justify={isMine ? 'flex-end' : 'flex-start'}>
      {/* Avatar de l'expéditeur (messages reçus) */}
      {!isMine && (
        <Box w={8} flexShrink={0}>
          {showAvatar && <Avatar name={msg.sender.name} size="sm" />}
        </Box>
      )}

      <Box maxW="70%">
        {/* Nom (premier message d'un groupe) */}
        {!isMine && showAvatar && (
          <Text fontSize="xs" color="fg.subtle" mb={1} ml={1}>
            {msg.sender.name}
          </Text>
        )}

        <Box
          bg={isMine ? 'purple.600' : 'bg.subtle'}
          color={isMine ? 'white' : 'fg'}
          px={3}
          py={2}
          borderRadius="xl"
          borderBottomRightRadius={isMine ? 'sm' : 'xl'}
          borderBottomLeftRadius={isMine ? 'xl' : 'sm'}
        >
          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
            {msg.content}
          </Text>
        </Box>

        {/* Heure + statut */}
        <Flex justify={isMine ? 'flex-end' : 'flex-start'} align="center" gap={1} mt={0.5} px={1}>
          <Text fontSize="xs" color="fg.subtle">
            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isMine && (
            <Box color={status === 'READ' ? 'blue.400' : 'fg.muted'}>
              {status === 'SENT' && <FiCheck size={12} />}
              {(status === 'DELIVERED' || status === 'READ') && <FiCheckCircle size={12} />}
            </Box>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
