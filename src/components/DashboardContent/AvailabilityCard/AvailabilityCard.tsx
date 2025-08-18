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
        flexDirection: 'column',
        gap: 1,
        minHeight: 80,
        backgroundColor: bgColor,
        color: textColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          backgroundColor: darkMode ? 'unset' : 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: 48,
          height: 35,
        }}
      >
        <Box component='span' color={textColor} sx={{ fontSize: 28 }}>
          {icon}
        </Box>
      </Box>

      {/* Text content */}
      <Box>
        <Typography fontSize={14} fontWeight={700}>
          {translatedTitle}
        </Typography>
        <Typography variant='h6' fontSize={16} color='#9a9b9d'>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
