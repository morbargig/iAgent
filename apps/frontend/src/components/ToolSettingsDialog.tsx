import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/TranslationContext';

// Tool configuration types
export interface ToolConfiguration {
  toolId: string;
  enabled: boolean;
  parameters: {
    pages?: {
      selectedPages: string[];
      inclusionType: 'include' | 'include_only' | 'exclude';
    };
    requiredWords?: string[];
    [key: string]: any;
  };
}

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  requiresConfiguration: boolean;
  configurationFields: {
    pages?: {
      required: boolean;
      options: { value: string; label: string }[];
    };
    requiredWords?: {
      required: boolean;
      placeholder: string;
    };
    [key: string]: any;
  };
}

interface ToolSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  tools: ToolSchema[];
  configurations: { [toolId: string]: ToolConfiguration };
  onConfigurationChange: (toolId: string, config: ToolConfiguration) => void;
  isDarkMode: boolean;
  isLoading?: boolean;
}

export const ToolSettingsDialog: React.FC<ToolSettingsDialogProps> = ({
  open,
  onClose,
  tools,
  configurations,
  onConfigurationChange,
  isDarkMode,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [localConfigs, setLocalConfigs] = useState<{ [toolId: string]: ToolConfiguration }>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [newWord, setNewWord] = useState<{ [toolId: string]: string }>({});

  // Initialize local configurations
  useEffect(() => {
    setLocalConfigs(configurations);
  }, [configurations]);

  const handleToolToggle = (toolId: string, enabled: boolean) => {
    const config = localConfigs[toolId] || {
      toolId,
      enabled: false,
      parameters: {},
    };
    
    const newConfig = { ...config, enabled };
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
  };

  const handlePagesChange = (toolId: string, selectedPages: string[]) => {
    const config = localConfigs[toolId] || {
      toolId,
      enabled: true,
      parameters: {},
    };
    
    const newConfig = {
      ...config,
      parameters: {
        ...config.parameters,
        pages: {
          ...config.parameters.pages,
          selectedPages,
        },
      },
    };
    
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
  };

  const handleInclusionTypeChange = (toolId: string, inclusionType: 'include' | 'include_only' | 'exclude') => {
    const config = localConfigs[toolId] || {
      toolId,
      enabled: true,
      parameters: {},
    };
    
    const newConfig = {
      ...config,
      parameters: {
        ...config.parameters,
        pages: {
          selectedPages: config.parameters.pages?.selectedPages || [],
          inclusionType,
        },
      },
    };
    
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
  };

  const handleAddRequiredWord = (toolId: string) => {
    const word = newWord[toolId]?.trim();
    if (!word) return;

    const config = localConfigs[toolId] || {
      toolId,
      enabled: true,
      parameters: {},
    };
    
    const currentWords = config.parameters.requiredWords || [];
    if (currentWords.includes(word)) return;

    const newConfig = {
      ...config,
      parameters: {
        ...config.parameters,
        requiredWords: [...currentWords, word],
      },
    };
    
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
    setNewWord(prev => ({ ...prev, [toolId]: '' }));
  };

  const handleRemoveRequiredWord = (toolId: string, wordToRemove: string) => {
    const config = localConfigs[toolId] || {
      toolId,
      enabled: true,
      parameters: {},
    };
    
    const newConfig = {
      ...config,
      parameters: {
        ...config.parameters,
        requiredWords: (config.parameters.requiredWords || []).filter(word => word !== wordToRemove),
      },
    };
    
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
  };

  const handleSave = () => {
    Object.values(localConfigs).forEach(config => {
      onConfigurationChange(config.toolId, config);
    });
    onClose();
  };

  const handleCancel = () => {
    setLocalConfigs(configurations);
    onClose();
  };

  const isToolConfigured = (toolId: string): boolean => {
    const config = localConfigs[toolId];
    const tool = tools.find(t => t.id === toolId);
    
    if (!config?.enabled || !tool?.requiresConfiguration) return true;
    
    // Check if required fields are configured
    if (tool.configurationFields.pages?.required && 
        (!config.parameters.pages?.selectedPages?.length)) {
      return false;
    }
    
    if (tool.configurationFields.requiredWords?.required && 
        (!config.parameters.requiredWords?.length)) {
      return false;
    }
    
    return true;
  };

  const getEnabledToolsRequiringConfig = () => {
    return tools.filter(tool => {
      const config = localConfigs[tool.id];
      return config?.enabled && tool.requiresConfiguration && !isToolConfigured(tool.id);
    });
  };

  const hasUnconfiguredTools = getEnabledToolsRequiringConfig().length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
          pb: 2,
        }}
      >
        <SettingsIcon />
        <Typography variant="h6">{t('tools.settings.title')}</Typography>
        {isLoading && <CircularProgress size={20} />}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {hasUnconfiguredTools && (
          <Alert 
            severity="warning" 
            sx={{ m: 2, mb: 0 }}
            icon={<WarningIcon />}
          >
            {t('tools.settings.configurationRequired')}
          </Alert>
        )}

        <Box sx={{ p: 2 }}>
          {tools.map((tool) => {
            const config = localConfigs[tool.id] || {
              toolId: tool.id,
              enabled: false,
              parameters: {},
            };
            const isConfigured = isToolConfigured(tool.id);
            const needsConfig = config.enabled && tool.requiresConfiguration && !isConfigured;

            return (
              <Accordion
                key={tool.id}
                expanded={expandedTool === tool.id}
                onChange={(_, isExpanded) => setExpandedTool(isExpanded ? tool.id : null)}
                sx={{
                  mb: 1,
                  border: needsConfig ? `1px solid #ff9800` : `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                  backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      my: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabled}
                          onChange={(e) => handleToolToggle(tool.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {tool.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {tool.description}
                      </Typography>
                    </Box>

                    {needsConfig && (
                      <Chip
                        icon={<WarningIcon />}
                        label={t('tools.settings.configRequired')}
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}

                    {config.enabled && isConfigured && (
                      <Chip
                        icon={<CheckIcon />}
                        label={t('tools.settings.configured')}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </AccordionSummary>

                {config.enabled && tool.requiresConfiguration && (
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Pages Configuration */}
                    {tool.configurationFields.pages && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                          {t('tools.settings.pages.title')}
                          {tool.configurationFields.pages.required && (
                            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                          )}
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>{t('tools.settings.pages.inclusionType')}</InputLabel>
                          <Select
                            value={config.parameters.pages?.inclusionType || 'include'}
                            onChange={(e) => handleInclusionTypeChange(tool.id, e.target.value as any)}
                            label={t('tools.settings.pages.inclusionType')}
                          >
                            <MenuItem value="include">{t('tools.settings.pages.include')}</MenuItem>
                            <MenuItem value="include_only">{t('tools.settings.pages.includeOnly')}</MenuItem>
                            <MenuItem value="exclude">{t('tools.settings.pages.exclude')}</MenuItem>
                          </Select>
                        </FormControl>

                        <Autocomplete
                          multiple
                          options={tool.configurationFields.pages.options}
                          value={tool.configurationFields.pages.options.filter(option => 
                            config.parameters.pages?.selectedPages?.includes(option.value)
                          )}
                          onChange={(_, newValue) => 
                            handlePagesChange(tool.id, newValue.map(option => option.value))
                          }
                          getOptionLabel={(option) => option.label}
                          isOptionEqualToValue={(option, value) => option.value === value.value}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={t('tools.settings.pages.placeholder')}
                              error={tool.configurationFields.pages.required && !config.parameters.pages?.selectedPages?.length}
                              helperText={
                                tool.configurationFields.pages.required && !config.parameters.pages?.selectedPages?.length
                                  ? t('tools.settings.pages.required')
                                  : t('tools.settings.pages.help')
                              }
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                label={option.label}
                                {...getTagProps({ index })}
                                key={option.value}
                              />
                            ))
                          }
                        />
                      </Box>
                    )}

                    {/* Required Words Configuration */}
                    {tool.configurationFields.requiredWords && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                          {t('tools.settings.requiredWords.title')}
                          {tool.configurationFields.requiredWords.required && (
                            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                          )}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            size="small"
                            placeholder={tool.configurationFields.requiredWords.placeholder}
                            value={newWord[tool.id] || ''}
                            onChange={(e) => setNewWord(prev => ({ ...prev, [tool.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddRequiredWord(tool.id);
                              }
                            }}
                            sx={{ flex: 1 }}
                            error={tool.configurationFields.requiredWords.required && !config.parameters.requiredWords?.length}
                          />
                          <Button
                            variant="outlined"
                            onClick={() => handleAddRequiredWord(tool.id)}
                            disabled={!newWord[tool.id]?.trim()}
                          >
                            {t('tools.settings.requiredWords.add')}
                          </Button>
                        </Box>

                        {tool.configurationFields.requiredWords.required && !config.parameters.requiredWords?.length && (
                          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mb: 1 }}>
                            {t('tools.settings.requiredWords.required')}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(config.parameters.requiredWords || []).map((word, index) => (
                            <Chip
                              key={index}
                              label={word}
                              onDelete={() => handleRemoveRequiredWord(tool.id, word)}
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                        
                        {config.parameters.requiredWords?.length === 0 && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
                            {t('tools.settings.requiredWords.empty')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </AccordionDetails>
                )}
              </Accordion>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}` }}>
        <Button onClick={handleCancel} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={hasUnconfiguredTools}
          sx={{
            minWidth: 100,
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 