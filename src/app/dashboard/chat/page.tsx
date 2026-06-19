'use client';

import { Flex, Box, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { EmptyState } from './EmptyState';

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return activeConversationId ? (
      <ChatWindow
        conversationId={activeConversationId}
        onBack={() => setActiveConversationId(null)}
      />
    ) : (
      <ConversationList
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
      />
    );
  }

  return (
    <Flex h="100vh" overflow="hidden" width={'full'}>
      <Box w="1/4" flexShrink={0} borderRight="1px solid" borderColor="inherit">
        <ConversationList
          activeConversationId={activeConversationId}
          onSelect={setActiveConversationId}
        />
      </Box>
      <Box flex={1} minW={0}>
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <EmptyState />
        )}
      </Box>
    </Flex>
  );
}
