'use client';

import {
  Badge,
  Box,
  Button,
  Circle,
  HStack,
  Icon,
  IconButton,
  Progress,
  VStack,
} from '@chakra-ui/react';
import {
  BaseText,
  TextVariant,
  BaseUploadMultipleFiles,
  CustomSkeletonLoader,
  BaseButton,
} from '_components/custom';
import { useState } from 'react';
import { HiOutlineCloud, HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import { getFileIcon, getFileIconColor } from '_hooks/download';
import { IntegrationsProviderModule } from '_store/state-management';
import { formatDisplayDate, getTimeValue } from 'rise-core-frontend';
import { useFakeProgress } from '_hooks/useFakeProgress';
import React from 'react';

/**
 * =========================================================================
 *
 * Points de branchement futurs, repérables via les commentaires TODO :
 *  - handleDisconnect   -> POST /v1/secure/integrations/providers/disconnect  (⚠️ voir note plus bas)
 *  - handleDeleteFile   -> DELETE /v1/secure/integrations/providers/files/:fileId (endpoint à créer)
 *
 * =========================================================================
 */

export const ManageGoogleDrivePanel = ({
  clearFiles,
  onEnabled,
}: {
  clearFiles?: () => void;
  onEnabled: () => void;
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const { stop, start, complete } = useFakeProgress();

  const { data, isLoading } = IntegrationsProviderModule.getProviderStatusQueries({
    params: { provider: 'GOOGLE_DRIVE' },
  });

  const {
    data: filesData,
    refetch,
    isLoading: isLoadingFiles,
  } = IntegrationsProviderModule.getProviderFilesQueries({
    params: { provider: 'GOOGLE_DRIVE' },
    queryOptions: { enabled: data?.connected },
  });

  const { mutateAsync } = IntegrationsProviderModule.uploadFileMutation({
    mutationOptions: {
      onSuccess: async () => {
        await refetch();
      },
    },
  });

  const handleDisconnect = () => {};

  const handleFilesUploaded = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    clearFiles?.();

    newFiles.forEach(async (file) => {
      const id = crypto.randomUUID();
      setUploadingFiles((prev) => [...prev, { id, name: file.name, progress: 0 }]);

      start(id, (progress) => {
        setUploadingFiles((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u)));
      });

      const formData = new FormData();
      formData.append('file', file);

      try {
        await mutateAsync({
          payload: { file: formData as unknown as string },
          params: { provider: 'GOOGLE_DRIVE' },
        });
        complete(id, (progress) => {
          setUploadingFiles((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u)));
        });
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
        }, 800);
      } catch (e) {
        stop(id);
        setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
      } finally {
        complete(id, (progress) => {
          setUploadingFiles((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u)));
        });
      }
    });
  };

  const handleDeleteFile = (fileId: string) => {};

  if (!data?.connected && !isLoading) {
    return (
      <VStack py={10} gap={3} w="full">
        <Circle size="10" bg="green.50" color="green.600">
          <HiOutlineCloud size={20} />
        </Circle>
        <BaseText variant={TextVariant.M} color="fg.muted">
          Connectez votre Google Drive pour envoyer des fichiers.
        </BaseText>
        <BaseButton onClick={onEnabled}>Connecter mon drive</BaseButton>
      </VStack>
    );
  }

  return (
    <React.Fragment>
      {isLoading || isLoadingFiles ? (
        <CustomSkeletonLoader type={'DATA_TABLE'} />
      ) : (
        <FileUpload.Dropzone
          border={'none'}
          width={'full'}
          borderColor="transparent"
          borderRadius="l2"
          transition="all 0.15s ease"
          _dragging={{
            borderColor: 'primary.500',
            border: '2px dashed',
            bg: 'primary.50',
            height: '100svh',
          }}
        >
          <VStack align="stretch" gap={4} w="full">
            <HStack justify="space-between">
              <HStack gap={3}>
                <Circle size="10" bg="green.50" color="green.600">
                  <HiOutlineCloud size={20} />
                </Circle>
                <Box>
                  <BaseText variant={TextVariant.S} fontWeight="medium">
                    Google Drive
                  </BaseText>
                  <BaseText variant={TextVariant.XS} color="fg.muted">
                    Accès limité aux fichiers créés par l'application
                  </BaseText>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Badge colorPalette="green" variant="subtle">
                  Connecté
                </Badge>
                <Button size="xs" variant="outline" onClick={handleDisconnect}>
                  Déconnecter
                </Button>
              </HStack>
            </HStack>

            <BaseUploadMultipleFiles getFilesUploaded={handleFilesUploaded} />

            <VStack align="stretch" gap={0} borderWidth="1px" borderRadius="l2" overflow="hidden">
              {uploadingFiles.map((u) => (
                <HStack key={u.id} px={4} py={3} borderBottomWidth="1px" gap={3}>
                  <BaseText variant={TextVariant.S} flex={1} truncate>
                    {u.name}
                  </BaseText>
                  <Progress.Root value={u.progress} w="32" size="xs" colorPalette="blue">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <BaseText variant={TextVariant.XS} color="fg.muted" fontFamily="mono">
                    {u.progress}%
                  </BaseText>
                </HStack>
              ))}

              {filesData?.map((file, index) => {
                const config = getFileIconColor(file.name);
                const FileIcon = getFileIcon(file?.name);
                return (
                  <HStack
                    key={file.fileId}
                    px={4}
                    py={3}
                    gap={3}
                    borderBottomWidth={index === filesData?.length - 1 ? '0' : '1px'}
                  >
                    <Circle size="8" bg={config.bg} color={config.color} flexShrink={0}>
                      <Icon
                        as={FileIcon}
                        boxSize={3.5}
                        color={config.color}
                        _dark={{ color: config.color }}
                      />
                    </Circle>

                    <Box flex={1} minW={0}>
                      <BaseText variant={TextVariant.S} truncate>
                        {file.name}
                      </BaseText>
                      <BaseText variant={TextVariant.XS} color="fg.muted" fontFamily="mono">
                        {file?.size} · {formatDisplayDate(file.modifiedTime)} ·{' '}
                        {getTimeValue(file.modifiedTime!)}
                      </BaseText>
                    </Box>
                    <IconButton
                      aria-label="Ouvrir dans Google Drive"
                      size="xs"
                      variant="ghost"
                      color="fg.muted"
                      onClick={() => window.open(file.webViewLink, '_blank')}
                    >
                      <HiOutlineExternalLink size={16} />
                    </IconButton>
                    <IconButton
                      aria-label="Supprimer"
                      size="xs"
                      variant="ghost"
                      color="fg.muted"
                      onClick={() => handleDeleteFile(file.fileId)}
                    >
                      <HiOutlineTrash size={16} />
                    </IconButton>
                  </HStack>
                );
              })}

              {filesData?.length === 0 && uploadingFiles.length === 0 && (
                <Box px={4} py={8} textAlign="center">
                  <BaseText variant={TextVariant.S} color="fg.muted">
                    Aucun fichier envoyé pour l'instant.
                  </BaseText>
                </Box>
              )}
            </VStack>
          </VStack>
        </FileUpload.Dropzone>
      )}
    </React.Fragment>
  );
};
