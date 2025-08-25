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
import { Link as RouterLink } from "react-router-dom";


const POLL_INTERVAL_MS = 5000;

const MyTimerCard: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<TimesheetEntry | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLatestSession = async () => {
    try {
      const response = await timesheetApi.getUserTimesheet();
      const sessions = response.items.sessions;
      const latest = sessions && sessions.length > 0 ? sessions[0] : null;
      setCurrentSession(latest);
    } catch (error) {
      console.error('Error fetching latest session:', error);
    }
  };

  useEffect(() => {
    let pollId: number | null = null;

    // initial fetch
    fetchLatestSession().catch(e => {
      /* already handled inside */
    });

    pollId = window.setInterval(() => {
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
    try {
      setLoading(true);
      const session = await timesheetApi.startWork();
      setCurrentSession(session as TimesheetEntry);
      setElapsed(0); 
    } catch (err: any) {
      console.error('Error starting work:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start work. Please make sure you checked in.';
      setErrorMsg(msg);
      fetchLatestSession().catch(() => {});
    } finally {
      setLoading(false);
    }
  };


  const handleEnd = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
 
      const ended = await timesheetApi.endWork();
    
      setCurrentSession(null);
      setElapsed(0);
      fetchLatestSession().catch(() => {});
    } catch (err: any) {
      console.error('Error ending work:', err);
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to end work.';
      setErrorMsg(msg);
      fetchLatestSession().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          background: '#ffffff',
          borderRadius: 2,
          position: 'relative',
          border: '1px solid #eee',
          flex: 1,
          height: '100%',
          boxShadow: 'none',
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
                value={(elapsed % 60) * (100 / 60)} // animate within current minute
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
                  disabled={loading}
                >
                  Work start
                </Button>
              ) : (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={handleEnd}
                  disabled={loading}
                >
                  Work end
            </Button>
              )}

              {/* Toggle Timesheet view */}
              <Button
                variant='outlined'
                component={RouterLink}
                to='TimesheetLayout'
              >
                My Timesheet
              </Button>
            </Box>
          )}

          {/* Optional: short status text */}
          <Box mt={2} textAlign='center'>
            <Typography variant='body2' color='text.secondary'>
              {currentSession
                ? `Active session started at ${currentSession.start_time ? new Date(currentSession.start_time).toLocaleTimeString() : 'N/A'}`
                : 'No active session — Clock In to start a new session.'}
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
