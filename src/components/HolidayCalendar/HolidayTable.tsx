import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  useTheme,
} from '@mui/material';
import type { Holiday } from './HolidayList';

interface HolidayTableProps {
  holidays: Holiday[];
}

const HolidayTable: React.FC<HolidayTableProps> = ({ holidays }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ bgcolor: theme.palette.background.paper }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {holidays.map(holiday => (
            <TableRow key={holiday.id}>
              <TableCell>{holiday.date}</TableCell>
              <TableCell>{holiday.title}</TableCell>
              <TableCell>{holiday.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default HolidayTable;
