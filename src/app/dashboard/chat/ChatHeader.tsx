'use client';

import { Flex, Text, IconButton, Box } from '@chakra-ui/react';
import { Icons } from '_components/custom';
import { ChatModule } from '_store/state-management';
import { MODELS } from '_types/';
import { useState, useEffect } from 'react';
import { useUserContext } from '_context/user-context';
import { Avatar } from '_components/ui/avatar';
import { useChatPresence } from '_hooks/chat/useChatPresence';

interface ChatHeaderProps {
  conversationId: string;
  onBack?: () => void;
  conversations: MODELS.Conversation1[];
}

export function ChatHeader({ conversationId, onBack, conversations }: ChatHeaderProps) {
  const { user } = useUserContext();
  const participants =
    conversations?.find((conv: MODELS.Conversation1) => conv.id === conversationId)?.participants ||
    [];
  const getUser = participants.find((p) => p.user?.id !== user?.id);

  const { data: isOnline } = useChatPresence(getUser?.user?.id);

  console.log('user', isOnline);
  console.log('user', getUser?.user?.id);
  console.log('user id', getUser?.user?.id === user?.id);

  return (
    <Flex
      align="center"
      gap={3}
      px={5}
      py={3}
      borderBottom="1px solid"
      borderColor="border.subtle"
      flexShrink={0}
    >
      {onBack && (
        <IconButton aria-label="Retour" variant="ghost" size="sm" onClick={onBack}>
          <Icons.IoIosArrowRoundBack size={18} />
        </IconButton>
      )}

      <Avatar size="sm" name={getUser?.user?.name} />

      <Box>
        <Text fontSize="sm" fontWeight="600">
          {getUser?.user?.name}
        </Text>
        <Flex align="center" gap={1.5}>
          <Box w="6px" h="6px" rounded="full" bg={isOnline ? 'green.500' : 'gray.400'} />
          <Text fontSize="xs" color="fg.muted">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}
