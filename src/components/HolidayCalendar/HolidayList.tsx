import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import HolidayTable from './HolidayTable';
import AddHolidayDialog from './AddHolidayDialog';
import HolidayCalendarView from './HolidayCalendarView';
import UpcomingHolidayList from './UpcomingHolidayList';

export interface Holiday {
  id: string;
  date: string;
  title: string;
  description: string;
}

const HolidayList: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([
    {
      id: '1',
      date: '2025-08-14',
      title: 'Independence Day',
      description: 'National holiday in Pakistan',
    },
    {
      id: '2',
      date: '2025-09-06',
      title: 'Defence Day',
      description: "Commemoration of Pakistan's armed forces",
    },
  ]);

  const [open, setOpen] = useState(false);

  const handleAddHoliday = (newHoliday: Holiday) => {
    setHolidays(prev => [...prev, newHoliday]);
    setOpen(false);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h5'>Holiday List</Typography>
        <Button variant='contained' onClick={() => setOpen(true)}>
          Add Holiday
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'start' },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
        }}
      >
        <Box width={{ xs: '100%', overflowX: 'auto' }}>
          <HolidayTable holidays={holidays} />
          <AddHolidayDialog
            open={open}
            onClose={() => setOpen(false)}
            onAdd={handleAddHoliday}
          />
        </Box>
        <Box>
          <HolidayCalendarView holidays={holidays} />
        </Box>
      </Box>
      <Box width={{ xs: '100%' }}>
        <UpcomingHolidayList holidays={holidays} />
      </Box>
    </Box>
  );
};

export default HolidayList;
