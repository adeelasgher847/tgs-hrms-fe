import React from 'react';
import { Box, Typography } from '@mui/material';
import SheetList from './SheetList';

const TimesheetLayout: React.FC = () => {
  return (
    <Box p={2}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h5' component='h1'>
          My Timesheet
        </Typography>
      </Box>
      <SheetList />
    </Box>
  );
};

export default TimesheetLayout;
