import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

const rawData = [
  { date: '01 Jan', value: 30 },
  { date: '01 Feb', value: 50 },
  { date: '22 Feb', value: 70 },
  { date: '15 Mar', value: 55 },
  { date: '06 Apr', value: 85 },
  { date: '27 Apr', value: 65 },
  { date: '18 May', value: 70 },
  { date: '08 Jun', value: 50 },
  { date: '29 Jun', value: 60 },
  { date: '21 Jul', value: 65 },
];

export default function EmployeesInfoChart() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

  // Translations
  const chartTitle = {
    en: 'Employees Info',
    ar: 'معلومات الموظفين',
  };

  const months: Record<string, Record<string, string>> = {
    Jan: { en: 'Jan', ar: 'يناير' },
    Feb: { en: 'Feb', ar: 'فبراير' },
    Mar: { en: 'Mar', ar: 'مارس' },
    Apr: { en: 'Apr', ar: 'أبريل' },
    May: { en: 'May', ar: 'مايو' },
    Jun: { en: 'Jun', ar: 'يونيو' },
    Jul: { en: 'Jul', ar: 'يوليو' },
  };

  // Translate data
  const translatedData = rawData.map(item => {
    const [day, month] = item.date.split(' ');
    return {
      date: `${day} ${months[month][language] || month}`,
      value: item.value,
    };
  });

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
      <Typography fontWeight='bold' mb={2} color={textColor}>
        {chartTitle[language]}
      </Typography>

      <Box
        sx={{
          '& svg': {
            outline: 'none',
            border: 'none',
          },
        }}
      >
        <ResponsiveContainer width='100%' height={170}>
          <LineChart
            data={translatedData}
            margin={{ top: 0, right: 20, bottom: 20, left: -40 }}
          >
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis
              dataKey='date'
              tick={props => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={16}
                    fontSize={12}
                    transform={isMobile ? `rotate(-45, ${x}, ${y})` : undefined}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    fill={textColor}
                  >
                    {payload.value}
                  </text>
                );
              }}
              height={isMobile ? 50 : 30}
              interval={0}
              axisLine={{ stroke: '#f0f0f0' }}
              tickLine={{ stroke: '#f0f0f0' }}
            />

            <YAxis
              stroke='#f0f0f0'
              axisLine={{ stroke: '#f0f0f0' }}
              tickLine={false}
              tick={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                border: '1px solid #ccc',
                borderRadius: '6px',
                color: darkMode ? '#fff' : '#000',
                fontSize: '14px',
              }}
              labelStyle={{
                color: darkMode ? '#ccc' : '#333',
                fontWeight: 600,
              }}
            />

            <Line
              type='monotone'
              dataKey='value'
              stroke='#f5558d'
              strokeWidth={3}
              dot={{ r: 3, fill: '#ffc107' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
