import { Box, Typography, useTheme } from '@mui/material';
import type { AvailabilityCardProps } from '../../../types/availability';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';

export default function AvailabilityCard({
  title,
  value,
  icon,
}: AvailabilityCardProps) {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  // Title Translations
  const titleTranslations: Record<string, { en: string; ar: string }> = {
    'Available Employees': {
      en: 'Available Employees',
      ar: 'الموظفون المتاحون',
    },
    'On Leave': { en: 'On Leave', ar: 'في إجازة' },
    'Working Remotely': { en: 'Working Remotely', ar: 'يعمل عن بعد' },
    'In Office': { en: 'In Office', ar: 'في المكتب' },
    // Add more if needed
  };

  const translatedTitle = titleTranslations[title]
    ? titleTranslations[title][language]
    : title; // fallback if not found

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '0.375rem',
        padding: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 80,
        backgroundColor: theme.palette.background.paper,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Left side: Icon and Name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Icon container */}
        <Box
          sx={{
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'transparent'
                : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component='span'
            sx={{ color: theme.palette.text.primary, fontSize: 24 }}
          >
            {icon}
          </Box>
        </Box>

        {/* Title */}
        <Typography
          fontSize={14}
          fontWeight={600}
          sx={{ color: theme.palette.text.primary }}
        >
          {translatedTitle}
        </Typography>
      </Box>

      {/* Right side: Bold Number */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h4'
          fontSize={28}
          fontWeight='bold'
          sx={{
            color: theme.palette.text.primary,
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
