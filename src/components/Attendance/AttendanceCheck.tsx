import { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import attendanceApi from '../../api/attendanceApi';
import MyTimeCard from '../TimerTracker/MyTimeCard';
import AppButton from '../common/AppButton';
import EmployeeGeofenceStatus from '../Geofencing/EmployeeGeofenceStatus';
import {
  isAdmin,
  isSystemAdmin,
  isNetworkAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppPageTitle from '../common/AppPageTitle';

type AttendanceStatus = 'Not Checked In' | 'Checked In' | 'Checked Out';

const AttendanceCheck = () => {
  const [status, setStatus] = useState<AttendanceStatus>('Not Checked In');
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [userName, setUserName] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSystemAdminUser, setIsSystemAdminUser] = useState(false);
  const [isNetworkAdminUser, setIsNetworkAdminUser] = useState(false);
  const [isHRAdminUser, setIsHRAdminUser] = useState(false);
  const [attendanceRefreshToken, setAttendanceRefreshToken] = useState(0);
  const theme = useTheme();

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
    closeSnackbar();
    const userId = getCurrentUserId();
    if (!userId) {
      showError('User not found. Please log in again.');
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
      showError("Failed to fetch today's attendance summary.");
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

  const getRobustCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      // First attempt: High accuracy with increased timeout (20s) and allowed cache (5s)
      navigator.geolocation.getCurrentPosition(
        resolve,
        error => {
          // If high accuracy times out, try low accuracy as fallback
          if (error.code === error.TIMEOUT) {
            console.warn(
              'High accuracy location timed out, falling back to low accuracy...'
            );
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 30000, // 30s timeout for fallback
              maximumAge: 60000, // Accept up to 1 min old position for fallback
            });
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // 20s
          maximumAge: 5000, // 5s
        }
      );
    });

  const handleCheckIn = async () => {
    setLoading(true);
    closeSnackbar();

    // Request high-accuracy geolocation permission and position
    if (!('geolocation' in navigator)) {
      showError('Geolocation is not available on this device.');
      setLoading(false);
      return;
    }

    try {
      const pos = await getRobustCurrentPosition();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      await attendanceApi.createAttendance({
        type: 'CHECK_IN',
        latitude: lat,
        longitude: lon,
      });

      // Optimistically reflect UI: clear checkout and lock check-in
      setPunchOutTime(null);
      setStatus('Checked In');
      await fetchToday();
      // Inform MyTimeCard that attendance has changed so it can refresh immediately
      setAttendanceRefreshToken(prev => prev + 1);
    } catch (err: unknown) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    closeSnackbar();

    if (!('geolocation' in navigator)) {
      showError('Geolocation is not available on this device.');
      setLoading(false);
      return;
    }

    try {
      const pos = await getRobustCurrentPosition();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      await attendanceApi.createAttendance({
        type: 'CHECK_OUT',
        latitude: lat,
        longitude: lon,
      });

      // After checkout, both buttons become enabled again
      setStatus('Checked Out');
      await fetchToday();
      // Also notify MyTimeCard on checkout in case it needs to update state
      setAttendanceRefreshToken(prev => prev + 1);
    } catch (err: unknown) {
      showError(err);
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
          <AppPageTitle>Attendance Management</AppPageTitle>
          <Typography
            fontWeight={400}
            fontSize={{ xs: '16px', lg: '16px' }}
            lineHeight='24px'
            letterSpacing='-1%'
            color={theme.palette.text.secondary}
            sx={{ mt: 1 }}
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
          <AppButton
            variant='contained'
            variantType='primary'
            text='Check In'
            onClick={handleCheckIn}
            disabled={loading}
            startIcon={
              <LoginIcon
                sx={{ fontSize: { xs: 18, sm: 20 } }}
                aria-hidden='true'
              />
            }
            aria-label={loading ? 'Checking in...' : 'Check in for attendance'}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 120, md: 140 },
              height: { xs: 36, sm: 40 },
              fontSize: '1.1rem',
              fontWeight: 600,
              px: { xs: 1, sm: 2 },
              textTransform: 'none',
            }}
          />
        ) : (
          <AppButton
            variant='contained'
            variantType='primary'
            text='Check Out'
            onClick={handleCheckOut}
            disabled={loading}
            startIcon={
              <LogoutIcon
                sx={{ fontSize: { xs: 18, sm: 20 } }}
                aria-hidden='true'
              />
            }
            aria-label={
              loading ? 'Checking out...' : 'Check out from attendance'
            }
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 120, md: 140 },
              height: { xs: 36, sm: 40 },
              fontSize: '1.1rem',
              fontWeight: 600,
              px: { xs: 1, sm: 2 },
              textTransform: 'none',
            }}
          />
        )}
      </Box>

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
          <Typography
            fontWeight={500}
            fontSize={{ xs: '20px', lg: '28px' }}
            lineHeight='36px'
            letterSpacing='-2%'
            color={theme.palette.text.primary}
          >
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {userName}
          </Typography>
          <Typography
            fontWeight={500}
            fontSize='20px'
            lineHeight='28px'
            letterSpacing='-1%'
            color={theme.palette.text.secondary}
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
                  fontWeight={400}
                  fontSize={{ xs: '14px', lg: '14px' }}
                  lineHeight='20px'
                  letterSpacing='-1%'
                  color={theme.palette.text.secondary}
                >
                  Check In Time
                </Typography>
                <Typography
                  fontWeight={500}
                  fontSize={{ xs: '20px', lg: '20px' }}
                  lineHeight='28px'
                  letterSpacing='-1%'
                  color='success.main'
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
                  fontWeight={400}
                  fontSize={{ xs: '14px', lg: '14px' }}
                  lineHeight='20px'
                  letterSpacing='-1%'
                  color={theme.palette.text.secondary}
                >
                  Check Out Time
                </Typography>
                <Typography
                  fontWeight={500}
                  fontSize={{ xs: '20px', lg: '20px' }}
                  lineHeight='28px'
                  letterSpacing='-1%'
                  color='warning.main'
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

      <EmployeeGeofenceStatus />

      {/* Toast Notifications */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box >
  );
};

export default AttendanceCheck;
