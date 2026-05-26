// src/components/chat/ConversationList.tsx
'use client';

import { Badge, Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { useChat } from '../../provider/chat-provider';
import { Conversation } from '../../../types/models/chat';
import { Avatar } from '_components/ui/avatar';

export function ConversationList() {
  const { state, joinConversation } = useChat();
  const [search, setSearch] = useState('');

  const filtered = state.conversations.filter((c) => {
    const title = getConvTitle(c);
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Flex direction="column" h="100%" borderRightWidth="1px" borderColor="border.subtle">
      {/* Header */}
      <Box px={4} py={3} borderBottomWidth="1px" borderColor="border.subtle">
        <Text fontWeight="semibold" fontSize="lg" mb={3}>
          Messages
        </Text>
        <Input
          placeholder="Rechercher…"
          size="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          borderRadius="lg"
        />
      </Box>

      {/* Liste */}
      <VStack gap={0} overflowY="auto" flex={1} align="stretch">
        {filtered.map((conv) => (
          <ConvItem
            key={conv.id}
            conv={conv}
            isActive={state.activeConversationId === conv.id}
            unread={state.unreadCounts[conv.id] ?? 0}
            onlineMap={state.onlineMap}
            onSelect={() => joinConversation(conv.id)}
          />
        ))}
        {filtered.length === 0 && (
          <Text color="fg.subtle" textAlign="center" py={8} fontSize="sm">
            Aucune conversation
          </Text>
        )}
      </VStack>
    </Flex>
  );
}

// ── Item ──────────────────────────────────────────────────────────
interface ConvItemProps {
  conv: Conversation;
  isActive: boolean;
  unread: number;
  onlineMap: Record<string, boolean>;
  onSelect: () => void;
}

function ConvItem({ conv, isActive, unread, onlineMap, onSelect }: ConvItemProps) {
  const title = getConvTitle(conv);
  const lastMsg = conv.messages[0];
  const otherParticipant = conv.participants.find(() => true); // affine selon ton auth
  const isOnline = otherParticipant ? onlineMap[otherParticipant.userId] : false;

  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={3}
      cursor="pointer"
      bg={isActive ? 'bg.subtle' : 'transparent'}
      _hover={{ bg: 'bg.subtle' }}
      onClick={onSelect}
      position="relative"
      borderBottomWidth="1px"
      borderColor="border.subtle"
    >
      {/* Avatar avec indicateur de présence */}
      <Box position="relative">
        <Avatar name={title} size="md" />
        {isOnline && (
          <Box
            position="absolute"
            bottom="0"
            right="0"
            w={3}
            h={3}
            bg="green.500"
            borderRadius="full"
            borderWidth="2px"
            borderColor="bg"
          />
        )}
      </Box>

      {/* Contenu */}
      <Box flex={1} minW={0}>
        <Flex justify="space-between" align="center">
          <Text fontWeight={unread > 0 ? 'semibold' : 'medium'} fontSize="sm" truncate>
            {title}
          </Text>
          {conv.lastMessageAt && (
            <Text fontSize="xs" color="fg.subtle" flexShrink={0} ml={2}>
              {formatDistanceToNow(new Date(conv.lastMessageAt), {
                addSuffix: false,
                locale: fr,
              })}
            </Text>
          )}
        </Flex>

        <Flex justify="space-between" align="center" mt={0.5}>
          <Text fontSize="xs" color="fg.subtle" truncate flex={1}>
            {lastMsg?.content ?? 'Aucun message'}
          </Text>
          {unread > 0 && (
            <Badge
              colorPalette="purple"
              variant="solid"
              borderRadius="full"
              px={2}
              ml={2}
              fontSize="xs"
              flexShrink={0}
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}

function getConvTitle(conv: Conversation): string {
  if (conv.title) return conv.title;
  return conv.participants.map((p) => p.user.name).join(', ') || 'Conversation';
}
