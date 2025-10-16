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
  const borderColor = darkMode ? '#333' : '#e0e0e0';

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
        border: '1px solid',
        borderColor,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 90,
        bgcolor: bgColor,
        color: textColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkMode ? '#222' : '#f5f5f5',
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={14} fontWeight={600}>
          {translatedTitle}
        </Typography>
      </Box>

      <Typography
        variant='h5'
        fontWeight='bold'
        sx={{
          fontFamily: 'monospace',
          color: textColor,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default SummaryCard;
