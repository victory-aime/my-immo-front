'use client';

import { Flex, Box } from '@chakra-ui/react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

export function ReactionPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <Flex
      bg="bg"
      border="1px solid"
      borderColor="border.subtle"
      rounded="full"
      px={1.5}
      py={1}
      gap={0.5}
      boxShadow="sm"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <Box
          key={emoji}
          as="button"
          onClick={() => onSelect(emoji)}
          fontSize="sm"
          px={1}
          _hover={{ transform: 'scale(1.2)' }}
          transition="transform 0.1s"
        >
          {emoji}
        </Box>
      ))}
    </Flex>
  );
}
