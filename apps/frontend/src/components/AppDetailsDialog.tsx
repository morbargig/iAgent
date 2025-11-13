import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { environment } from "../environments/environment";

interface AppDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const AppDetailsDialog: React.FC<AppDetailsDialogProps> = ({
  open,
  onClose,
  isDarkMode,
}) => {
  const { t, currentLang } = useTranslation();

  const baseVersion = typeof __APP_VERSION__ !== 'undefined' 
    ? __APP_VERSION__ 
    : environment.app.version;
  
  const appVersion = `v.${baseVersion}-${environment.env}`;
  
  const getLocaleCode = () => {
    switch (currentLang) {
      case 'he': return 'he-IL';
      case 'ar': return 'ar-SA';
      default: return 'en-US';
    }
  };

  const formatBuildDate = (dateString: string | undefined) => {
    const date = dateString
      ? new Date(dateString)
      : typeof __BUILD_DATE__ !== 'undefined'
      ? new Date(__BUILD_DATE__)
      : new Date();
    
    const locale = getLocaleCode();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return date.toLocaleString(locale, options);
  };
  
  const buildDate = formatBuildDate(environment.buildDate);

  const envLabel = environment.env.charAt(0).toUpperCase() + environment.env.slice(1);

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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
          pb: 2,
        }}
      >
        <InfoIcon />
        <Typography variant="h6">{t('appDetails.title')}</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Logo Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="iAgent Logo"
              sx={{
                maxWidth: '120px',
                maxHeight: '120px',
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Pilot Warning */}
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: '8px',
            }}
            icon={<InfoIcon />}
          >
            <Typography variant="body2" fontWeight={500}>
              {t('appDetails.pilotWarning')}
            </Typography>
          </Alert>

          {/* Contact Information */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#000000',
              }}
            >
              {t('appDetails.contact')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 80, color: isDarkMode ? '#a3a3a3' : '#6b7280' }}>
                  {t('appDetails.teamName')}:
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#fafafa' : '#111827' }}>
                  {environment.contact.teamName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 80, color: isDarkMode ? '#a3a3a3' : '#6b7280' }}>
                  {t('appDetails.email')}:
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#fafafa' : '#111827' }}>
                  {environment.contact.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 80, color: isDarkMode ? '#a3a3a3' : '#6b7280' }}>
                  {t('appDetails.phone')}:
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#fafafa' : '#111827' }}>
                  {environment.contact.phone}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Version & Build Info */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#000000',
              }}
            >
              {t('appDetails.version')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#a3a3a3' : '#6b7280' }}>
                {t('appDetails.version')}:
              </Typography>
              <Chip
                label={appVersion}
                size="small"
                sx={{
                  backgroundColor: isDarkMode ? '#404040' : '#e5e7eb',
                  color: isDarkMode ? '#fafafa' : '#111827',
                  fontWeight: 500,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#a3a3a3' : '#6b7280' }}>
                {t('appDetails.buildDate')}:
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#fafafa' : '#111827' }}>
                {buildDate}
              </Typography>
            </Box>
          </Box>

          {/* Environment Badge */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#000000',
              }}
            >
              {t('appDetails.environment')}
            </Typography>
            <Chip
              label={envLabel}
              size="small"
              sx={{
                backgroundColor: environment.env === 'prod' 
                  ? (isDarkMode ? '#1a472a' : '#d1fae5')
                  : environment.env === 'dev'
                  ? (isDarkMode ? '#422006' : '#fef3c7')
                  : (isDarkMode ? '#1e293b' : '#e0e7ff'),
                color: environment.env === 'prod'
                  ? (isDarkMode ? '#86efac' : '#065f46')
                  : environment.env === 'dev'
                  ? (isDarkMode ? '#fbbf24' : '#92400e')
                  : (isDarkMode ? '#93c5fd' : '#1e40af'),
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
          p: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
          }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

