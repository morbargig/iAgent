import React from 'react';
import { FileAttachmentCard } from './FileAttachmentCard';
import { useAttachments } from '../hooks/useAttachments';

interface MessageAttachmentsProps {
  attachmentIds: string[];
  isDarkMode?: boolean;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachmentIds,
  isDarkMode = false,
}) => {
  const { attachments, failedIds, isLoading } = useAttachments(attachmentIds);

  if (isLoading && attachments.length === 0 && failedIds.length === 0) {
    return null;
  }

  const notFoundFiles = failedIds.map((id) => ({
    id,
    name: `File ${id.substring(0, 8)}...`,
    originalName: `File ${id.substring(0, 8)}...`,
    size: 0,
    type: 'application/octet-stream',
    mimeType: 'application/octet-stream',
    uploadedAt: new Date(),
    userId: 'unknown',
    status: 'error' as const,
    error: 'File not found',
  }));

  const allFiles = [...attachments, ...notFoundFiles];

  if (allFiles.length === 0) {
    return null;
  }

  return <FileAttachmentCard files={allFiles} isDarkMode={isDarkMode} />;
};

