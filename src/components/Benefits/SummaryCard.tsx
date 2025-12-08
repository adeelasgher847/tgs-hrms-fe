import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import { useOutletContext } from 'react-router-dom';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const SummaryCard = ({ title, value, icon }: SummaryCardProps) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const theme = useTheme();

  const bgColor = darkMode ? theme.palette.background.paper : '#fff';
  const textColor = darkMode ? '#ccc' : '#111';

  const titleTranslations: Record<string, { en: string; ar: string }> = {
    'Total Active Benefits': {
      en: 'Total Active Benefits',
      ar: 'إجمالي المزايا النشطة',
    },
    'Most Common Benefit Type': {
      en: 'Most Common Benefit Type',
      ar: 'النوع الأكثر شيوعاً',
    },
    'Total Employees Covered': {
      en: 'Total Employees Covered',
      ar: 'إجمالي الموظفين المشمولين',
    },
  };

  const translatedTitle = titleTranslations[title]
    ? titleTranslations[title][language]
    : title;

  return (
    <Box
      sx={{
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 120,
        bgcolor: bgColor,
        color: textColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkMode ? '#222' : '#f5f5f5',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant='subtitle1'
          fontWeight={600}
          sx={{ color: textColor, opacity: 0.9 }}
        >
          {translatedTitle}
        </Typography>
      </Box>

      <Typography
        sx={{
          mt: 2,
          fontWeight: 600,
          fontFamily: 'Poppins, monospace',
          color: textColor,
          textAlign: language === 'ar' ? 'left' : 'right',
          lineHeight: 1.3,
          fontSize: { xs: '1rem', md: '1.3rem' },
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default SummaryCard;
