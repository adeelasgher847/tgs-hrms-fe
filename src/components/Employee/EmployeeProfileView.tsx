import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const EmployeeProfileView: React.FC = () => {
  const user = {
    id: 101,
    name: "Ali Raza",
    email: "ali.raza@example.com",
    designation: "Software Engineer",
    department: "Development",
    profileImage: "/images/ali.png",
    attendance: [
      { date: "2025-07-28", status: "Present" },
      { date: "2025-07-27", status: "Absent" },
      { date: "2025-07-26", status: "Present" },
    ],
    leaveSummary: {
      totalLeaves: 24,
      leavesTaken: 8,
      leavesRemaining: 16,
    },
  };

  return (
    <Box py={3}>
      {/* Profile Section */}
      <Card   sx={{ mb: 1,  borderRadius: 2,border: '1px solid #f0f0f0' ,backgroundcolor:' #fff ' ,boxShadow: 'none'}}>
        <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center">
            <Avatar src={user.profileImage} sx={{ width: 90, height: 90, mr: { sm: 2 }, mb: { xs: 2, sm: 0 } }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>{user.name}</Typography>
              <Typography variant="subtitle1" color="textSecondary">{user.designation}</Typography>
              <Typography variant="subtitle2" color="textSecondary">{user.department}</Typography>
              <Typography variant="body2" color="textSecondary">{user.email}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Logs */}
      <Card sx={{ mb: 1,  borderRadius: 2,  boxShadow: 'none' ,border: '1px solid #f0f0f0' ,backgroundcolor:' #fff ' ,}}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Recent Attendance</Typography>
          {user.attendance.slice(0, 5).map((log, index) => (
            <Box key={index} display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2">{log.date}</Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                color={log.status === 'Present' ? 'green' : 'red'}>
                {log.status}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Leave Summary */}
      <Card sx={{borderRadius: 2,  boxShadow: 'none',border: '1px solid #f0f0f0' ,backgroundcolor:' #fff ' , }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Leave Summary</Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="body2">Total Leaves: {user.leaveSummary.totalLeaves}</Typography>
            <Typography variant="body2">Leaves Taken: {user.leaveSummary.leavesTaken}</Typography>
            <Typography variant="body2">Leaves Remaining: {user.leaveSummary.leavesRemaining}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeProfileView;
