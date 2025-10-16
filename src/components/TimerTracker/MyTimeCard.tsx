import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import timesheetApi, { type TimesheetEntry } from '../../api/timesheetApi';

import attendanceApi from '../../api/attendanceApi';
import { Link as RouterLink } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [checkingAttendance, setCheckingAttendance] = useState<boolean>(true);
  
  // Use refs to track the latest values without causing re-renders
  const currentSessionRef = useRef<TimesheetEntry | null>(null);
  const hasCheckedInRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef<boolean>(true);
  const lastFetchTimeRef = useRef<number>(0);

  // Update refs when state changes
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    hasCheckedInRef.current = hasCheckedIn;
  }, [hasCheckedIn]);

  // Check if user has checked in today - now stable with no dependencies
  const checkAttendanceStatus = useCallback(async (force = false) => {
    if (!isComponentMountedRef.current) return;
    
    // Prevent redundant calls within 10 seconds unless forced
    const now = Date.now();
    if (!force && (now - lastFetchTimeRef.current) < 10000) {
      return;
    }
    
    try {
      setCheckingAttendance(true);
      const todaySummary = await attendanceApi.getTodaySummary();
      const checkedIn = !!todaySummary.checkIn;
      
      lastFetchTimeRef.current = now;
      
      // Only update state if value changed
      if (hasCheckedInRef.current !== checkedIn) {
        setHasCheckedIn(checkedIn);
      }

      // If user has checked out, automatically end any active timesheet session
      if (todaySummary.checkOut && currentSessionRef.current) {
        await handleEnd();
      }
    } catch {
      if (hasCheckedInRef.current !== false) {
        setHasCheckedIn(false);
      }
    } finally {
      if (isComponentMountedRef.current) {
        setCheckingAttendance(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies - stable function

  const fetchLatestSession = useCallback(async (force = false) => {
    if (!isComponentMountedRef.current) return;
    
    // Prevent redundant calls within 10 seconds unless forced
    const now = Date.now();
    if (!force && (now - lastFetchTimeRef.current) < 10000) {
      return;
    }
    
    try {
      const response = await timesheetApi.getUserTimesheet();
      const sessions = response.items.sessions;
      const activeSession = sessions.find(s => !s.end_time);
      const newSession = activeSession || null;
      
      // Only update state if session changed
      if (JSON.stringify(currentSessionRef.current) !== JSON.stringify(newSession)) {
        setCurrentSession(newSession);
      }
    } catch {
      if (currentSessionRef.current !== null) {
        setCurrentSession(null);
      }
    }
  }, []); // No dependencies - stable function

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkAttendanceStatus(true),
        fetchLatestSession(true)
      ]);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  // Only fetch data on mount and when tab becomes visible
  useEffect(() => {
    // Initial fetch on mount
    const initialFetch = async () => {
      await Promise.all([
        checkAttendanceStatus(true),
        fetchLatestSession(true)
      ]);
    };

    initialFetch();

    // Listen for visibility changes - refresh when user comes back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isComponentMountedRef.current) {
        // Only refresh if it's been more than 30 seconds since last fetch
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch > 30000) {
          handleRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only depend on handleRefresh

  // Timer effect - separate from data fetching
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
    const s = seconds % 60;

    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
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
      // Force refresh data after starting work
      await Promise.all([
        checkAttendanceStatus(true),
        fetchLatestSession(true)
      ]);
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

      // Force refresh to keep UI consistent (in case server changed)
      await fetchLatestSession(true);
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
      // Force refresh data after ending work to ensure consistency
      await Promise.all([
        checkAttendanceStatus(true),
        fetchLatestSession(true)
      ]);
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

      // If there was an error, force refresh to restore the session state
      await fetchLatestSession(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card
        sx={{
          background: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: 2,
          position: 'relative',
          flex: 1,
          height: '100%',
          boxShadow: 'unset',
          color: darkMode ? '#ffffff' : '#000000',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3, boxShadow: 'none', border: 'none' }}>
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

          {/* Manual Refresh Button - Top Right */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
            }}
          >
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || loading}
                size="small"
                sx={{
                  backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                  border: darkMode ? '1px solid #333333' : '1px solid #e0e0e0',
                  '&:hover': {
                    backgroundColor: darkMode ? '#333333' : '#e0e0e0',
                  },
                  '&:disabled': {
                    backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0',
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: '1rem',
                    color: darkMode ? '#b0b0b0' : '#666666',
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
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
                  : '0h 00m 00s'}
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
                  className='ramish stop'
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
                    top: -1,
                    width: 5,
                    height: 4,
                    backgroundColor: '#2E7D32',
                    borderRadius: '3px 3px 0 0',
                    zIndex: 1,
                  }}
                />

                {/* Stopwatch Buttons */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: '2px',
                    top: '10%',
                    rotate: '-42deg',
                    width: 3,
                    height: 7,
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
                  px: 1,
                  py: 1,
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
