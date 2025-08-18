import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import type { Holiday } from '../../type/Holiday';

interface UpcomingHolidayListProps {
  holidays: Holiday[];
}

const UpcomingHolidayList: React.FC<UpcomingHolidayListProps> = ({
  holidays,
}) => {
  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant='h6' gutterBottom>
        Upcoming Holidays
      </Typography>
      <List dense>
        {holidays.map(holiday => (
          <ListItem key={holiday.id}>
            <ListItemText
              primary={holiday.title}
              secondary={`${holiday.date} - ${holiday.description}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UpcomingHolidayList;
