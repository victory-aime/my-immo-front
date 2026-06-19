'use client';

import { Flex, Textarea, IconButton } from '@chakra-ui/react';
import { useState, useRef, KeyboardEvent } from 'react';
import { Icons } from '_components/custom';

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
}

export function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    console.log('Sending message', trimmed);
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping();

    // Auto-grow
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <Flex
      align="flex-end"
      gap={2}
      px={4}
      py={3}
      borderTop="1px solid"
      borderColor="border.subtle"
      flexShrink={0}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez un message…"
        resize="none"
        rows={1}
        minH="40px"
        maxH="120px"
        fontSize="sm"
        borderRadius="20px"
        px={4}
        py={2.5}
        bg="bg.subtle"
        border="none"
        _focus={{ boxShadow: 'none', bg: 'bg.muted' }}
      />

      <IconButton
        aria-label="Envoyer"
        onClick={handleSend}
        disabled={!value.trim()}
        rounded="full"
        size="md"
        bg="fg"
        color="bg"
        _hover={{ opacity: 0.85 }}
        _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
      >
        <Icons.Send size={16} />
      </IconButton>
    </Flex>
  );
}
