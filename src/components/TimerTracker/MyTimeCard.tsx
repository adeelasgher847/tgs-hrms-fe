import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import timesheetApi, { type TimesheetEntry } from '../../api/timesheetApi';

import attendanceApi from '../../api/attendanceApi';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';


const POLL_INTERVAL_MS = 5000;

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const MyTimerCard: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<TimesheetEntry | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [checkingAttendance, setCheckingAttendance] = useState<boolean>(true);

  const theme = useTheme();
  const { darkMode } = useOutletContext<OutletContext>();

  // Check if user has checked in today
  const checkAttendanceStatus = async () => {
    try {
      setCheckingAttendance(true);
      const todaySummary = await attendanceApi.getTodaySummary();
      setHasCheckedIn(!!todaySummary.checkIn);

      // If user has checked out, automatically end any active timesheet session
      if (todaySummary.checkOut && currentSession) {
        console.log('User checked out, automatically ending timesheet session');
        await handleEnd();
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
      setHasCheckedIn(false);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const fetchLatestSession = async () => {
    try {
      const response = await timesheetApi.getUserTimesheet();
      const sessions = response.items.sessions;
      const activeSession = sessions.find(s => !s.end_time);
      setCurrentSession(activeSession || null);
    } catch (error) {
      console.error('Error fetching latest session:', error);
      setCurrentSession(null);
    }
  };

  useEffect(() => {
    let pollId: number | null = null;

    // Check attendance status and fetch latest session
    checkAttendanceStatus();
    fetchLatestSession().catch(() => {
      /* already handled inside */
    });

    pollId = window.setInterval(() => {
      checkAttendanceStatus();
      fetchLatestSession().catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollId) window.clearInterval(pollId);
    };
  }, []);


  useEffect(() => {
    let tickId: number | null = null;

    if (
      currentSession &&
      currentSession.start_time &&
      !currentSession.end_time
    ) {
      const startMs = new Date(currentSession.start_time).getTime();
 
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
      tickId = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
     
      setElapsed(0);
    }

    return () => {
      if (tickId) window.clearInterval(tickId);
    };
  }, [currentSession]);


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStart = async () => {
    setErrorMsg(null);

    // Check if user has checked in before allowing Clock In
    if (!hasCheckedIn) {
      setErrorMsg('You cannot clock in until you check in.');
      return;
    }

    try {
      setLoading(true);

      await timesheetApi.startWork();
      await fetchLatestSession();
      setErrorMsg(null);

    } catch (err: any) {
      console.error('Error starting work:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to clock in. Please make sure you checked in.';
      setErrorMsg(msg);

      // fetch latest to keep UI consistent (in case server changed)
      await fetchLatestSession();

    } finally {
      setLoading(false);
    }
  };


  const handleEnd = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);

      await timesheetApi.endWork();
      await fetchLatestSession();
      setErrorMsg(null);

    } catch (err: any) {
      console.error('Error ending work:', err);
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to clock out.';
      setErrorMsg(msg);

      // Also try to refresh state from server
      await fetchLatestSession();

    } finally {
      setLoading(false);
    }
  };

  const cardBackground = darkMode ? theme.palette.background.paper : '#ffffff';
  const cardBorder = darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #eee';
  const textPrimary = theme.palette.text.primary;

  return (
    <>
      <Card
        sx={{
          background: cardBackground,
          borderRadius: 2,
          position: 'relative',
          border: cardBorder,
          flex: 1,
          height: '100%',
          boxShadow: 'none',
          color: textPrimary,
          '&,MuiPaper-root-MuiCard-root':{
            border: 'none',
          }
        }}
      >
        <CardContent>
          {/* header */}
          <Box display='flex' alignItems='center' gap={2}>
            <AccessTimeIcon fontSize='large' />
            <Typography variant='h6'>
              {currentSession ? 'Session in progress' : 'No active session'}
          </Typography>
        </Box>

          {/* elapsed timer + circular progress */}
          {currentSession && !currentSession.end_time && (
            <Box
              mt={2}
              display='flex'
              flexDirection='column'
              alignItems='center'
            >
              <CircularProgress
                variant='determinate'
                value={(elapsed % 60) * (100 / 60)}
                size={90}
                thickness={5}
              />
              <Typography mt={1} variant='h6'>
                {formatTime(elapsed)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Started at:{' '}
                {currentSession.start_time
                  ? new Date(currentSession.start_time).toLocaleString()
                  : 'N/A'}
              </Typography>
            </Box>
          )}

          {/* loading state */}
          {loading ? (
            <Box mt={2} display='flex' justifyContent='center'>
              <CircularProgress size={24} />
          </Box>
          ) : (
            <Box mt={2} display='flex' gap={2} justifyContent='center'>
              {/* Clock In / Clock Out */}
              {!currentSession ? (
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleStart}
                  disabled={loading || !hasCheckedIn}
                  sx={{ backgroundColor: '#464b8a' }}
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={handleEnd}
                  disabled={loading}
                >

                  Clock Out
                </Button>
              )}

              {/* Toggle Timesheet view - Only show when checked in or has active session */}
              {(hasCheckedIn || currentSession) && (
                <Button
                  variant='outlined'
                  component={RouterLink}
                  to='TimesheetLayout'
                >
                  My Timesheet
                </Button>
              )}
            </Box>
          )}

          {/* Check-in status and error messages */}
          {!currentSession && !hasCheckedIn && !checkingAttendance && (
            <Box mt={2} textAlign='center'>
              <Typography variant='body2' color='error'>
                You must check in before you can clock in.
              </Typography>
            </Box>
          )}

          {/* Optional: short status text */}
          <Box mt={2} textAlign='center'>
            <Typography variant='body2' color='text.secondary'>
              {checkingAttendance
                ? 'Checking attendance status...'
                : currentSession
                  ? `Active session started at ${currentSession.start_time ? new Date(currentSession.start_time).toLocaleTimeString() : 'N/A'}`
                  : hasCheckedIn
                    ? 'No active session — Clock In to start a new session.'
                    : 'Please check in first before clocking in.'}
            </Typography>
        </Box>
      </CardContent>
    </Card>

      {/* Snackbar for errors */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={6000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMsg(null)}
          severity='error'
          sx={{ width: '100%' }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MyTimerCard;
