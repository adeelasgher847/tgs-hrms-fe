import { Box, Typography, CircularProgress, Button } from '@mui/material';
import AvailabilityCard from './AvailabilityCard';
import CheckedIcon from '../../../assets/dashboardIcon/checked.svg';
import stopwatchIcon from '../../../assets/dashboardIcon/stopwatch.svg';
import banIcon from '../../../assets/dashboardIcon/ban.svg';
import beachIcon from '../../../assets/dashboardIcon/beach-bed.svg';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
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

      console.log('🔄 Fetching availability data...');

      // Fetch both APIs in parallel
      const [attendanceResponse, leavesResponse] = await Promise.all([
        getAttendanceThisMonth(),
        getLeavesThisMonth(),
      ]);

      console.log(
        '✅ AvailabilityCardsGrid - Attendance API Response:',
        attendanceResponse
      );
      console.log(
        '✅ AvailabilityCardsGrid - Leaves API Response:',
        leavesResponse
      );

      // Validate response structure before accessing properties
      if (
        attendanceResponse &&
        typeof attendanceResponse.totalAttendance === 'number'
      ) {
        console.log(
          '✅ Setting attendance data:',
          attendanceResponse.totalAttendance
        );
        setAttendanceData(attendanceResponse.totalAttendance);
      } else if (
        attendanceResponse &&
        attendanceResponse.data &&
        typeof attendanceResponse.data.total_attendance === 'number'
      ) {
        console.log(
          '✅ Setting attendance data:',
          attendanceResponse.data.total_attendance
        );
        setAttendanceData(attendanceResponse.data.total_attendance);
      } else {
        console.warn(
          '⚠️ Invalid attendance response structure:',
          attendanceResponse
        );
        setAttendanceData(0);
      }

      if (leavesResponse && typeof leavesResponse.totalLeaves === 'number') {
        console.log('✅ Setting leaves data:', leavesResponse.totalLeaves);
        setLeavesData(leavesResponse.totalLeaves);
      } else if (
        leavesResponse &&
        leavesResponse.data &&
        typeof leavesResponse.data.total_leaves === 'number'
      ) {
        console.log(
          '✅ Setting leaves data:',
          leavesResponse.data.total_leaves
        );
        setLeavesData(leavesResponse.data.total_leaves);
      } else {
        console.warn('⚠️ Invalid leaves response structure:', leavesResponse);
        setLeavesData(0);
      }
    } catch (err: unknown) {
      console.error('❌ Error fetching availability data:', err);

      // Check if it's an authentication error
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
        setError('Failed to load availability data. Please try again later.');
        setAttendanceData(0);
        setLeavesData(0);
      }
    } finally {
      setLoading(false);
      console.log('🏁 Finished loading availability data');
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
      title: cardTitles['Late Coming'][language],
      value: 12, // Keep mock data for now since no API for this
      icon: (
        <img
          src={stopwatchIcon}
          alt='LateComing'
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
      title: cardTitles['Absent'][language],
      value: 5, // Keep mock data for now since no API for this
      icon: (
        <img
          src={banIcon}
          alt='Absent'
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
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: { xs: 'center', md: 'space-between' },
          }}
        >
          {cards.map(card => (
            <Box
              key={card.title}
              sx={{
                flex: { xs: '100%', sm: '33%' },
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
