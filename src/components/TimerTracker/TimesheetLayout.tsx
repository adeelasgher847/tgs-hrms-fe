import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import SheetList from './SheetList';

const TimesheetLayout: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h1">
          My Timesheet
        </Typography>
      </Box>
      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
        <SheetList />
      </Paper>
    </Box>
  );
};

export default TimesheetLayout;
