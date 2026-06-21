'use client';

import { Box, Flex, Float, IconButton } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { ChatModule } from '_store/state-management';
import { useUserContext } from '_context/user-context';
import {
  useAutoMarkAsSeen,
  useConversationRoom,
  useSendMessage,
} from '_hooks/chat/useChatMessages';
import { useTypingIndicator } from '_hooks/chat/useTypings';
import { MessageBubble } from './MessageBubble';
import { TypingDots } from './TypingDot';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { useColorModeValue } from '_components/ui/color-mode';
import { MODELS } from '_types/*';
import { FloatSwitchColorMode, Icons, Loader } from '_components/custom';
import { ChatWindowProps } from '../interface/chat';

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user } = useUserContext();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    ChatModule.getMessagesQueries({
      params: { conversationId, userId: user?.id! },
    });
  const { data: conversations } = ChatModule.getConversationQueries({
    params: { userId: user?.id! },
    queryOptions: { enabled: false },
  });
  const { join, leave } = useConversationRoom(conversationId);
  const { sendMessage, retryMessage } = useSendMessage();
  const { isOtherTyping, notifyTyping } = useTypingIndicator(conversationId);
  const color = useColorModeValue('gray.200', 'bg.muted');

  const messages =
    data?.pages.reduce<MODELS.MessagePayload[]>((acc, page) => [...acc, ...page.items], []) ?? [];

  const onScroll = async () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    isAtBottomRef.current = distanceFromBottom < 80;
    setShowScrollButton(!isAtBottomRef.current);
    if (el.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  useAutoMarkAsSeen(conversationId, messages, user?.id);

  useEffect(() => {
    join();
    return () => leave();
  }, [conversationId]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    if (!isAtBottomRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });

    shouldAutoScrollRef.current = false;
  }, [messages.length, notifyTyping, isOtherTyping]);

  const handleSend = (content: string) => {
    shouldAutoScrollRef.current = true;
    sendMessage(conversationId, content);
  };

  return (
    <Flex direction="column" height={'2xl'} width={'full'}>
      <ChatHeader conversationId={conversationId} onBack={onBack} conversations={conversations} />
      <Box
        ref={scrollRef}
        flex={1}
        overflowY="auto"
        px={3}
        py={4}
        bgColor={color}
        onScroll={onScroll}
      >
        {isLoading ? (
          <Flex align={'center'} justifyContent={'center'} height={'full'}>
            <Loader
              color={'purple.focusRing'}
              size={'lg'}
              showText
              loader
              text={'chargement des messages'}
            />
          </Flex>
        ) : (
          <>
            {messages
              .slice()
              .reverse()
              .map((message: MODELS.MessagePayload) => {
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                    conversationId={conversationId}
                    retryMessage={() => retryMessage(conversationId, message)}
                  />
                );
              })}
            {isOtherTyping && <TypingDots />}
          </>
        )}
        {showScrollButton && (
          <Box position="absolute" width={'full'} bottom={200} left={0} right={0} bg="red">
            <Float placement={'top-center'}>
              <IconButton
                width={'full'}
                borderRadius="full"
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth',
                  });
                }}
              >
                <Icons.ArrowRight />
              </IconButton>
            </Float>
          </Box>
        )}
      </Box>

      <ChatInput onSend={handleSend} onTyping={notifyTyping} />
      <FloatSwitchColorMode />
    </Flex>
  );
}
