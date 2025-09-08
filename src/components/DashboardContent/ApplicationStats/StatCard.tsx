import React from 'react';
import { Box, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';

interface StatCardProps {
  iconLeft: React.ReactNode;
  iconRight: React.ReactNode;
  count: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({
  iconLeft,
  iconRight,
  count,
  label,
}) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  // Label Translations
  const labelTranslations: Record<string, { en: string; ar: string }> = {
    'Total Employees': { en: 'Total Employees', ar: 'إجمالي الموظفين' },
    'New Hires': { en: 'New Hires', ar: 'الموظفون الجدد' },
    'Active Users': { en: 'Active Users', ar: 'المستخدمون النشطون' },
    'Interviews Scheduled': {
      en: 'Interviews Scheduled',
      ar: 'المقابلات المجدولة',
    },
    'Leaves Approved': { en: 'Leaves Approved', ar: 'الإجازات المعتمدة' },
    Interviews: { en: 'Interviews', ar: 'المقابلات' },
    Hired: { en: 'Hired', ar: 'تم التوظيف' },
  };

  const translatedLabel = labelTranslations[label]
    ? labelTranslations[label][language]
    : label; // fallback if label not found

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL/LTR Support
      }}
    >
      {/* Left Icon + Text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            bgcolor: '#a0d9b4',
            p: 1.5,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
          }}
        >
          {iconLeft}
        </Box>

        <Box>
          <Typography
            variant='h6'
            fontWeight={600}
            lineHeight={1.2}
            color={textColor}
          >
            {count}
          </Typography>
          <Typography variant='body2' color={textColor}>
            {translatedLabel}
          </Typography>
        </Box>
      </Box>

      {/* Right Icon */}
      <Box>{iconRight}</Box>
    </Box>
  );
};

export default StatCard;
