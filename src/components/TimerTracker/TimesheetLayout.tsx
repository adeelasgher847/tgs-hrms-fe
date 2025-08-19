import React from 'react';
import { Box, Paper } from '@mui/material';
import SheetList from './SheetList';

const TimesheetLayout: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2} p={2}>
      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
        <SheetList />
      </Paper>
    </Box>
  );
};

export default TimesheetLayout;
