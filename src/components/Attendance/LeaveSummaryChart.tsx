import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type SelectChangeEvent = React.ChangeEvent<{ value: unknown }>;

const mockData: Record<string, { name: string; value: number }[]> = {
  Ali: [
    { name: 'Sick Leave', value: 4 },
    { name: 'Casual Leave', value: 2 },
    { name: 'Annual Leave', value: 3 },
  ],
  Sara: [
    { name: 'Sick Leave', value: 1 },
    { name: 'Casual Leave', value: 3 },
    { name: 'Annual Leave', value: 5 },
  ],
  HR: [
    { name: 'Sick Leave', value: 6 },
    { name: 'Casual Leave', value: 4 },
    { name: 'Annual Leave', value: 2 },
  ],
  IT: [
    { name: 'Sick Leave', value: 3 },
    { name: 'Casual Leave', value: 1 },
    { name: 'Annual Leave', value: 6 },
  ],
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const LeaveSummaryChart: React.FC = () => {
  const [selected, setSelected] = useState('Ali');
  const { language } = useLanguage();

  const leaveLabels = {
    en: {
      selectLabel: 'User / Department',
      pageTitlePrefix: 'Leave Summary –',
      hr: 'HR Department',
      it: 'IT Department',
    },
    ar: {
      selectLabel: 'المستخدم / القسم',
      pageTitlePrefix: 'ملخص الإجازات –',
      hr: 'قسم الموارد البشرية',
      it: 'قسم تكنولوجيا المعلومات',
    },
  } as const;

  const handleChange = (event: SelectChangeEvent) =>
    setSelected(event.target.value as string);

  const chartData = mockData[selected] || [];

  return (
    <Box mt={4}>
      <Box width={{ xs: '100%', sm: '50%' }} mb={3}>
        <FormControl fullWidth size='small'>
          <InputLabel id='select-label' sx={{ top: '-6px' }}>
            {leaveLabels[language].selectLabel}
          </InputLabel>
          <Select
            labelId='select-label'
            value={selected}
            onChange={handleChange}
          >
            <MenuItem value='Ali'>Ali</MenuItem>
            <MenuItem value='Sara'>Sara</MenuItem>
            <MenuItem value='HR'>{leaveLabels[language].hr}</MenuItem>
            <MenuItem value='IT'>{leaveLabels[language].it}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant='h6' gutterBottom>
        {leaveLabels[language].pageTitlePrefix} {selected}
      </Typography>

      <Box height={300}>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              outerRadius={80}
              dataKey='value'
              label
            >
              {chartData.map((_entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default LeaveSummaryChart;
