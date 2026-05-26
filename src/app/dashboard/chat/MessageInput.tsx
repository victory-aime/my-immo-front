// src/components/chat/MessageInput.tsx
'use client';

import { Box, Flex, IconButton, Textarea } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { useChat } from '../../provider/chat-provider';

interface Props {
  conversationId: string;
}

export function MessageInput({ conversationId }: Props) {
  const { sendMessage, sendTyping } = useChat();
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(conversationId, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }, 2000);
  }, [conversationId, sendTyping]);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMessage(conversationId, trimmed);
    setContent('');
    // Annule l'indicateur de frappe
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendTyping(conversationId, false);
  }, [content, conversationId, sendMessage, sendTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Shift+Enter → saut de ligne ; Enter seul → envoi
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Box px={4} py={3} borderTopWidth="1px" borderColor="border.subtle">
      <Flex align="flex-end" gap={2}>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message… (Entrée pour envoyer)"
          rows={1}
          resize="none"
          borderRadius="xl"
          flex={1}
          maxH="120px"
          overflowY="auto"
          fontSize="sm"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <IconButton
          aria-label="Envoyer"
          onClick={handleSend}
          disabled={!content.trim()}
          colorPalette="purple"
          borderRadius="xl"
        >
          <FiSend />
        </IconButton>
      </Flex>
    </Box>
  );
}
