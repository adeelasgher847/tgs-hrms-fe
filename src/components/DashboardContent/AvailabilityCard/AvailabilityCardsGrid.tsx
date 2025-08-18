import { Box, Typography } from '@mui/material';
import AvailabilityCard from './AvailabilityCard';
import CheckedIcon from '../../../assets/dashboardIcon/checked.svg';
import stopwatchIcon from '../../../assets/dashboardIcon/stopwatch.svg';
import banIcon from '../../../assets/dashboardIcon/ban.svg';
import beachIcon from '../../../assets/dashboardIcon/beach-bed.svg';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

export default function AvailabilityCardsGrid() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  const labels = {
    en: 'Employees Availability',
    ar: 'توفر الموظفين',
  };

  const cardTitles: Record<string, { en: string; ar: string }> = {
    Attendance: { en: 'Attendance', ar: 'الحضور' },
    'Late Coming': { en: 'Late Coming', ar: 'التأخير' },
    Absent: { en: 'Absent', ar: 'غياب' },
    'Leave Apply': { en: 'Leave Apply', ar: 'طلب إجازة' },
  };

  const cards = [
    {
      title: cardTitles['Attendance'][language],
      value: 148,
      icon: (
        <img
          src={CheckedIcon}
          alt='Attendance'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
    {
      title: cardTitles['Late Coming'][language],
      value: 12,
      icon: (
        <img
          src={stopwatchIcon}
          alt='LateComing'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
    {
      title: cardTitles['Absent'][language],
      value: 5,
      icon: (
        <img
          src={banIcon}
          alt='Absent'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
    {
      title: cardTitles['Leave Apply'][language],
      value: 32,
      icon: (
        <img
          src={beachIcon}
          alt='LeaveApply'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        border: `1px solid  ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL support
      }}
      p={2}
    >
      <Typography fontWeight='bold' fontSize={16} mb={2} color={textColor}>
        {labels[language]}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: { xs: 'center', md: 'space-between' },
        }}
      >
        {cards.map(card => (
          <Box
            key={card.title}
            sx={{
              flex: { xs: '100%', sm: '33%' },
            }}
          >
            <AvailabilityCard {...card} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
