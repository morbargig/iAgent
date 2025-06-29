import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
} from '@mui/material';
import {
  Public as CountryIcon,
  CalendarMonth as DateIcon,
  Build as ToolIcon,
  Settings as ConfigIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/TranslationContext';

interface FilterPreviewProps {
  filterConfig: {
    selectedCountries?: string[];
    dateFilter?: {
      type: 'custom' | 'picker';
      customRange?: {
        amount: number;
        type: string;
      };
      dateRange?: {
        start?: string;
        end?: string;
      };
    };
    enabledTools?: string[];
    toolConfigurations?: Record<string, any>;
  };
  isDarkMode: boolean;
  showHeader?: boolean;
  compact?: boolean;
}

// Country flag mapping
const countryFlags: Record<string, string> = {
  'PS': '🇵🇸',
  'LB': '🇱🇧', 
  'SA': '🇸🇦',
  'IQ': '🇮🇶',
  'SY': '🇸🇾',
  'JO': '🇯🇴',
  'EG': '🇪🇬',
  'IL': '🇮🇱',
};

const countryNames: Record<string, string> = {
  'PS': 'Palestine',
  'LB': 'Lebanon',
  'SA': 'Saudi Arabia', 
  'IQ': 'Iraq',
  'SY': 'Syria',
  'JO': 'Jordan',
  'EG': 'Egypt',
  'IL': 'Israel',
};

export function FilterPreview({ 
  filterConfig, 
  isDarkMode, 
  showHeader = true, 
  compact = false 
}: FilterPreviewProps) {
  const { t } = useTranslation();

  const formatDateFilter = () => {
    if (!filterConfig.dateFilter) return null;
    
    if (filterConfig.dateFilter.type === 'custom' && filterConfig.dateFilter.customRange) {
      return `${filterConfig.dateFilter.customRange.amount} ${filterConfig.dateFilter.customRange.type} ago`;
    } else if (filterConfig.dateFilter.type === 'picker' && filterConfig.dateFilter.dateRange) {
      try {
        // Handle different date formats
        let startDate, endDate;
        
        if (typeof filterConfig.dateFilter.dateRange.start === 'string') {
          startDate = new Date(filterConfig.dateFilter.dateRange.start);
        } else if (filterConfig.dateFilter.dateRange.start && typeof filterConfig.dateFilter.dateRange.start === 'object') {
          // Handle dayjs objects or objects with toDate method
          const startObj = filterConfig.dateFilter.dateRange.start as any;
          startDate = startObj.toDate ? startObj.toDate() : new Date(startObj);
        }
        
        if (typeof filterConfig.dateFilter.dateRange.end === 'string') {
          endDate = new Date(filterConfig.dateFilter.dateRange.end);
        } else if (filterConfig.dateFilter.dateRange.end && typeof filterConfig.dateFilter.dateRange.end === 'object') {
          // Handle dayjs objects or objects with toDate method
          const endObj = filterConfig.dateFilter.dateRange.end as any;
          endDate = endObj.toDate ? endObj.toDate() : new Date(endObj);
        }
        
        // Validate dates
        if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
          return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
      } catch (error) {
        console.warn('Error formatting date range:', error);
      }
      
      return 'Custom date range';
    }
    
    return 'Date filter applied';
  };

  const hasData = (
    filterConfig.selectedCountries?.length ||
    filterConfig.dateFilter ||
    filterConfig.enabledTools?.length ||
    Object.keys(filterConfig.toolConfigurations || {}).length
  );

  if (!hasData) {
    return (
      <Typography 
        variant="body2" 
        sx={{ 
          color: isDarkMode ? '#aaaaaa' : '#666666',
          fontStyle: 'italic',
          textAlign: 'center',
          py: 2
        }}
      >
        {t('filter.noFilterConfigurationAvailable')}
      </Typography>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          icon={<CountryIcon sx={{ fontSize: '14px' }} />}
          label={filterConfig.selectedCountries?.length 
            ? `${filterConfig.selectedCountries.length} ${t('filter.countries')}`
            : t('filter.noCountriesSelected')
          }
          size="small"
          sx={{
            height: '24px',
            fontSize: '11px',
            backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
            color: isDarkMode ? '#60a5fa' : '#1e40af',
          }}
        />
        {filterConfig.dateFilter && (
          <Chip
            icon={<DateIcon sx={{ fontSize: '14px' }} />}
            label={formatDateFilter()}
            size="small"
            sx={{
              height: '24px',
              fontSize: '11px',
              backgroundColor: isDarkMode ? '#7c2d12' : '#fed7aa',
              color: isDarkMode ? '#fb923c' : '#9a3412',
            }}
          />
        )}
        {filterConfig.enabledTools?.length && (
          <Chip
            icon={<ToolIcon sx={{ fontSize: '14px' }} />}
            label={`${filterConfig.enabledTools.length} ${t('filter.tools')}`}
            size="small"
            sx={{
              height: '24px',
              fontSize: '11px',
              backgroundColor: isDarkMode ? '#166534' : '#dcfce7',
              color: isDarkMode ? '#4ade80' : '#166534',
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Card
      sx={{
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {showHeader && (
          <>
            <Typography
              variant="subtitle2"
              sx={{
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {t('filter.filterConfiguration')}
            </Typography>
            <Divider sx={{ mb: 2, backgroundColor: isDarkMode ? '#444444' : '#e0e0e0' }} />
          </>
        )}

        <List sx={{ p: 0 }}>
          {/* Countries Section */}
          <ListItem sx={{ px: 0, py: 1 }}>
            <ListItemIcon sx={{ minWidth: '36px' }}>
              <CountryIcon sx={{ color: isDarkMode ? '#60a5fa' : '#1e40af' }} />
            </ListItemIcon>
            <ListItemText
              primary={t('filter.selectedCountries')}
              secondary={
                filterConfig.selectedCountries?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {filterConfig.selectedCountries.map((countryCode) => (
                      <Chip
                        key={countryCode}
                        label={`${countryFlags[countryCode] || ''} ${countryNames[countryCode] || countryCode}`}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '11px',
                          backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                          color: isDarkMode ? '#60a5fa' : '#1e40af',
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? '#aaaaaa' : '#666666',
                      fontStyle: 'italic',
                      mt: 0.5,
                    }}
                  >
                    {t('filter.noCountriesSelected')}
                  </Typography>
                )
              }
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 500,
                color: isDarkMode ? '#ffffff' : '#000000',
              }}
            />
          </ListItem>

          {/* Date Filter Section */}
          {filterConfig.dateFilter && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: '36px' }}>
                <DateIcon sx={{ color: isDarkMode ? '#fb923c' : '#9a3412' }} />
              </ListItemIcon>
              <ListItemText
                primary={t('filter.dateRange')}
                secondary={formatDateFilter()}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                  color: isDarkMode ? '#ffffff' : '#000000',
                }}
                secondaryTypographyProps={{
                  variant: 'body2',
                  color: isDarkMode ? '#cccccc' : '#666666',
                }}
              />
            </ListItem>
          )}

          {/* Tools Section */}
          {filterConfig.enabledTools?.length && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: '36px' }}>
                <ToolIcon sx={{ color: isDarkMode ? '#4ade80' : '#166534' }} />
              </ListItemIcon>
              <ListItemText
                primary={t('filter.enabledTools')}
                secondary={
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {filterConfig.enabledTools.map((toolId) => (
                      <Chip
                        key={toolId}
                        label={toolId}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '11px',
                          backgroundColor: isDarkMode ? '#166534' : '#dcfce7',
                          color: isDarkMode ? '#4ade80' : '#166534',
                        }}
                      />
                    ))}
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                  color: isDarkMode ? '#ffffff' : '#000000',
                }}
              />
            </ListItem>
          )}

          {/* Tool Configurations Section */}
          {filterConfig.toolConfigurations && Object.keys(filterConfig.toolConfigurations).length > 0 && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: '36px' }}>
                <ConfigIcon sx={{ color: isDarkMode ? '#a78bfa' : '#7c3aed' }} />
              </ListItemIcon>
              <ListItemText
                primary={t('filter.toolConfigurations')}
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    {Object.entries(filterConfig.toolConfigurations).map(([toolId, config]) => (
                      <Box key={toolId} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isDarkMode ? '#cccccc' : '#666666',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {toolId}
                          </Typography>
                          <Chip
                            label={config.enabled ? t('filter.enabled') : t('filter.disabled')}
                            size="small"
                            sx={{
                              height: '16px',
                              fontSize: '9px',
                              backgroundColor: config.enabled 
                                ? (isDarkMode ? '#166534' : '#dcfce7')
                                : (isDarkMode ? '#7f1d1d' : '#fee2e2'),
                              color: config.enabled 
                                ? (isDarkMode ? '#4ade80' : '#166534')
                                : (isDarkMode ? '#ef4444' : '#dc2626'),
                            }}
                          />
                        </Box>
                        
                        {/* Show parameters if they exist */}
                        {config.parameters && Object.keys(config.parameters).length > 0 && (
                          <Box sx={{ ml: 1, mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDarkMode ? '#aaaaaa' : '#888888',
                                fontSize: '10px',
                                fontWeight: 500,
                              }}
                            >
                              {t('filter.configuration')}:
                            </Typography>
                            {Object.entries(config.parameters).map(([key, value]) => (
                              <Typography
                                key={key}
                                variant="caption"
                                sx={{
                                  color: isDarkMode ? '#999999' : '#777777',
                                  display: 'block',
                                  fontSize: '9px',
                                  ml: 1,
                                }}
                              >
                                • {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        
                        {/* Show if no parameters but tool is configured */}
                        {(!config.parameters || Object.keys(config.parameters).length === 0) && config.enabled && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: isDarkMode ? '#aaaaaa' : '#888888',
                              fontSize: '9px',
                              ml: 1,
                              fontStyle: 'italic',
                            }}
                          >
                            Default configuration
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                  color: isDarkMode ? '#ffffff' : '#000000',
                }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
} 