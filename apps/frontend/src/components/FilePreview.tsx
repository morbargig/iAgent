import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Code as CodeIcon,
  Archive as ArchiveIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { fileService } from '../services/fileService';
import { getFileIconComponent } from '../types/document.types';

interface AttachedFile {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}

interface FilePreviewProps {
  files: AttachedFile[];
  onRemoveFile?: (fileId: string) => void;
  onDownloadFile?: (fileId: string, filename: string) => void;
  isDarkMode?: boolean;
  compact?: boolean; // ChatGPT-style compact inline cards
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onRemoveFile,
  onDownloadFile,
  isDarkMode = false,
  compact = false,
}) => {
  if (files.length === 0) return null;

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <ImageIcon />;
    if (mimetype.startsWith('video/')) return <VideoIcon />;
    if (mimetype.startsWith('audio/')) return <AudioIcon />;
    if (mimetype.includes('pdf') || mimetype.includes('document')) return <DocumentIcon />;
    if (mimetype.includes('text') || mimetype.includes('code')) return <CodeIcon />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <ArchiveIcon />;
    return <AttachFileIcon />;
  };

  const handleDownload = (file: AttachedFile) => {
    if (onDownloadFile) {
      onDownloadFile(file.id, file.filename);
    } else {
      fileService.downloadFile(file.id, file.filename);
    }
  };

  const handlePreview = (file: AttachedFile) => {
    fileService.previewFile(file.id);
  };

  // Compact mode for ChatGPT-style inline cards with type-specific icons
  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {files.map((file) => {
          const { Icon, color } = getFileIconComponent(file.mimetype);
          return (
            <Paper
              key={file.id}
              elevation={0}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                pr: 1.5,
                borderRadius: '12px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : `${color}30`}`,
                maxWidth: '280px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : `${color}08`,
                  boxShadow: isDarkMode 
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  borderColor: `${color}60`,
                  '& .action-icons': {
                    opacity: 1,
                  },
                },
              }}
            >
              {/* File icon with type-specific color */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? `${color}20` : `${color}15`,
                  color: color,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              
              {/* File info */}
              <Box flex={1} minWidth={0}>
                <Typography 
                  variant="body2" 
                  fontWeight={500}
                  noWrap
                  sx={{ 
                    color: isDarkMode ? '#ffffff' : '#374151',
                    fontSize: '0.875rem',
                    lineHeight: 1.2,
                  }}
                >
                  {file.filename}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isDarkMode ? '#8e8ea0' : '#6b7280',
                    fontSize: '0.75rem',
                  }}
                >
                  {fileService.formatFileSize(file.size)}
                </Typography>
              </Box>
              
              {/* Action icons (visible on hover) */}
              <Box 
                className="action-icons"
                sx={{ 
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {onRemoveFile && (
                  <Tooltip title="Remove">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file.id);
                      }}
                      size="small"
                      sx={{
                        width: 20,
                        height: 20,
                        color: isDarkMode ? '#8e8ea0' : '#6b7280',
                        '&:hover': {
                          color: '#ef4444',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Preview">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(file);
                    }}
                    size="small"
                    sx={{
                      width: 20,
                      height: 20,
                      color: isDarkMode ? '#8e8ea0' : '#6b7280',
                      '&:hover': {
                        color: color,
                      },
                    }}
                  >
                    <PreviewIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    size="small"
                    sx={{
                      width: 20,
                      height: 20,
                      color: isDarkMode ? '#8e8ea0' : '#6b7280',
                      '&:hover': {
                        color: color,
                      },
                    }}
                  >
                    <DownloadIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Default mode (full-width cards with actions)
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Attached files ({files.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {files.map((file) => (
          <Paper
            key={file.id}
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              minWidth: '200px',
              maxWidth: '300px',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              {/* File icon */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? '#ffffff' : '#374151',
                }}
              >
                {getFileIcon(file.mimetype)}
              </Box>
              
              {/* File info */}
              <Box flex={1} minWidth={0}>
                <Typography 
                  variant="body2" 
                  fontWeight="medium" 
                  noWrap
                  sx={{ color: isDarkMode ? '#ffffff' : '#374151' }}
                >
                  {file.filename}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ color: isDarkMode ? '#8e8ea0' : '#6b7280' }}
                >
                  {fileService.formatFileSize(file.size)}
                </Typography>
              </Box>
              
              {/* Action buttons */}
              <Box display="flex" gap={0.5}>
                <Tooltip title="Preview">
                  <IconButton
                    onClick={() => handlePreview(file)}
                    size="small"
                    sx={{
                      color: isDarkMode ? '#8e8ea0' : '#6b7280',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <PreviewIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Download">
                  <IconButton
                    onClick={() => handleDownload(file)}
                    size="small"
                    sx={{
                      color: isDarkMode ? '#8e8ea0' : '#6b7280',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <DownloadIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                
                {onRemoveFile && (
                  <Tooltip title="Remove">
                    <IconButton
                      onClick={() => onRemoveFile(file.id)}
                      size="small"
                      sx={{
                        color: isDarkMode ? '#8e8ea0' : '#6b7280',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};
