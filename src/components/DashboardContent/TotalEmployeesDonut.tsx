import { Box, Typography, Stack } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

type GenderDataItem = {
  name: 'Man' | 'Woman';
  value: number;
  color: string;
};

const data: GenderDataItem[] = [
  { name: 'Man', value: 50, color: '#a7daff' },
  { name: 'Woman', value: 55, color: '#f5558d' },
];

// Translations
const labels = {
  totalEmployees: { en: 'Total Employees', ar: 'إجمالي الموظفين' },
  man: { en: 'Man', ar: 'رجل' },
  woman: { en: 'Woman', ar: 'امرأة' },
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload.color;
    const translatedName =
      item.name === 'Man' ? labels.man[language] : labels.woman[language];

    return (
      <Box
        sx={{
          backgroundColor: color,
          color: '#fff',
          p: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        {translatedName}: <b>{item.value}</b>
      </Box>
    );
  }

  return null;
};

export default function TotalEmployeesDonut() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Box display={'flex'} justifyContent={'space-between'}>
        <Typography fontWeight='bold' fontSize={16} mb={2} color={textColor}>
          {labels.totalEmployees[language]}
        </Typography>
        <Typography fontWeight='bold' fontSize={'25px'} color={textColor}>
          423
        </Typography>
      </Box>

      <Box
        tabIndex={-1}
        sx={{
          '& svg, & path': {
            outline: 'none',
            border: 'none',
          },
        }}
      >
        <ResponsiveContainer width='100%' height={220}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey='value'
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip language={language} />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Gender labels */}
      <Stack direction='row' spacing={3} justifyContent='center' mt={2}>
        {data.map(item => (
          <Stack
            key={item.name}
            direction='row'
            alignItems='center'
            spacing={1}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: item.color,
              }}
            />
            <Typography fontSize={14} color={textColor}>
              {item.name === 'Man'
                ? labels.man[language]
                : labels.woman[language]}
              : <b>{item.value}</b>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
