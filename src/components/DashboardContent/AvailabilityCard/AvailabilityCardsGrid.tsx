import { Box, Typography, CircularProgress, Button } from '@mui/material';
import AvailabilityCard from './AvailabilityCard';
import CheckedIcon from '../../../assets/dashboardIcon/checked.svg';
import beachIcon from '../../../assets/dashboardIcon/beach-bed.svg';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAttendanceThisMonth,
  getLeavesThisMonth,
} from '../../../api/employeeApi';

export default function AvailabilityCardsGrid() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<number>(0);
  const [leavesData, setLeavesData] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

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

  const cardTitles: Record<string, { en: string; ar: string }> = {
    Attendance: { en: 'Attendance', ar: 'الحضور' },
    'Late Coming': { en: 'Late Coming', ar: 'التأخير' },
    Absent: { en: 'Absent', ar: 'غياب' },
    'Leave Apply': { en: 'Leave Apply', ar: 'طلب إجازة' },
  };

  const cards = [
    {
      title: cardTitles['Attendance'][language],
      value: attendanceData,
      icon: (
        <img
          src={CheckedIcon}
          alt='Attendance'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
      BorderColor: borderColor,
    },
    {
      title: cardTitles['Leave Apply'][language],
      value: leavesData,
      icon: (
        <img
          src={beachIcon}
          alt='LeaveApply'
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
      BorderColor: borderColor,
    },
  ];

  return (
    <Box
      sx={{
        border: `1px solid  ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL support
        height: '100%', // Match the height of GenderPercentageChart
        display: 'flex',
        flexDirection: 'column',
      }}
      p={2}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography fontWeight='bold' fontSize={16} color={textColor}>
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
            <Button variant='contained' onClick={handleLoginClick} size='small'>
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flex: 1, // Take remaining space
            justifyContent: 'center', // Center the cards vertically
          }}
        >
          {cards.map(card => (
            <Box
              key={card.title}
              sx={{
                flex: 1, // Each card takes equal space
                minHeight: '80px', // Ensure minimum height for cards
              }}
            >
              <AvailabilityCard {...card} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
