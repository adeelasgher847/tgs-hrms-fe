import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, useMediaQuery, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Mock EmployeesInfoChart component for Storybook
const MockEmployeesInfoChart = ({ darkMode = false }: { darkMode?: boolean }) => {
  const language = 'en'; // Default to English for Storybook
  const isMobile = useMediaQuery('(max-width:600px)');
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);

  // Mock data for Storybook
  const mockData = [
    { date: 'Jan', value: 15 },
    { date: 'Feb', value: 22 },
    { date: 'Mar', value: 18 },
    { date: 'Apr', value: 25 },
    { date: 'May', value: 30 },
    { date: 'Jun', value: 28 },
    { date: 'Jul', value: 35 },
    { date: 'Aug', value: 32 },
    { date: 'Sep', value: 28 },
    { date: 'Oct', value: 40 },
    { date: 'Nov', value: 38 },
    { date: 'Dec', value: 45 },
  ];

  useEffect(() => {
    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

  const chartTitle = `Employees Info (${selectedYear})`;

  if (loading) {
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
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        display='flex'
        justifyContent='space-between'
        mb={2}
      >
        <Typography fontWeight='bold' color={textColor}>
          {chartTitle}
        </Typography>

        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: textColor }}>
            Year
          </InputLabel>
          <Select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            label="Year"
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
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2023}>2023</MenuItem>
            <MenuItem value={2022}>2022</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
            data={mockData}
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
    </Box>
  );
};

const meta: Meta<typeof MockEmployeesInfoChart> = {
  title: 'Charts/EmployeesInfoChart',
  component: MockEmployeesInfoChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MockEmployeesInfoChart>;

export const Default: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <MockEmployeesInfoChart />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Line chart showing employee joining information over months with year selection dropdown.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <MockEmployeesInfoChart darkMode={true} />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Employees info chart in dark mode.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <MockEmployeesInfoChart />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Employees info chart optimized for mobile view.',
      },
    },
  },
};
