'use client';

import { Box, Flex, Text, Skeleton, VStack } from '@chakra-ui/react';
import { ChatModule } from '_store/state-management';
import { useUserContext } from '_context/user-context';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Icons, BaseText, BaseButton, BaseIcon } from '_components/custom';
import { Avatar } from '_components/ui/avatar';
import { useState } from 'react';
import { NewConversationModal } from './NewConversationModal';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ activeConversationId, onSelect }: ConversationListProps) {
  const { user } = useUserContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: conversations, isLoading } = ChatModule.getConversationQueries({
    params: { userId: user?.id! },
  });

  return (
    <Flex direction="column" h="100%" width={'full'}>
      <Flex
        px={5}
        py={3}
        borderBottom="1px solid"
        borderColor="inherit"
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <BaseText fontSize="lg" fontWeight={'700'}>
          Conversations
        </BaseText>
        <BaseIcon boxSize={'35px'} onClick={() => setModalOpen(true)} cursor={'pointer'}>
          <Icons.PlusMinus />
        </BaseIcon>
      </Flex>

      {/* Liste */}
      <Box flex={1} overflowY="auto">
        {isLoading && (
          <VStack p={4} gap={3} align="stretch">
            {[...Array(25)].map((_, i) => (
              <Flex key={i} gap={3} align="center">
                <Skeleton w={10} h={10} rounded="full" />
                <Box flex={1}>
                  <Skeleton h={3} w="60%" mb={2} />
                  <Skeleton h={2.5} w="80%" />
                </Box>
              </Flex>
            ))}
          </VStack>
        )}

        {!isLoading && !conversations?.length && (
          <Flex direction="column" align="center" justify="center" h="60vh" px={8} gap={4}>
            <Box
              w="56px"
              h="56px"
              rounded="full"
              bg="bg.subtle"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icons.Chat size={24} strokeWidth={1.5} color="var(--chakra-colors-fg-subtle)" />
            </Box>
            <Box textAlign="center">
              <Text fontSize="sm" fontWeight="500" mb={1}>
                Aucune conversation
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Démarrez une discussion avec quelqu'un
              </Text>
            </Box>
            <BaseButton leftIcon={<Icons.Edit size={14} />} onClick={() => setModalOpen(true)}>
              Nouveau message
            </BaseButton>
          </Flex>
        )}

        {conversations?.map((conv: any) => {
          const otherUser = conv.participants[0]?.user;
          const lastMessage = conv.messages[0];
          const isActive = conv.id === activeConversationId;

          return (
            <Flex
              key={conv.id}
              as="button"
              onClick={() => onSelect(conv.id)}
              w="full"
              px={5}
              py={3}
              gap={3}
              align="center"
              bg={isActive ? 'bg.subtle' : 'transparent'}
              _hover={{ bg: 'bg.subtle' }}
              transition="background 0.15s"
              textAlign="left"
            >
              <Avatar name={otherUser?.name} />

              <Box flex={1} minW={0}>
                <Flex justify="space-between" align="baseline" gap={2}>
                  <Text
                    fontSize="sm"
                    fontWeight={lastMessage && !isActive ? '600' : '500'}
                    truncate
                  >
                    {otherUser?.name ?? 'Utilisateur'}
                  </Text>
                  {lastMessage && (
                    <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
                      {formatDistanceToNowStrict(new Date(lastMessage.createdAt), {
                        locale: fr,
                        addSuffix: false,
                      })}
                    </Text>
                  )}
                </Flex>
                <Text fontSize="xs" color="fg.muted" truncate mt={0.5}>
                  {lastMessage?.content ?? 'Démarrer la conversation'}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </Box>
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConversationCreated={(id) => onSelect?.(id)}
      />
    </Flex>
  );
}
