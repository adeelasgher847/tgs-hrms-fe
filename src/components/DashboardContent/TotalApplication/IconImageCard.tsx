import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

type IconImageCardProps = {
  icon: React.ReactNode;
  imageSrc: string;
  label: string | number;
  title: string;
};

const IconImageCard: React.FC<IconImageCardProps> = ({
  icon,
  imageSrc,
  label,
  title,
}) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#484c7f' : '#484c7f';
  const textColor = '#fff';

  // Title translations with language context
  const titleTranslations: Record<string, { en: string; ar: string }> = {
    'New Employees': { en: 'New Employees', ar: 'الموظفون الجدد' },
    'Total Applicants': { en: 'Total Applicants', ar: 'إجمالي المتقدمين' },
    Interviews: { en: 'Interviews', ar: 'المقابلات' },
    Hired: { en: 'Hired', ar: 'تم التوظيف' },
    Pending: { en: 'Pending', ar: 'قيد الانتظار' },
    Rejected: { en: 'Rejected', ar: 'مرفوض' },
    Applications: { en: 'Applications', ar: 'التطبيقات' },
    // Add more titles as needed
  };

  // Translate title based on context
  const translatedTitle = titleTranslations[title]
    ? titleTranslations[title][language]
    : title;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: bgColor,
        p: 2,
        borderRadius: '0.375rem',
        minHeight: 120,
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL/LTR
      }}
    >
      {/* Left Side */}
      <Box>
        <Avatar
          src={imageSrc}
          alt={title}
          sx={{
            width: 22,
            height: 22,
            backgroundColor: '#fff',
            p: 2,
          }}
        />
        <Typography
          fontWeight={700}
          fontSize={40}
          color={textColor}
          mt={3}
          lineHeight={1}
        >
          {label}
        </Typography>
        <Typography fontSize={14} color={textColor}>
          {translatedTitle}
        </Typography>
      </Box>

      {/* Right Icon */}
      <Box
        sx={{
          borderRadius: '50%',
          fontSize: 28,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    </Box>
  );
};

export default IconImageCard;
