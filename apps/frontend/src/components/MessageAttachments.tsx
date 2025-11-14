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
  const { attachments, isLoading } = useAttachments(attachmentIds);

  if (isLoading || attachments.length === 0) {
    return null;
  }

  return <FileAttachmentCard files={attachments} isDarkMode={isDarkMode} />;
};

