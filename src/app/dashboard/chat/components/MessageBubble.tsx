'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { getTimeValue } from 'rise-core-frontend';
import { useColorModeValue } from '_components/ui/color-mode';
import { MessageBubbleProps } from '../interface/chat';
import { MessageStatusIcon } from './MessagesStatusIcon';

export function MessageBubble({
  message,
  isOwn,
  conversationId,
  retryMessage,
}: MessageBubbleProps) {
  const bgColor = useColorModeValue('white', 'border');
  const textColor = useColorModeValue('black', 'white');

  return (
    <Flex direction="column" align={isOwn ? 'flex-end' : 'flex-start'} mb={1.5}>
      <Flex align="center" gap={2} maxW="70%" flexDirection={isOwn ? 'row-reverse' : 'row'}>
        {message.status === 'SENT' && (
          <Text fontSize="2xs" color="fg.subtle" mt={0.5}>
            Envoi…
          </Text>
        )}

        {message?.status !== 'SENT' && (
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
          bg={isOwn ? 'primary.100' : bgColor}
          color={isOwn ? 'white' : textColor}
          px={3}
          py={1}
          borderRadius="18px"
          borderBottomRightRadius={isOwn ? '4px' : '18px'}
          borderBottomLeftRadius={isOwn ? '18px' : '4px'}
          position="relative"
        >
          <Text fontSize="sm" fontWeight={'medium'} wordBreak="break-word">
            {message.content}
          </Text>
          <Text
            textAlign={'right'}
            mt={1}
            fontSize="x-small"
            fontWeight={'medium'}
            wordBreak="break-word"
          >
            {getTimeValue(message.createdAt)}
          </Text>
          {/* FIX : statut affiché uniquement sur le dernier message envoyé par moi */}
          {isOwn && (
            <Flex align="center" gap={1} mt={0.5} px={1}>
              <MessageStatusIcon status={message.status} />
            </Flex>
          )}
          {message.status}
        </Box>
      </Flex>
    </Flex>
  );
}
