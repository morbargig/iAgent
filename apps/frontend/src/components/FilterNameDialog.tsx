import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import { useTranslation } from '../contexts/TranslationContext';

interface FilterNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, isGlobal: boolean) => void;
  isDarkMode: boolean;
  mode: 'create' | 'rename';
  currentName?: string;
  filterPreview?: {
    countries: string[];
    tools: string[];
    dateRange: string;
  };
}

export function FilterNameDialog({
  open,
  onClose,
  onSave,
  isDarkMode,
  mode,
  currentName = '',
  filterPreview,
}: FilterNameDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [isGlobal, setIsGlobal] = useState(false);

  React.useEffect(() => {
    if (open) {
      setName(currentName);
      setIsGlobal(false);
    }
  }, [open, currentName]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), isGlobal);
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && name.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle sx={{ color: isDarkMode ? '#ffffff' : '#000000', pb: 1 }}>
        {mode === 'create' ? 'Save Filter' : 'Rename Filter'}
      </DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Filter Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'create' ? `My Filter ${new Date().toLocaleDateString()}` : ''}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: isDarkMode ? '#ffffff' : '#000000',
              '& fieldset': {
                borderColor: isDarkMode ? '#666666' : '#cccccc',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? '#888888' : '#999999',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2196f3',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? '#cccccc' : '#666666',
              '&.Mui-focused': {
                color: '#2196f3',
              },
            },
          }}
        />

        {mode === 'create' && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#2196f3',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#2196f3',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Global Filter
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#aaaaaa' : '#666666' }}>
                    {isGlobal ? 'Available across all chats' : 'Only for this chat'}
                  </Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />

            {filterPreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#ffffff' : '#000000', mb: 1 }}>
                  Filter Settings:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filterPreview.countries.length > 0 && (
                    <Chip
                      label={`${filterPreview.countries.length} countries`}
                      size="small"
                      sx={{
                        backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                        color: isDarkMode ? '#60a5fa' : '#1e40af',
                      }}
                    />
                  )}
                  {filterPreview.tools.length > 0 && (
                    <Chip
                      label={`${filterPreview.tools.length} tools`}
                      size="small"
                      sx={{
                        backgroundColor: isDarkMode ? '#166534' : '#dcfce7',
                        color: isDarkMode ? '#4ade80' : '#166534',
                      }}
                    />
                  )}
                  {filterPreview.dateRange && (
                    <Chip
                      label={filterPreview.dateRange}
                      size="small"
                      sx={{
                        backgroundColor: isDarkMode ? '#7c2d12' : '#fed7aa',
                        color: isDarkMode ? '#fb923c' : '#9a3412',
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: isDarkMode ? '#cccccc' : '#666666' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!name.trim()}
          sx={{
            backgroundColor: '#2196f3',
            '&:hover': {
              backgroundColor: '#1976d2',
            },
          }}
        >
          {mode === 'create' ? 'Save Filter' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 