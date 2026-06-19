'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ChatModule } from '_store/state-management';
import { MODELS } from '_types/';
import { ReactionPicker } from './ReactPicker';

interface MessageBubbleProps {
  message: MODELS.MessagePayload;
  isOwn: boolean;
  conversationId: string;
  retryMessage: (conversationId: string, message: MODELS.MessagePayload) => void;
}

export function MessageBubble({
  message,
  isOwn,
  conversationId,
  retryMessage,
}: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  //const { mutateAsync: toggleReaction } = ChatModule.toggleReactionMutation({});

  const reactions = message.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  const handleReact = (emoji: string) => {
    //toggleReaction({ payload: { messageId: message.id, emoji } });
  };

  return (
    <Flex
      direction="column"
      align={isOwn ? 'flex-end' : 'flex-start'}
      mb={hasReactions ? 3 : 1}
      role="group"
    >
      <Flex align="center" gap={2} maxW="70%" flexDirection={isOwn ? 'row-reverse' : 'row'}>
        {message.status === 'sending' && (
          <Text fontSize="2xs" color="fg.subtle" mt={0.5}>
            Envoi…
          </Text>
        )}

        {message?.status === 'failed' && (
          <Flex align="center" gap={1} mt={0.5}>
            <Text fontSize="2xs" color="red.500">
              Échec
            </Text>
            <Text
              as="button"
              fontSize="2xs"
              color="fg.muted"
              textDecoration="underline"
              onClick={() => retryMessage(conversationId, message)}
            >
              Réessayer
            </Text>
          </Flex>
        )}
        <Box
          onClick={() => setShowTime((v) => !v)}
          bg={isOwn ? 'fg' : 'bg.subtle'}
          color={isOwn ? 'bg' : 'fg'}
          px={3.5}
          py={2}
          borderRadius="18px"
          borderBottomRightRadius={isOwn ? '4px' : '18px'}
          borderBottomLeftRadius={isOwn ? '18px' : '4px'}
          cursor="pointer"
          position="relative"
        >
          <Text fontSize="sm" lineHeight="1.4" wordBreak="break-word">
            {message.content}
          </Text>
        </Box>

        {/* Picker visible au hover */}
        <Box opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.15s">
          <ReactionPicker onSelect={handleReact} />
        </Box>
      </Flex>

      {showTime && (
        <Text fontSize="xs" color="fg.subtle" mt={1} px={1}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </Text>
      )}

      {hasReactions && (
        <Flex gap={1} mt={1} px={1}>
          {Object.entries(reactions).map(([emoji, userIds]) => (
            <Flex
              key={emoji}
              as="button"
              onClick={() => handleReact(emoji)}
              align="center"
              gap={1}
              bg="bg.subtle"
              border="1px solid"
              borderColor="border.subtle"
              rounded="full"
              px={2}
              py={0.5}
              fontSize="xs"
            >
              <Text>{emoji}</Text>
              <Text color="fg.muted">{userIds.length}</Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
