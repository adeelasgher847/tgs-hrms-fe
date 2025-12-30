import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../common/AppButton';
import { Icons } from '../../../assets/icons';
import {
  getAttendanceThisMonth,
  getLeavesThisMonth,
} from '../../../api/employeeApi';

export default function AvailabilityCardsGrid() {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  // darkMode is reserved for future use
  void darkMode;
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<number>(0);
  const [leavesData, setLeavesData] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleLoginClick = () => {
    navigate('/login');
  };

  // Fetch attendance and leaves data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both APIs in parallel
      const [attendanceResponse, leavesResponse] = await Promise.all([
        getAttendanceThisMonth(),
        getLeavesThisMonth(),
      ]);

      // Validate structure before accessing properties
      if (
        attendanceResponse &&
        typeof attendanceResponse.totalAttendance === 'number'
      ) {
        setAttendanceData(attendanceResponse.totalAttendance);
      } else if (
        attendanceResponse &&
        attendanceResponse.data &&
        typeof attendanceResponse.data.total_attendance === 'number'
      ) {
        setAttendanceData(attendanceResponse.data.total_attendance);
      } else {
        setAttendanceData(0);
      }

      if (leavesResponse && typeof leavesResponse.totalLeaves === 'number') {
        setLeavesData(leavesResponse.totalLeaves);
      } else if (
        leavesResponse &&
        leavesResponse.data &&
        typeof leavesResponse.data.total_leaves === 'number'
      ) {
        setLeavesData(leavesResponse.data.total_leaves);
      } else {
        setLeavesData(0);
      }
    } catch (err: unknown) {
      // If authentication is required, show message and leave zeros
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'status' in err.response &&
        err.response.status === 401
      ) {
        setError('Authentication required to view real data. Please login.');
        setAttendanceData(0);
        setLeavesData(0);
      } else {
        // For other errors or empty tenants, show zero data instead of an error block.
        setError(null);
        setAttendanceData(0);
        setLeavesData(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const labels = {
    en: 'Employees Availability',
    ar: 'توفر الموظفين',
  };

  const attendanceLabel = {
    en: 'Attendance',
    ar: 'الحضور',
  };

  const leavesLabel = {
    en: 'Leaves Applied',
    ar: 'الإجازات المطبقة',
  };

  return (
    <Box
      sx={{
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL support
        height: '100%', // Match the height of GenderPercentageChart
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          fontWeight={500}
          fontSize={{ xs: '20px', lg: '28px' }}
          lineHeight={{ xs: '28px', lg: '36px' }}
          letterSpacing='-2%'
          sx={{ color: theme.palette.text.primary }}
        >
          {labels[language]}
          {!error && attendanceData > 0 && (
            <Typography
              component='span'
              variant='caption'
              sx={{
                ml: 1,
                color: 'success.main',
                fontSize: '0.75rem',
              }}
            ></Typography>
          )}
          {error && (
            <Typography
              component='span'
              variant='caption'
              sx={{
                ml: 1,
                color: 'error.main',
                fontSize: '0.75rem',
              }}
            >
              (
              {language === 'ar'
                ? 'يتطلب تسجيل الدخول'
                : 'Authentication Required'}
              )
            </Typography>
          )}
        </Typography>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={100}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display='flex'
          flexDirection='column'
          justifyContent='center'
          alignItems='center'
          height={100}
          gap={2}
        >
          <Typography color='error' variant='body2' textAlign='center'>
            {error}
          </Typography>
          {error ===
            'Authentication required to view real data. Please login.' && (
            <AppButton
              variant='contained'
              text={language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              onClick={handleLoginClick}
              size='small'
            />
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Attendance Item */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                component='img'
                src={Icons.attendance}
                alt='Attendance'
                sx={{
                  width: 24,
                  height: 24,
                  filter:
                    theme.palette.mode === 'dark'
                      ? 'brightness(0) saturate(100%) invert(56%)'
                      : 'brightness(0) saturate(100%)',
                }}
              />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: theme.palette.text.primary,
                }}
              >
                {attendanceLabel[language]}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              {attendanceData}
            </Typography>
          </Box>

          {/* Divider */}
          <Divider
            sx={{
              borderColor: theme.palette.divider,
              my: 0,
            }}
          />

          {/* Leaves Applied Item */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                component='img'
                src={Icons.leaveAnalytics}
                alt='Leaves Applied'
                sx={{
                  width: 24,
                  height: 24,
                  filter:
                    theme.palette.mode === 'dark'
                      ? 'brightness(0) saturate(100%) invert(56%)'
                      : 'brightness(0) saturate(100%)',
                }}
              />
              <Typography
                sx={{
                  fontSize: 'var(--body-font-size)',
                  fontWeight: 400,
                  color: theme.palette.text.primary,
                }}
              >
                {leavesLabel[language]}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              {leavesData}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
