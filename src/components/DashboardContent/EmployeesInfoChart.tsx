import {
  Box,
  Typography,
  useMediaQuery,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
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
import { useLanguage } from '../../hooks/useLanguage';
import { useState, useEffect } from 'react';
import {
  getEmployeeJoiningReport,
  type EmployeeJoiningReport,
} from '../../api/employeeApi';

export default function EmployeesInfoChart() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningData, setJoiningData] = useState<EmployeeJoiningReport[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Fetch employee joining report data
  useEffect(() => {
    const fetchJoiningData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmployeeJoiningReport();

        setJoiningData(data);

        // Set the most recent year as default selected year
        if (data.length > 0) {
          const years = [...new Set(data.map(item => item.year))].sort(
            (a, b) => b - a
          );
          setSelectedYear(years[0]); // Set most recent year as default
        }
      } catch (err) {
        // If API fails (including 401), we want to show zero-values instead of an error block
        // but preserve logging for debugging.
        console.warn('EmployeesInfoChart fetch error:', err);
        setError(null);
        // Provide empty dataset for the current year (or current year fallback)
        const currentYear = new Date().getFullYear();
        setJoiningData(
          // 12 months with zero totals for a consistent chart appearance
          Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: currentYear, total: 0 }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJoiningData();
  }, []);

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

  // Get unique years from API data
  const availableYears = [...new Set(joiningData.map(item => item.year))].sort(
    (a, b) => b - a
  );

  // Filter data by selected year
  const filteredData = selectedYear
    ? joiningData.filter(item => item.year === selectedYear)
    : [];

  // Translations
  const chartTitle = {
    en: `Employees Info ${selectedYear ? `(${selectedYear})` : ''}`,
    ar: `معلومات الموظفين ${selectedYear ? `(${selectedYear})` : ''}`,
  };

  const months: Record<string, Record<string, string>> = {
    Jan: { en: 'Jan', ar: 'يناير' },
    Feb: { en: 'Feb', ar: 'فبراير' },
    Mar: { en: 'Mar', ar: 'مارس' },
    Apr: { en: 'Apr', ar: 'أبريل' },
    May: { en: 'May', ar: 'مايو' },
    Jun: { en: 'Jun', ar: 'يونيو' },
    Jul: { en: 'Jul', ar: 'يوليو' },
    Aug: { en: 'Aug', ar: 'أغسطس' },
    Sep: { en: 'Sep', ar: 'سبتمبر' },
    Oct: { en: 'Oct', ar: 'أكتوبر' },
    Nov: { en: 'Nov', ar: 'نوفمبر' },
    Dec: { en: 'Dec', ar: 'ديسمبر' },
  };

  // Process API data for chart - show only month names
  const originalDates = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug', // Added August to show backend data
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Map API data to original chart format
  const chartData = originalDates.map(monthStr => {
    const monthIndex =
      [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ].indexOf(monthStr) + 1;

    // Find corresponding API data for this month in the filtered data
    const apiData = filteredData.find(item => item.month === monthIndex);

    // Debug logging

    // Use API data if available, otherwise use zero (no mock data)
    const value = apiData ? apiData.total : 0;

    return {
      date: monthStr,
      value: value,
    };
  });

  // Translate data - show month names in selected language
  const translatedData = chartData.map(item => {
    return {
      date: months[item.date]?.[language] || item.date,
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
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        className='Ramish selected'
        display='flex'
        justifyContent='space-between'
        mb={2}
      >
        <Typography fontWeight='bold' color={textColor}>
          {chartTitle[language]}
        </Typography>

        {availableYears.length > 0 && (
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: textColor }}>
              {language === 'ar' ? 'السنة' : 'Year'}
            </InputLabel>
            <Select
              className='Ramish selected'
              value={selectedYear || ''}
              onChange={e => setSelectedYear(Number(e.target.value))}
              label={language === 'ar' ? 'السنة' : 'Year'}
              sx={{
                color: textColor,
                borderRadius: '5px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e8e8e8',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#464b8a',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#464b8a',
                },
              }}
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={220}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={220}
        >
          <Typography color='error' variant='body2'>
            {error}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            '& svg': {
              outline: 'none',
              border: 'none',
            },
            width: '100%',
            height: '200px',
            overflow: 'hidden',
          }}
        >
          <ResponsiveContainer width='100%' height={200}>
            <LineChart
              data={translatedData}
              margin={{ top: 10, right: 10, bottom: 10, left: -40 }}
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
                      transform={
                        isMobile ? `rotate(-45, ${x}, ${y})` : undefined
                      }
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
      )}
    </Box>
  );
}
