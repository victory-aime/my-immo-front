'use client';

import { Flex, Text, Box } from '@chakra-ui/react';
import { BaseButton, BaseIcon, Icons } from '_components/custom';
import { MotionFlex } from '_constants/motion';

export const RequestUserPushNotifPermission = ({
  enablePermission,
  dismiss,
  isLoading,
}: {
  enablePermission?: () => void;
  dismiss?: () => void;
  isLoading: boolean;
}) => {
  return (
    <MotionFlex
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      position="absolute"
      top="24px"
      zIndex="50"
      px={4}
      w="full"
      justifyContent="center"
    >
      <Box
        maxW="calc(100vw - 2rem)"
        _dark={{ bg: 'gray.800' }}
        border="1px solid"
        borderColor="border"
        borderRadius="2xl"
        boxShadow="xl"
        p={4}
      >
        {/* Header */}
        <Flex align="center" gap={3}>
          <BaseIcon>
            <Icons.Bell size={18} />
          </BaseIcon>

          <Box flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="600" color="fg">
              Restez informé en temps réel
            </Text>
            <Text fontSize="xs" color="fg.muted">
              Activez les notifications push
            </Text>
          </Box>
        </Flex>

        {/* Actions */}
        <Flex mt={4} justify="flex-end" gap={2}>
          <BaseButton
            variant="plain"
            size="sm"
            onClick={dismiss}
            color="fg.muted"
            fontSize="xs"
            px={2}
            isDisabled={isLoading}
          >
            Plus tard
          </BaseButton>

          <BaseButton size="sm" onClick={enablePermission} fontSize="xs" isLoading={isLoading}>
            Activer
          </BaseButton>
        </Flex>
      </Box>
    </MotionFlex>
  );
};
