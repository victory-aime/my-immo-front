import { ManageGoogleDrivePanel } from './ManageGoogleDrivePanel';
import { useFileUpload, FileUploadRootProvider } from '@chakra-ui/react';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '_components/custom/drag-drop/constant/constants';

export const GoogleDriveUpload = ({ status }: { status: boolean }) => {
  const fileUpload = useFileUpload({
    maxFiles: 5,
    maxFileSize: MAX_FILE_SIZE,
    accept: [...ACCEPTED_TYPES, 'application/pdf'],
  });

  return (
    <FileUploadRootProvider value={fileUpload}>
      <ManageGoogleDrivePanel clearFiles={() => fileUpload.clearFiles()} status={status} />
    </FileUploadRootProvider>
  );
};
