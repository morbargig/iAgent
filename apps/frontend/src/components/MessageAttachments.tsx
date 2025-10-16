// Message Attachments Component
// Display attachments in chat messages

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { DocumentFile, formatFileSize, getFileIcon, getFileIconComponent } from '../types/document.types';
import { useDocumentService } from '../services/documentService';
import { useTranslation } from '../contexts/TranslationContext';

interface MessageAttachmentsProps {
  attachments: DocumentFile[];
  onDocumentPreview?: (document: DocumentFile) => void;
  onDocumentDownload?: (document: DocumentFile) => void;
  compact?: boolean;
  maxDisplay?: number;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onDocumentPreview,
  onDocumentDownload,
  compact = false,
  maxDisplay = 3,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const documentService = useDocumentService();

  // Handle document preview
  const handleDocumentPreview = (document: DocumentFile) => {
    if (onDocumentPreview) {
      onDocumentPreview(document);
    } else {
      // Default preview behavior - show alert
      const content = document.metadata?.extractedText || 'No preview content available';
      const previewText = `📄 ${document.name}\n\nType: ${document.type}\nSize: ${(document.size / 1024).toFixed(1)} KB\n\nContent:\n${content}`;
      alert(previewText);
    }
  };

  // Handle document download
  const handleDocumentDownload = async (document: DocumentFile) => {
    if (onDocumentDownload) {
      onDocumentDownload(document);
    } else {
      // Default download behavior
      try {
        const blob = await documentService.downloadDocument(document.id);
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = document.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  // Don't render if no attachments
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Show only first few attachments in compact mode
  const displayAttachments = compact 
    ? attachments.slice(0, maxDisplay)
    : attachments;

  // Render compact view with type-specific icons
  if (compact) {
    return (
      <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
        {displayAttachments.map((attachment) => {
          const { Icon, color } = getFileIconComponent(attachment.mimeType);
          return (
            <Chip
              key={attachment.id}
              avatar={
                <Avatar sx={{ bgcolor: `${color}20`, width: 24, height: 24 }}>
                  <Icon sx={{ fontSize: '0.75rem', color: color }} />
                </Avatar>
              }
              label={
                <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                  {attachment.name}
                </Typography>
              }
              size="small"
              variant="outlined"
              onClick={() => handleDocumentPreview(attachment)}
              sx={{ 
                cursor: 'pointer',
                borderColor: `${color}40`,
                '&:hover': {
                  borderColor: color,
                  backgroundColor: `${color}08`,
                }
              }}
            />
          );
        })}
        {attachments.length > maxDisplay && (
          <Chip
            label={`+${attachments.length - maxDisplay}`}
            size="small"
            variant="outlined"
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>
    );
  }

  // Render full view with type-specific icons
  return (
    <Box mt={1}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {t('attachments')} ({attachments.length})
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={1}>
        {displayAttachments.map((attachment) => {
          const { Icon, color } = getFileIconComponent(attachment.mimeType);
          return (
            <Paper
              key={attachment.id}
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderColor: `${color}30`,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: `${color}60`,
                },
              }}
            >
              <Avatar sx={{ bgcolor: `${color}20` }}>
                <Icon sx={{ color: color }} />
              </Avatar>
              
              <Box flexGrow={1} minWidth={0}>
                <Typography variant="body2" noWrap>
                  {attachment.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(attachment.size)} • {attachment.type}
                </Typography>
                {attachment.metadata?.summary && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {attachment.metadata.summary}
                  </Typography>
                )}
              </Box>
              
              <Box display="flex" gap={0.5}>
                <Tooltip title={t('preview')}>
                  <IconButton
                    size="small"
                    onClick={() => handleDocumentPreview(attachment)}
                    sx={{
                      '&:hover': {
                        color: color,
                      }
                    }}
                  >
                    <PreviewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('download')}>
                  <IconButton
                    size="small"
                    onClick={() => handleDocumentDownload(attachment)}
                    sx={{
                      '&:hover': {
                        color: color,
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
        
        {attachments.length > maxDisplay && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {t('andMoreAttachments', { count: attachments.length - maxDisplay })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
