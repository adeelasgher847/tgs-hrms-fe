import { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, Alert } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import employeeApi from '../../api/employeeApi';
import type { GenderPercentage } from '../../api/employeeApi';

type GenderDataItem = {
  name: 'Male' | 'Female';
  value: number;
  color: string;
  percentage: number;
};

// Translations
const labels = {
  genderDistribution: { en: 'Total Employees', ar: 'توزيع الجنس' },
  male: { en: 'Male', ar: 'ذكر' },
  female: { en: 'Female', ar: 'أنثى' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  error: { en: 'Error loading data', ar: 'خطأ في تحميل البيانات' },
};

// Custom Tooltip
const CustomTooltip = ({
  active,
  payload,
  language,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { color: string; percentage: number };
    name: string;
  }>;
  language: 'en' | 'ar';
}) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload.color;
    const translatedName =
      item.name === 'Male' ? labels.male[language] : labels.female[language];

    return (
      <Box
        sx={{
          backgroundColor: color,
          color: '#ffffff',
          p: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        {translatedName}: <b>{item.payload.percentage}</b>
      </Box>
    );
  }

  return null;
};

export default function GenderPercentageChart() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const [genderData, setGenderData] = useState<GenderDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log initial state
  console.log('GenderPercentageChart - Initial genderData state:', genderData);

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  useEffect(() => {
    const fetchGenderData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: GenderPercentage = await employeeApi.getGenderPercentage();
        console.log('GenderPercentageChart - API Response:', data);
        console.log('GenderPercentageChart - Male count:', data.male);
        console.log('GenderPercentageChart - Female count:', data.female);
        console.log('GenderPercentageChart - Total count:', data.total);

        const transformedData: GenderDataItem[] = [
          {
            name: 'Male',
            value: data.male,
            color: '#484c7f',
            percentage: data.male,
          },
          {
            name: 'Female',
            value: data.female,
            color: '#E91E63',
            percentage: data.female,
          },
        ];

        console.log(
          'GenderPercentageChart - Transformed Data:',
          transformedData
        );
        console.log('GenderPercentageChart - Setting gender data...');
        setGenderData(transformedData);
      } catch (err) {
        console.error('Error fetching gender percentage:', err);
        setError('Failed to load gender distribution data');
        // Don't set any fallback data - let the error state handle it
        setGenderData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenderData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          border: `1px solid ${borderColor}`,
          borderRadius: '0.375rem',
          backgroundColor: bgColor,
          direction: language === 'ar' ? 'rtl' : 'ltr',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress />
        <Typography ml={2} color={textColor}>
          {labels.loading[language]}
        </Typography>
      </Box>
    );
  }

  if (error) {
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
        <Typography fontWeight='bold' fontSize={16} mb={2} color={textColor}>
          {labels.genderDistribution[language]}
        </Typography>
        <Alert severity='error'>{labels.error[language]}</Alert>
      </Box>
    );
  }

  const totalEmployees = genderData.reduce((sum, item) => sum + item.value, 0);

  // Debug: Log the current state being rendered
  console.log('GenderPercentageChart - Current genderData state:', genderData);
  console.log(
    'GenderPercentageChart - Calculated totalEmployees:',
    totalEmployees
  );

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
          {labels.genderDistribution[language]}
        </Typography>
        <Typography fontWeight='bold' fontSize={'25px'} color={textColor}>
          {totalEmployees}
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
              data={genderData}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey='value'
            >
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip language={language} />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Gender labels */}
      <Stack direction='row' spacing={3} justifyContent='center' mt={2}>
        {genderData.map(item => (
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
              {item.name === 'Male'
                ? labels.male[language]
                : labels.female[language]}
              : <b>{item.percentage}</b>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
