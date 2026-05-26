'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { useChat } from '../../provider/chat-provider';

// Le ChatProvider est placé dans le layout du dashboard
// src/app/(dashboard)/layout.tsx → <ChatProvider>{children}</ChatProvider>

export default function ChatPage() {
  return (
    <Flex h="calc(100vh - 64px)">
      {' '}
      {/* 64px = hauteur de ta navbar */}
      {/* Panneau gauche — liste des conversations */}
      <Box w={{ base: 'full', md: '320px' }} flexShrink={0}>
        <ConversationList />
      </Box>
      {/* Panneau droit — thread actif */}
      <Box flex={1} display={{ base: 'none', md: 'flex' }} flexDirection="column">
        <ActiveThread />
      </Box>
    </Flex>
  );
}

function ActiveThread() {
  const { state } = useChat();

  if (!state.isConnected) {
    return (
      <Flex flex={1} align="center" justify="center" color="fg.subtle">
        <Text fontSize="sm">Connexion en cours…</Text>
      </Flex>
    );
  }

  if (!state.activeConversationId) {
    return (
      <Flex flex={1} align="center" justify="center" color="fg.subtle">
        <Text fontSize="sm">Sélectionnez une conversation</Text>
      </Flex>
    );
  }

  return <MessageThread />;
}
