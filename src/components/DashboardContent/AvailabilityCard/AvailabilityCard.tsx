import { Box, Typography } from '@mui/material';
import type { AvailabilityCardProps } from '../../../types/availability';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

export default function AvailabilityCard({
  title,
  value,
  icon,
}: AvailabilityCardProps) {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

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
        border: '1px solid',
        borderColor: borderColor,
        borderRadius: '0.375rem',
        padding: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 80,
        backgroundColor: bgColor,
        color: textColor,
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
            backgroundColor: darkMode ? 'unset' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box component='span' color={textColor} sx={{ fontSize: 24 }}>
            {icon}
          </Box>
        </Box>

        {/* Title */}
        <Typography fontSize={14} fontWeight={600} color={textColor}>
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
          color={textColor}
          sx={{
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
