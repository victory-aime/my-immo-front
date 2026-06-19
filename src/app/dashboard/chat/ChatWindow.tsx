'use client';

import { Box, Flex, IconButton } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { ChatModule } from '_store/state-management';
import { useUserContext } from '_context/user-context';
import { useConversationRoom, useSendMessage } from '_hooks/chat/useChatMessages';
import { useTypingIndicator } from '_hooks/chat/useTypings';
import { MessageBubble } from './MessageBubble';
import { TypingDots } from './TypingDot';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void; // présent en mode mobile uniquement
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user } = useUserContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data } = ChatModule.getMessagesQueries({
    params: { data: { conversationId, userId: user?.id } },
  });
  const { data: conversations } = ChatModule.getConversationQueries({
    params: { userId: user?.id! },
    queryOptions: { enabled: false },
  });
  const { join, leave } = useConversationRoom(conversationId);
  const { sendMessage, retryMessage } = useSendMessage();
  const { isOtherTyping, notifyTyping } = useTypingIndicator(conversationId);

  useEffect(() => {
    join();
    return () => leave();
  }, [conversationId]);

  const messages = data?.nextCursor?.flatMap((p: any) => p.items) ?? data?.items ?? [];
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <Flex direction="column" h="100%">
      <ChatHeader conversationId={conversationId} onBack={onBack} conversations={conversations} />

      {/* Messages */}
      <Box ref={scrollRef} flex={1} overflowY="auto" px={5} py={4}>
        <Flex direction="column" gap={1}>
          {messages
            .slice()
            .reverse()
            .map((message: any, idx: number) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                conversationId={conversationId}
                retryMessage={() => retryMessage(conversationId, message)}
              />
            ))}

          {isOtherTyping && <TypingDots />}
        </Flex>
      </Box>

      {/* Input */}
      <ChatInput
        onSend={(content) => sendMessage(conversationId, content)}
        onTyping={notifyTyping}
      />
    </Flex>
  );
}
