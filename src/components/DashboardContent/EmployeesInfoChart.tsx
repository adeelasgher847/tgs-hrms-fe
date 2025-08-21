import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
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
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import {
  getEmployeeJoiningReport,
  type EmployeeJoiningReport,
} from '../../api/employeeApi';

export default function EmployeesInfoChart() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        console.log('EmployeesInfoChart - API Response:', data);
        setJoiningData(data);

        // Set the most recent year as default selected year
        if (data.length > 0) {
          const years = [...new Set(data.map(item => item.year))].sort(
            (a, b) => b - a
          );
          setSelectedYear(years[0]); // Set most recent year as default
          console.log('EmployeesInfoChart - Available years:', years);
          console.log('EmployeesInfoChart - Default selected year:', years[0]);
        }
      } catch (err) {
        console.error('Error fetching employee joining report:', err);
        setError('Failed to load employee joining data');
        // Use fallback data if API fails - only August data
        setJoiningData([
          { month: 8, year: 2025, total: 8 }, // Only August data as fallback
        ]);
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

  console.log('EmployeesInfoChart - Available years:', availableYears);
  console.log('EmployeesInfoChart - Selected year:', selectedYear);
  console.log('EmployeesInfoChart - Filtered data:', filteredData);

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
    console.log(
      `EmployeesInfoChart - Mapping ${monthStr} (month ${monthIndex}):`,
      {
        apiData,
        hasApiData: !!apiData,
        value: apiData ? apiData.total : 0,
      }
    );

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
      }}
    >
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
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
              value={selectedYear || ''}
              onChange={e => setSelectedYear(Number(e.target.value))}
              label={language === 'ar' ? 'السنة' : 'Year'}
              sx={{
                color: textColor,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#464b8a',
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
          height={200}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={200}
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
