import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
} from '@mui/material';
import LeaveSummaryChart from './LeaveSummaryChart';

const cardStyle = (theme: any) => ({
  width: { xs: '100%', sm: '250px' },
  flexShrink: 0,
  boxShadow: 'none',
  border: `1px solid ${theme.palette.card?.border || theme.palette.divider}`,
  borderRadius: '0.375rem',
  backgroundColor:
    theme.palette.card?.background || theme.palette.background.paper,
});

const Reports: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [teamSummary, setTeamSummary] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const direction = 'ltr'; // replace with theme.direction if available

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Fetch team leave summary
  const fetchTeamLeaveSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/reports/team-leave-summary');
      const data = await res.json();
      setTeamSummary(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/reports/leave-balance');
      const data = await res.json();
      setLeaveBalance(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const exportCSV = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  useEffect(() => {
    if (tab === 1) fetchTeamLeaveSummary();
  }, [tab]);

  const attendanceData = [
    { date: '01 Jan', month: 'January', userId: '1', checkIn: '09:00 AM', status: 'Present', hours: 8 },
    { date: '02 Jan', month: 'January', userId: '1', checkIn: '-', status: 'Absent', hours: 0 },
    { date: '01 Feb', month: 'February', userId: '2', checkIn: '09:30 AM', status: 'Present', hours: 7 },
  ];

  const filteredData = attendanceData.filter(
    item =>
      (selectedMonth ? item.month === selectedMonth : true) &&
      (selectedUser ? item.userId === selectedUser : true)
  );

  const departmentData = [
    { title: 'HR Department', count: 12 },
    { title: 'Designers', count: 8 },
    { title: 'Developers', count: 15 },
  ];

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant='scrollable'
        scrollButtons='auto'
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label='Attendance Summary' />
        <Tab label='Leave Summary' />
        <Tab label='Headcount Report' />
      </Tabs>

      {/* --- ATTENDANCE SUMMARY --- */}
      {tab === 0 && (
        <Box mt={4}>
          <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            <FormControl fullWidth size='small'>
              <InputLabel>{direction === 'rtl' ? 'شهر' : 'Month'}</InputLabel>
              <Select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              >
                <MenuItem value=''>{direction === 'rtl' ? 'تمام' : 'All'}</MenuItem>
                <MenuItem value='January'>January</MenuItem>
                <MenuItem value='February'>February</MenuItem>
                <MenuItem value='March'>March</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size='small'>
              <InputLabel>{direction === 'rtl' ? 'صارف' : 'User'}</InputLabel>
              <Select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
              >
                <MenuItem value=''>{direction === 'rtl' ? 'تمام' : 'All'}</MenuItem>
                <MenuItem value='1'>Ali</MenuItem>
                <MenuItem value='2'>Sara</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box mt={4} sx={theme => ({
            overflowX: 'auto',
            bgcolor: theme.palette.background.paper,
          })}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align='center'>No records found.</TableCell></TableRow>
                ) : (
                  filteredData.map((row, _index) => (
                    <TableRow key={_index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.checkIn}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.hours}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {/* --- LEAVE SUMMARY --- */}
      {tab === 1 && (
        <Box mt={4}>
          <Box mb={2} display='flex' gap={2} flexWrap='wrap'>
            <Button
              variant='contained'
              color='primary'
              onClick={fetchTeamLeaveSummary}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Refresh Summary'}
            </Button>
            <Button
              variant='outlined'
              onClick={() => fetchLeaveBalance()}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Show Leave Balance'}
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => exportCSV('/reports/leave-summary/export', 'yearly_leave_summary.csv')}
            >
              Export Yearly Summary
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => exportCSV('/reports/team-leave-summary/export', 'team_leave_summary.csv')}
            >
              Export Team Summary
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => exportCSV('/reports/leave-balance/export', 'leave_balance.csv')}
            >
              Export Leave Balance
            </Button>
          </Box>

          {/* Chart */}
          <LeaveSummaryChart />

          {/* Team Leave Summary Table */}
          {teamSummary.length > 0 && (
            <Box mt={4}>
              <Typography variant='h6' gutterBottom>Team Leave Summary</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Total Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.employeeName}</TableCell>
                      <TableCell>{item.leaveType}</TableCell>
                      <TableCell>{item.totalDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Leave Balance */}
          {leaveBalance.length > 0 && (
            <Box mt={4}>
              <Typography variant='h6' gutterBottom>Leave Balance</Typography>
              <Box display='flex' flexWrap='wrap' gap={2}>
                {leaveBalance.map((item, index) => (
                  <Card key={index} sx={cardStyle}>
                    <CardContent>
                      <Typography variant='subtitle1'>{item.type}</Typography>
                      <Typography variant='h4'>{item.remaining}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* --- HEADCOUNT REPORT --- */}
      {tab === 2 && (
        <Box mt={4}>
          <Typography variant='h6' mb={2}>
            {direction === 'rtl' ? 'ملازمین کی رپورٹ' : 'Headcount Report'}
          </Typography>
          <Box
            display='flex'
            flexWrap='wrap'
            gap={2}
            justifyContent={{ xs: 'start', md: 'flex-start' }}
          >
            {departmentData.map((dept, _index) => (
              <Card key={_index} sx={cardStyle}>
                <CardContent>
                  <Typography variant='subtitle1'>{dept.title}</Typography>
                  <Typography variant='h4'>{dept.count}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Reports;
