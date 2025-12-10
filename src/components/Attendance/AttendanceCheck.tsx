import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import attendanceApi from '../../api/attendanceApi';
import MyTimeCard from '../TimerTracker/MyTimeCard';
import {
  isAdmin,
  isSystemAdmin,
  isNetworkAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';

type AttendanceStatus = 'Not Checked In' | 'Checked In' | 'Checked Out';

const AttendanceCheck = () => {
  const [status, setStatus] = useState<AttendanceStatus>('Not Checked In');
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSystemAdminUser, setIsSystemAdminUser] = useState(false);
  const [isNetworkAdminUser, setIsNetworkAdminUser] = useState(false);
  const [isHRAdminUser, setIsHRAdminUser] = useState(false);
  const [attendanceRefreshToken, setAttendanceRefreshToken] = useState(0);

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      setUserName(user.first_name || 'User');
      setIsAdminUser(isAdmin(user.role));
      setIsSystemAdminUser(isSystemAdmin(user.role));
      setIsNetworkAdminUser(isNetworkAdmin(user.role));
      setIsHRAdminUser(isHRAdmin(user.role));
      return user.id;
    } catch {
      return null;
    }
  };

  const fetchToday = async () => {
    setError(null);
    const userId = getCurrentUserId();
    if (!userId) {
      setError('User not found. Please log in again.');
      return;
    }
    try {
      const today = await attendanceApi.getTodaySummary(userId);
      if (today) {
        const checkInISO = today.checkIn ? new Date(today.checkIn) : null;
        const checkOutISO = today.checkOut ? new Date(today.checkOut) : null;
        const checkIn = checkInISO ? checkInISO.toLocaleTimeString() : null;
        const checkOut =
          checkInISO && checkOutISO && checkOutISO > checkInISO
            ? checkOutISO.toLocaleTimeString()
            : null;
        setPunchInTime(checkIn);
        setPunchOutTime(checkOut);
        if (checkIn && !checkOut) setStatus('Checked In');
        else if (checkOut) setStatus('Checked Out');
        else setStatus('Not Checked In');
      } else {
        setPunchInTime(null);
        setPunchOutTime(null);
        setStatus('Not Checked In');
      }
    } catch {
      setError("Failed to fetch today's attendance summary.");
    }
  };

  useEffect(() => {
    fetchToday();
    const timer = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await attendanceApi.createAttendance('check-in');
      // Optimistically reflect UI: clear checkout and lock check-in
      setPunchOutTime(null);
      setStatus('Checked In');
      await fetchToday();
      // Inform MyTimeCard that attendance has changed so it can refresh immediately
      setAttendanceRefreshToken(prev => prev + 1);
    } catch {
      setError('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await attendanceApi.createAttendance('check-out');
      // After checkout, both buttons become enabled again
      setStatus('Checked Out');
      await fetchToday();
      // Also notify MyTimeCard on checkout in case it needs to update state
      setAttendanceRefreshToken(prev => prev + 1);
    } catch {
      setError('Check-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header with Check In/Out Button */}
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
        sx={{
          backgroundColor: 'background.paper',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Box>
          <Typography
            variant='h5'
            fontWeight='bold'
            color='var(--dark-color)'
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
          >
            Attendance Management
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {isAdminUser ||
            isSystemAdminUser ||
            isNetworkAdminUser ||
            isHRAdminUser
              ? 'Admin - Track your daily attendance'
              : 'Track your daily attendance'}
          </Typography>
        </Box>

        {/* Single Check In / Check Out Button */}
        {status === 'Not Checked In' || status === 'Checked Out' ? (
          <Button
            variant='contained'
            color='success'
            onClick={handleCheckIn}
            sx={{
              minWidth: { xs: 100, sm: 120, md: 140 },
              height: { xs: 36, sm: 40 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600,
              borderRadius: 1,
              px: { xs: 1, sm: 2 },
            }}
            disabled={loading}
            startIcon={<LoginIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          >
            Check In
          </Button>
        ) : (
          <Button
            variant='contained'
            color='warning'
            onClick={handleCheckOut}
            sx={{
              minWidth: { xs: 100, sm: 120, md: 140 },
              height: { xs: 36, sm: 40 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600,
              borderRadius: 1,
              px: { xs: 1, sm: 2 },
            }}
            disabled={loading}
            startIcon={<LogoutIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          >
            Check Out
          </Button>
        )}
      </Box>

      {error && (
        <Alert
          severity='error'
          sx={{
            mb: 3,
            borderRadius: 1,
          }}
        >
          {error}
        </Alert>
      )}

      <Box display='flex' flexDirection={{ xs: 'column', lg: 'row' }} gap={2}>
        {/* Attendance Status Card */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 1,
            flex: 1,
            height: 'fit-content',
            boxShadow: 'unset',
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {userName}
          </Typography>
          <Typography
            variant='h4'
            color='var(--dark-color)'
            fontSize='20px'
            fontWeight='bold'
            mb={3}
            sx={{ fontFamily: 'monospace' }}
          >
            {currentTime}
          </Typography>

          <Box
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <Box
              display='flex'
              alignItems='center'
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1,
                flex: 1,
              }}
            >
              <LoginIcon
                sx={{
                  color: 'success.main',
                  mr: { xs: 1, sm: 2 },
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Check In Time
                </Typography>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color='success.main'
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  {punchInTime || '--:--'}
                </Typography>
              </Box>
            </Box>

            <Box
              display='flex'
              alignItems='center'
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1,
                flex: 1,
              }}
            >
              <LogoutIcon
                sx={{
                  color: 'warning.main',
                  mr: { xs: 1, sm: 2 },
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Check Out Time
                </Typography>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color='warning.main'
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  {punchOutTime || '--:--'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Time Card */}
        <Box flex={1}>
          <MyTimeCard attendanceRefreshToken={attendanceRefreshToken} />
        </Box>
      </Box>
    </Box>
  );
};

export default AttendanceCheck;
