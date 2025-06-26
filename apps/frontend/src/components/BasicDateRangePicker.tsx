import * as React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface BasicDateRangePickerProps {
  value?: [Dayjs | null, Dayjs | null];
  onChange?: (value: [Dayjs | null, Dayjs | null]) => void;
  isDarkMode?: boolean;
  startLabel?: string;
  endLabel?: string;
}

export default function BasicDateRangePicker({
  value,
  onChange,
  isDarkMode = false,
  startLabel = 'Start Date & Time',
  endLabel = 'End Date & Time'
}: BasicDateRangePickerProps) {
  const [internalValue, setInternalValue] = React.useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Load from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('dateRangePicker');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const startDate = parsed.start ? dayjs(parsed.start) : null;
        const endDate = parsed.end ? dayjs(parsed.end) : null;
        setInternalValue([startDate, endDate]);
      } catch (error) {
        console.warn('Failed to load saved date range:', error);
      }
    }
  }, []);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value || internalValue;

  const handleChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    // console.log('Range changed:', newValue);
    
    // Check if this is a clear action (both values are null)
    const isClearing = !newValue[0] && !newValue[1];
    
    if (isClearing) {
      // Clear localStorage when clearing
      try {
        localStorage.removeItem('dateRangePicker');
        // console.log('Cleared localStorage');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    } else {
      // Save to localStorage when setting values
      try {
        localStorage.setItem('dateRangePicker', JSON.stringify({
          start: newValue[0]?.toISOString() || null,
          end: newValue[1]?.toISOString() || null,
          updated: new Date().toISOString()
        }));
      } catch (error) {
        console.warn('Failed to save date range:', error);
      }
    }

    // Update internal state if not controlled
    if (!value) {
      setInternalValue(newValue);
    }

    // Call parent onChange if provided
    if (onChange) {
      onChange(newValue);
    }
  };

  // Clear both date pickers
  const handleClear = () => {
    handleChange([null, null]);
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#000000',
      '& fieldset': {
        borderColor: isDarkMode ? '#555555' : '#d0d0d0',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#777777' : '#aaaaaa',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#10a37f',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#cccccc' : '#666666',
      '&.Mui-focused': {
        color: '#10a37f',
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ 
        width: '100%', 
        p: 2
      }}>
        <Stack spacing={3}>
          {/* Start Date Time Picker */}
          <DateTimePicker
            label={startLabel}
            value={currentValue[0]}
            onChange={(newValue) => handleChange([newValue, currentValue[1]])}
            ampm={false} // 24-hour format
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
            sx={{
              width: '100%',
              ...textFieldStyles,
            }}
          />
          
          {/* End Date Time Picker */}
          <DateTimePicker
            label={endLabel}
            value={currentValue[1]}
            onChange={(newValue) => handleChange([currentValue[0], newValue])}
            ampm={false} // 24-hour format
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
            sx={{
              width: '100%',
              ...textFieldStyles,
            }}
          />
        </Stack>

        {/* Display current selection */}
        {(currentValue[0] || currentValue[1]) && (
          <Box 
            sx={{ 
              marginTop:2,
              p: 2, 
              borderRadius: 2, 
              backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa',
              border: `1px solid ${isDarkMode ? '#333333' : '#e9ecef'}`
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: isDarkMode ? '#ffffff' : '#333333',
                mb: 1.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📅 Selected Date & Time Range
            </Typography>
            
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isDarkMode ? '#cccccc' : '#666666',
                    fontFamily: 'monospace',
                    fontWeight: 500
                  }}
                >
                  <strong>Start:</strong>
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: currentValue[0] ? '#10a37f' : (isDarkMode ? '#888888' : '#999999'),
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                >
                  {currentValue[0] ? currentValue[0].format('DD/MM/YYYY HH:mm') : 'Not selected'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isDarkMode ? '#cccccc' : '#666666',
                    fontFamily: 'monospace',
                    fontWeight: 500
                  }}
                >
                  <strong>End:</strong>
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: currentValue[1] ? '#10a37f' : (isDarkMode ? '#888888' : '#999999'),
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                >
                  {currentValue[1] ? currentValue[1].format('DD/MM/YYYY HH:mm') : 'Not selected'}
                </Typography>
              </Box>

              {currentValue[0] && currentValue[1] && (
                <Box 
                  sx={{ 
                    mt: 1, 
                    pt: 1, 
                    borderTop: `1px solid ${isDarkMode ? '#333333' : '#e9ecef'}`,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isDarkMode ? '#cccccc' : '#666666',
                      fontFamily: 'monospace',
                      fontWeight: 500
                    }}
                  >
                    <strong>Duration:</strong>
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#10a37f',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {currentValue[1].diff(currentValue[0], 'hours')}h {currentValue[1].diff(currentValue[0], 'minutes') % 60}m
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
} 