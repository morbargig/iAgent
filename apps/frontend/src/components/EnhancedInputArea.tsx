// Enhanced Input Area Component
// Enhanced input area with document attachment support

import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';
import { DocumentFile } from '../types/document.types';
import { DocumentAttachment } from './DocumentAttachment';
import { useTranslation } from '../contexts/TranslationContext';

interface EnhancedInputAreaProps {
  onSendMessage?: (message: string, attachments: DocumentFile[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxAttachments?: number;
  showDocumentAttachment?: boolean;
}

export const EnhancedInputArea: React.FC<EnhancedInputAreaProps> = ({
  onSendMessage,
  placeholder,
  disabled = false,
  maxAttachments = 5,
  showDocumentAttachment = true,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [message, setMessage] = useState('');
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentFile[]>([]);
  const textFieldRef = useRef<HTMLInputElement>(null);

  // Handle message send
  const handleSendMessage = () => {
    if (!message.trim() && attachedDocuments.length === 0) {
      return;
    }

    onSendMessage?.(message.trim(), attachedDocuments);
    setMessage('');
    setAttachedDocuments([]);
    
    // Focus back to input
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Handle document attachment
  const handleDocumentsAttach = (documents: DocumentFile[]) => {
    setAttachedDocuments(documents);
  };

  // Check if send button should be enabled
  const canSend = message.trim().length > 0 || attachedDocuments.length > 0;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Document Attachments */}
      {showDocumentAttachment && (
        <DocumentAttachment
          onDocumentsAttach={handleDocumentsAttach}
          attachedDocuments={attachedDocuments}
          maxAttachments={maxAttachments}
          disabled={disabled}
          showInline={true}
        />
      )}

      {/* Input Area */}
      <Box display="flex" alignItems="flex-end" gap={1} mt={1}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || t('typeMessage')}
          disabled={disabled}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        
        <Box display="flex" flexDirection="column" gap={1}>
          {showDocumentAttachment && (
            <DocumentAttachment
              onDocumentsAttach={handleDocumentsAttach}
              attachedDocuments={attachedDocuments}
              maxAttachments={maxAttachments}
              disabled={disabled}
              showInline={false}
            />
          )}
          
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={disabled || !canSend}
            startIcon={<SendIcon />}
            sx={{
              minWidth: 'auto',
              px: 2,
              borderRadius: 2,
            }}
          >
            {t('send')}
          </Button>
        </Box>
      </Box>

      {/* Attachment Summary */}
      {attachedDocuments.length > 0 && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            {t('readyToSend')}: {attachedDocuments.length} {t('documents')}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
