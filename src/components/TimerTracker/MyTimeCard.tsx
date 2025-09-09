import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import timesheetApi, { type TimesheetEntry } from '../../api/timesheetApi';

import attendanceApi from '../../api/attendanceApi';
import { Link as RouterLink } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

const POLL_INTERVAL_MS = 5000;

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const MyTimerCard: React.FC = () => {
  const { darkMode } = useOutletContext<OutletContext>();
  const [currentSession, setCurrentSession] = useState<TimesheetEntry | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [checkingAttendance, setCheckingAttendance] = useState<boolean>(true);

  // Check if user has checked in today
  const checkAttendanceStatus = useCallback(async () => {
    try {
      setCheckingAttendance(true);
      const todaySummary = await attendanceApi.getTodaySummary();
      setHasCheckedIn(!!todaySummary.checkIn);

      // If user has checked out, automatically end any active timesheet session
      if (todaySummary.checkOut && currentSession) {
        await handleEnd();
      }
    } catch {
      setHasCheckedIn(false);
    } finally {
      setCheckingAttendance(false);
    }
  }, [currentSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLatestSession = async () => {
    try {
      const response = await timesheetApi.getUserTimesheet();
      const sessions = response.items.sessions;
      const activeSession = sessions.find(s => !s.end_time);
      setCurrentSession(activeSession || null);
    } catch {
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
  }, [checkAttendanceStatus]);

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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    return `${h}h ${m.toString().padStart(2, '0')}m`;
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
    } catch (err: unknown) {
      const msg =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response.data
              ?.message
          : null) ||
        (err as Error)?.message ||
        'Failed to clock in. Please make sure you checked in.';
      setErrorMsg(msg);

      // fetch latest to keep UI consistent (in case server changed)
      await fetchLatestSession();
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = useCallback(async () => {
    setErrorMsg(null);

    // Immediately stop the timer by clearing the current session
    setCurrentSession(null);
    setElapsed(0);

    try {
      setLoading(true);

      await timesheetApi.endWork();
      setErrorMsg(null);
    } catch (err: unknown) {
      const msg =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response.data
              ?.message
          : null) ||
        (err as Error)?.message ||
        'Failed to clock out.';
      setErrorMsg(msg);

      // If there was an error, restore the session state
      await fetchLatestSession();
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Card
        sx={{
          background: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: 2,
          position: 'relative',
          border: darkMode ? '1px solid #333333' : '1px solid #e0e0e0',
          flex: 1,
          height: '100%',
          boxShadow: 'none',
          color: darkMode ? '#ffffff' : '#000000',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Main Timer Display - Centered */}
          {/* Session Progress - Top Left */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor:
                currentSession && !currentSession.end_time
                  ? darkMode
                    ? '#2e4a2e'
                    : '#e8f5e8'
                  : darkMode
                    ? '#2a2a2a'
                    : '#f5f5f5',
              borderRadius: 2,
              px: 2,
              py: 1,
              border:
                currentSession && !currentSession.end_time
                  ? '1px solid #4CAF50'
                  : darkMode
                    ? '1px solid #333333'
                    : '1px solid #e0e0e0',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <AccessTimeIcon
              sx={{
                fontSize: '0.75rem',
                color:
                  currentSession && !currentSession.end_time
                    ? '#4CAF50'
                    : darkMode
                      ? '#b0b0b0'
                      : '#666666',
              }}
            />
            <Typography
              variant='caption'
              color={
                currentSession && !currentSession.end_time
                  ? '#4CAF50'
                  : darkMode
                    ? '#b0b0b0'
                    : '#666666'
              }
              sx={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {currentSession && !currentSession.end_time
                ? 'Session in Progress'
                : 'No Active Session'}
            </Typography>
          </Box>

          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            minHeight='200px'
            position='relative'
          >
            {/* Time Display with Stopwatch Icon */}
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              gap={2}
              mb={2}
            >
              <Typography
                variant='h2'
                fontWeight={700}
                color={darkMode ? '#ffffff' : '#000000'}
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                  textAlign: 'center',
                  lineHeight: 0.8,
                  fontFamily: 'monospace',
                  letterSpacing: '-0.05em',
                }}
              >
                {currentSession && !currentSession.end_time
                  ? formatTime(elapsed)
                  : '0h 00m'}
              </Typography>

              {/* Stopwatch Shape */}
              <Box
                sx={{
                  width: 32,
                  height: 36,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Stopwatch Body */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    border: '2px solid #4CAF50',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Moving White Color Inside */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: `conic-gradient(from ${(elapsed % 60) * 6}deg, #ffffff 0deg, #ffffff 180deg, transparent 180deg, transparent 360deg)`,
                      animation:
                        currentSession && !currentSession.end_time
                          ? 'spin 1s linear infinite'
                          : 'none',
                      '@keyframes spin': {
                        '0%': {
                          transform: 'rotate(0deg)',
                        },
                        '100%': {
                          transform: 'rotate(360deg)',
                        },
                      },
                    }}
                  />
                </Box>

                {/* Stopwatch Crown/Top */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -3,
                    width: 6,
                    height: 10,
                    backgroundColor: '#2E7D32',
                    borderRadius: '3px 3px 0 0',
                    zIndex: 1,
                  }}
                />

                {/* Stopwatch Buttons */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: -2,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 8,
                    backgroundColor: '#2E7D32',
                    borderRadius: '0 2px 2px 0',
                    zIndex: 1,
                  }}
                />
              </Box>
            </Box>

            {/* Status Text */}
            <Typography
              variant='body1'
              color={darkMode ? '#b0b0b0' : '#666666'}
              textAlign='center'
              sx={{ fontSize: '1rem' }}
            >
              {currentSession && !currentSession.end_time
                ? `Clocked In: Today at ${
                    currentSession.start_time
                      ? new Date(currentSession.start_time).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )
                      : 'N/A'
                  }`
                : hasCheckedIn
                  ? 'Ready to start tracking time'
                  : 'Please check in first'}
            </Typography>
          </Box>

          {/* Action Button */}
          <Box display='flex' justifyContent='center'>
            {!currentSession ? (
              <Button
                variant='contained'
                size='large'
                onClick={handleStart}
                disabled={loading || !hasCheckedIn}
                sx={{
                  backgroundColor: 'primary.main',
                  width: '100%',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',

                  '&:disabled': {
                    backgroundColor: '#cccccc',
                    color: '#666666',
                  },
                }}
                startIcon={
                  loading ? (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  ) : null
                }
              >
                Clock In
              </Button>
            ) : (
              <Button
                variant='contained'
                size='large'
                onClick={handleEnd}
                disabled={loading}
                sx={{
                  backgroundColor: 'primary.main',
                  width: '100%',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                }}
                startIcon={
                  loading ? (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  ) : null
                }
              >
                Clock Out
              </Button>
            )}
          </Box>

          {/* Timesheet Link - Subtle */}
          <Box display='flex' justifyContent='center' mt={2}>
            <Button
              variant='text'
              component={RouterLink}
              to='TimesheetLayout'
              sx={{
                fontSize: '0.9rem',
                fontWeight: 400,
                textTransform: 'none',
                color: darkMode ? '#b0b0b0' : '#666666',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: darkMode ? '#ffffff' : '#000000',
                },
              }}
            >
              View Timesheet
            </Button>
          </Box>

          {/* Error messages */}
          {!currentSession && !hasCheckedIn && !checkingAttendance && (
            <Box mt={2} textAlign='center'>
              <Typography variant='body2' color='error'>
                You must check in before you can clock in.
              </Typography>
            </Box>
          )}
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
