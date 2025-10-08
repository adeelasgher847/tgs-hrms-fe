import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
} from '@mui/material';
import { useIsDarkMode } from '../../theme';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: darkMode ? '#fff' : '#000',
            mb: 1,
          }}
        >
          Settings
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: darkMode ? '#8f8f8f' : '#666',
          }}
        >
          Manage your application settings and preferences
        </Typography>
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          color: darkMode ? '#fff' : '#000',
          borderRadius: 1,
          boxShadow: 'none',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            color: darkMode ? '#fff' : '#000',
            fontWeight: 500,
          }}
        >
          Settings Page
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: darkMode ? '#8f8f8f' : '#666',
            lineHeight: 1.6,
          }}
        >
          This is a placeholder for the settings page. You can add various settings options here such as:
        </Typography>

        <Box component="ul" sx={{ mt: 2, pl: 3 }}>
          <Typography
            component="li"
            variant="body2"
            sx={{
              color: darkMode ? '#8f8f8f' : '#666',
              mb: 1,
            }}
          >
            Account preferences
          </Typography>
          <Typography
            component="li"
            variant="body2"
            sx={{
              color: darkMode ? '#8f8f8f' : '#666',
              mb: 1,
            }}
          >
            Notification settings
          </Typography>
          <Typography
            component="li"
            variant="body2"
            sx={{
              color: darkMode ? '#8f8f8f' : '#666',
              mb: 1,
            }}
          >
            Privacy settings
          </Typography>
          <Typography
            component="li"
            variant="body2"
            sx={{
              color: darkMode ? '#8f8f8f' : '#666',
              mb: 1,
            }}
          >
            Theme preferences
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
