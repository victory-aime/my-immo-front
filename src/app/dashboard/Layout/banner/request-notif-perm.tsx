'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { BaseButton } from '_components/custom';
import { useColorMode } from '_components/ui/color-mode';
import { EmailContainer } from './email-container';
import { MotionBox } from '_constants/motion';

export const RequestUserPushNotifPermission = ({
  enablePermission,
  dismiss,
  isLoading,
}: {
  enablePermission?: () => void;
  dismiss?: () => void;
  isLoading: boolean;
}) => {
  const { colorMode } = useColorMode();
  return (
    <MotionBox
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      position="absolute"
      top="44px"
      left="0"
      right="0"
      zIndex="50"
      px={8}
    >
      <Box
        bg={colorMode === 'light' ? 'red.50' : 'red.900'}
        border="1px solid"
        borderColor={colorMode === 'light' ? 'red.200' : 'red.400'}
        rounded="xl"
        shadow="sm"
        px={5}
        py={3}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          flexDir={{ base: 'column', sm: 'row' }}
        >
          <Text
            fontSize={{ base: 'sm', sm: 'md' }}
            color={colorMode === 'light' ? 'red.700' : 'white'}
          >
            Votre email n'est pas encore vérifié. Vérifiez votre boîte mail pour activer votre
            compte.
          </Text>

          <BaseButton
            variant={'outline'}
            colorType="success"
            onClick={dismiss}
            width={{ base: 'full', sm: 'fit-content' }}
            isLoading={isLoading}
          >
            Plus tard
          </BaseButton>
          <BaseButton
            variant={'outline'}
            colorType="success"
            onClick={enablePermission}
            width={{ base: 'full', sm: 'fit-content' }}
            isLoading={isLoading}
          >
            Activer
          </BaseButton>
        </Flex>
      </Box>
    </MotionBox>
  );
};
