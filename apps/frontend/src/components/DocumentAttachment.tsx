// Document Attachment Component
// Component for attaching documents to chat messages

import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  AttachFile as AttachIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { DocumentFile, formatFileSize, getFileIcon } from '../types/document.types';
import { DocumentManagementDialog } from './DocumentManagementDialog';
import { useTranslation } from '../contexts/TranslationContext';

interface DocumentAttachmentProps {
  onDocumentsAttach?: (documents: DocumentFile[]) => void;
  attachedDocuments?: DocumentFile[];
  maxAttachments?: number;
  disabled?: boolean;
  showInline?: boolean;
}

type DialogMode = 'closed' | 'upload' | 'select';

export const DocumentAttachment: React.FC<DocumentAttachmentProps> = ({
  onDocumentsAttach,
  attachedDocuments = [],
  maxAttachments = 5,
  disabled = false,
  showInline = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [dialogMode, setDialogMode] = useState<DialogMode>('closed');
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentFile[]>([]);

  // Handle document selection
  const handleDocumentSelect = (document: DocumentFile) => {
    if (attachedDocuments.find(doc => doc.id === document.id)) {
      return; // Document already attached
    }

    const newAttachments = [...attachedDocuments, document];
    if (newAttachments.length <= maxAttachments) {
      onDocumentsAttach?.(newAttachments);
    }
    setDialogMode('closed');
  };

  // Handle document removal
  const handleDocumentRemove = (documentId: string) => {
    const newAttachments = attachedDocuments.filter(doc => doc.id !== documentId);
    onDocumentsAttach?.(newAttachments);
  };

  // Handle attachment button click
  const handleAttachClick = () => {
    if (attachedDocuments.length >= maxAttachments) {
      return;
    }
    setDialogMode('select');
  };

  // Handle upload button click
  const handleUploadClick = () => {
    setDialogMode('upload');
  };

  // Render attached documents
  const renderAttachedDocuments = () => {
    if (attachedDocuments.length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('attachedDocuments')} ({attachedDocuments.length}/{maxAttachments})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {attachedDocuments.map((document) => (
            <Chip
              key={document.id}
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {getFileIcon(document.mimeType)}
                </Avatar>
              }
              label={
                <Box>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {document.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(document.size)}
                  </Typography>
                </Box>
              }
              onDelete={() => handleDocumentRemove(document.id)}
              deleteIcon={<CloseIcon />}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };

  // Render attachment button
  const renderAttachmentButton = () => {
    if (showInline) {
      return (
        <Box display="flex" gap={1} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<AttachIcon />}
            onClick={handleAttachClick}
            disabled={disabled || attachedDocuments.length >= maxAttachments}
            size="small"
          >
            {t('attachDocument')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileIcon />}
            onClick={handleUploadClick}
            disabled={disabled}
            size="small"
          >
            {t('uploadNew')}
          </Button>
        </Box>
      );
    }

    return (
      <IconButton
        onClick={handleAttachClick}
        disabled={disabled || attachedDocuments.length >= maxAttachments}
        size="small"
        sx={{
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.light + '20',
          },
        }}
      >
        <AttachIcon />
      </IconButton>
    );
  };

  return (
    <Box>
      {renderAttachmentButton()}
      {renderAttachedDocuments()}

      {/* Document Management Dialog */}
      <DocumentManagementDialog
        open={dialogMode !== 'closed'}
        onClose={() => setDialogMode('closed')}
        onDocumentSelect={handleDocumentSelect}
        initialTab={dialogMode === 'upload' ? 'upload' : 'manage'}
        selectionMode={dialogMode === 'select'}
        selectedDocuments={selectedDocuments}
        maxSelection={maxAttachments - attachedDocuments.length}
        title={dialogMode === 'upload' ? t('uploadDocument') : t('selectDocument')}
      />
    </Box>
  );
};
