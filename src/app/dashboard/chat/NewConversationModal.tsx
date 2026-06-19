'use client';

import { Dialog, Input, Flex, Text, Avatar, Box, Spinner } from '@chakra-ui/react';
import { ChatModule, UserModule, TeamModule } from '_store/state-management';
import { useUserContext } from '_context/user-context';
import { useDeferredValue, useState } from 'react';
import { Icons } from '_components/custom';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const { user } = useUserContext();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // À adapter : ta query de recherche d'utilisateurs existante
  const { data: users, isLoading } = TeamModule.getAllTeamByAgency({
    params: { agencyId: user?.agencyId, userId: user?.id },
    queryOptions: { enabled: deferredQuery.length > 1 },
  });

  const { mutateAsync: createConversation, isPending } = ChatModule.createConversationMutation({});

  const handleSelectUser = async (recipientId: string) => {
    const conversation = await createConversation({
      payload: { recipientId },
      params: { userId: user?.id! },
    });
    onConversationCreated(conversation.id);
    setQuery('');
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="420px" borderRadius="xl">
          <Dialog.Header borderBottom="1px solid" borderColor="border.subtle" pb={3}>
            <Dialog.Title fontSize="md">Nouveau message</Dialog.Title>
          </Dialog.Header>

          <Dialog.Body p={0}>
            <Flex
              align="center"
              gap={2}
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              <Icons.Search size={16} color="var(--chakra-colors-fg-muted)" />
              <Input
                placeholder="Rechercher une personne…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                border="none"
                _focus={{ boxShadow: 'none' }}
                fontSize="sm"
                px={0}
                autoFocus
              />
            </Flex>

            <Box maxH="320px" overflowY="auto">
              {isLoading && (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" color="fg.muted" />
                </Flex>
              )}

              {!isLoading && deferredQuery.length > 1 && !users?.length && (
                <Text fontSize="sm" color="fg.muted" textAlign="center" py={8}>
                  Aucun résultat pour « {deferredQuery} »
                </Text>
              )}

              {!isLoading &&
                users?.map((u: any) => (
                  <Flex
                    key={u.id}
                    as="button"
                    onClick={() => handleSelectUser(u.userId)}
                    w="full"
                    px={4}
                    py={2.5}
                    gap={3}
                    align="center"
                    _hover={{ bg: 'bg.subtle' }}
                    transition="background 0.15s"
                  >
                    <Avatar.Root size="sm">
                      <Avatar.Image src={u.image ?? undefined} />
                      <Avatar.Fallback name={u.name} />
                    </Avatar.Root>
                    <Box textAlign="left">
                      <Text fontSize="sm" fontWeight="500">
                        {u.name}
                      </Text>
                      {u.email && (
                        <Text fontSize="xs" color="fg.muted">
                          {u.email}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                ))}
            </Box>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
