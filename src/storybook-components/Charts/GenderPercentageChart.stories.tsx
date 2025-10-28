import type { Meta, StoryObj } from '@storybook/react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { Typography, Stack, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Mock GenderPercentageChart component for Storybook
const MockGenderPercentageChart = ({ darkMode = false }: { darkMode?: boolean }) => {
  const language = 'en'; // Default to English for Storybook
  const [genderData, setGenderData] = useState([
    { name: 'Male', value: 45, color: '#484c7f', percentage: 45 },
    { name: 'Female', value: 55, color: '#E91E63', percentage: 55 },
  ]);
  const [loading, setLoading] = useState(false);

  // Mock data for Storybook
  useEffect(() => {
    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const labels = {
    genderDistribution: { en: 'Total Active Employees', ar: 'توزيع الجنس' },
    male: { en: 'Male', ar: 'ذكر' },
    female: { en: 'Female', ar: 'أنثى' },
    loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: { color: string; percentage: number };
      name: string;
    }>;
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

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

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

  const totalEmployees = genderData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${borderColor}`,
        height: '100%',
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
              {genderData.map((entry, _index) => (
                <Cell key={`cell-${_index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
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
};

const meta: Meta<typeof MockGenderPercentageChart> = {
  title: 'Charts/GenderPercentageChart',
  component: MockGenderPercentageChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MockGenderPercentageChart>;

export const Default: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <MockGenderPercentageChart />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pie chart showing gender distribution of employees with total count.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <MockGenderPercentageChart darkMode={true} />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gender percentage chart in dark mode.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 350 }}>
      <MockGenderPercentageChart />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gender percentage chart optimized for mobile view.',
      },
    },
  },
};
