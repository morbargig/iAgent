// Document Management Demo Page
// A dedicated page to showcase the complete document management system

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DocumentManagementDialog } from '../components/DocumentManagementDialog';
import { DocumentAttachment } from '../components/DocumentAttachment';
import { EnhancedInputArea } from '../components/EnhancedInputArea';
import { MessageAttachments } from '../components/MessageAttachments';
import { DocumentFile } from '../types/document.types';
import { useTranslation } from '../contexts/TranslationContext';

export const DocumentManagementDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentFile[]>([]);
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    attachments: DocumentFile[];
    timestamp: Date;
  }>>([]);

  // Handle document selection from dialog
  const handleDocumentSelect = (document: DocumentFile) => {
    console.log('Document selected:', document);
    setDialogOpen(false);
  };

  // Handle document attachment
  const handleDocumentsAttach = (documents: DocumentFile[]) => {
    setAttachedDocuments(documents);
  };

  // Handle message send
  const handleSendMessage = (message: string, attachments: DocumentFile[]) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      text: message,
      attachments,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setAttachedDocuments([]);
  };

  // Handle document preview
  const handleDocumentPreview = (document: DocumentFile) => {
    const content = document.metadata?.extractedText || 'No preview content available';
    const previewText = `📄 ${document.name}\n\nType: ${document.type}\nSize: ${(document.size / 1024).toFixed(1)} KB\n\nContent:\n${content}`;
    alert(previewText);
  };

  // Handle document download
  const handleDocumentDownload = async (document: DocumentFile) => {
    try {
      // Create a mock blob for download
      const content = document.metadata?.extractedText || `Content of ${document.name}`;
      const blob = new Blob([content], { type: document.mimeType });
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
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📄 Document Management System Demo
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center">
          Complete Document Management System
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Upload, manage, and attach documents to your conversations
        </Typography>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={2} mb={4}>
          <Button
            variant="contained"
            startIcon={<FolderIcon />}
            onClick={() => setDialogOpen(true)}
            size="large"
          >
            Open Document Manager
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Document Attachment Demo */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            📎 Document Attachment Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Attach documents to messages using the attachment component
          </Typography>
          
          <DocumentAttachment
            onDocumentsAttach={handleDocumentsAttach}
            attachedDocuments={attachedDocuments}
            maxAttachments={3}
            showInline={true}
          />
        </Paper>

        {/* Enhanced Input Area Demo */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            💬 Enhanced Input Area Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send messages with document attachments
          </Typography>
          
          <EnhancedInputArea
            onSendMessage={handleSendMessage}
            placeholder="Type your message here..."
            maxAttachments={3}
            showDocumentAttachment={true}
          />
        </Paper>

        {/* Messages Display */}
        {messages.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💬 Messages with Attachments
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {messages.map((message) => (
                <Paper key={message.id} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {message.text}
                  </Typography>
                  
                  {message.attachments.length > 0 && (
                    <MessageAttachments
                      attachments={message.attachments}
                      onDocumentPreview={handleDocumentPreview}
                      onDocumentDownload={handleDocumentDownload}
                      compact={false}
                    />
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {message.timestamp.toLocaleString()}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        )}
      </Container>

      {/* Document Management Dialog */}
      <DocumentManagementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onDocumentSelect={handleDocumentSelect}
        initialTab="manage"
        title="Document Management System"
      />
    </Box>
  );
};
