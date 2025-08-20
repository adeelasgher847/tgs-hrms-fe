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
import SheetList from './SheetList';
import { Link as RouterLink } from "react-router-dom";


const POLL_INTERVAL_MS = 5000; // poll backend every 5s to detect external check-outs

const MyTimerCard: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0); // seconds
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch latest session from backend and update local state.
  const fetchLatestSession = async () => {
    try {
      const sessions = await timesheetApi.getUserTimesheet();
      // sessions is expected to be array sorted by start_time desc (latest first).
      const latest = sessions && sessions.length > 0 ? sessions[0] : null;
      if (latest && !latest.end_time) {
        // Active session detected
        // If it differs from currentSession, update it (so timer restarts from correct start_time)
        if (!currentSession || currentSession.id !== latest.id) {
          setCurrentSession(latest);
        }
      } else {
        // No active session
        if (currentSession !== null) {
          // only update if we had an active session before
          setCurrentSession(null);
        } else {
          setCurrentSession(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching latest session:', err);
      // do not set fatal UI state on polling failure, just show a temporary message
      setErrorMsg(err?.message ?? 'Failed to fetch sessions');
      // swallow error; polling will try again
    }
  };

  // On mount: initial fetch + start polling
  useEffect(() => {
    let pollId: number | null = null;

    // initial fetch
    fetchLatestSession().catch((e) => {
      /* already handled inside */
    });

    // start polling
    pollId = window.setInterval(() => {
      fetchLatestSession().catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollId) window.clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // Timer effect: updates elapsed seconds while session is active
  useEffect(() => {
    let tickId: number | null = null;

    if (currentSession && currentSession.start_time && !currentSession.end_time) {
      const startMs = new Date(currentSession.start_time).getTime();
      // Set initial elapsed immediately
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
      tickId = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      // No active session -> ensure timer reset
      setElapsed(0);
    }

    return () => {
      if (tickId) window.clearInterval(tickId);
    };
  }, [currentSession]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Clock In handler
  const handleStart = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      const session = await timesheetApi.startWork();
      // After a successful start, update currentSession immediately so timer starts
      setCurrentSession(session as TimesheetEntry);
      setElapsed(0); // will be set by timer effect on next tick; safe to reset now
    } catch (err: any) {
      console.error('Error starting work:', err);
      // Show helpful message: backend may require a prior attendance check-in
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start work. Please make sure you checked in.';
      setErrorMsg(msg);
      // fetch latest to keep UI consistent (in case server changed)
      fetchLatestSession().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  // Clock Out handler
  const handleEnd = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      // call timesheet end endpoint
      const ended = await timesheetApi.endWork();
      // Immediately clear local active session so UI flips to "Clock In"
      setCurrentSession(null);
      setElapsed(0);
      // Re-fetch latest session list (ensures UI is in sync if backend created/updated entries)
      fetchLatestSession().catch(() => {});
    } catch (err: any) {
      console.error('Error ending work:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to end work.';
      setErrorMsg(msg);
      // Also try to refresh state from server
      fetchLatestSession().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{
            background: "#ffffff",
            borderRadius: 2,
            position: 'relative',
            border: '1px solid #eee',
            flex: 1,
            height: '100%',
            boxShadow:'none'}}>
        <CardContent>
          {/* header */}
          <Box display="flex" alignItems="center" gap={2}>
            <AccessTimeIcon fontSize="large" />
            <Typography variant="h6">
              {currentSession ? 'Session in progress' : 'No active session'}
            </Typography>
          </Box>

          {/* elapsed timer + circular progress */}
          {currentSession && !currentSession.end_time && (
            <Box mt={2} display="flex" flexDirection="column" alignItems="center">
              <CircularProgress
                variant="determinate"
                value={(elapsed % 60) * (100 / 60)} // animate within current minute
                size={90}
                thickness={5}
              />
              <Typography mt={1} variant="h6">
                {formatTime(elapsed)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Started at: {new Date(currentSession.start_time).toLocaleString()}
              </Typography>
            </Box>
          )}

          {/* loading state */}
          {loading ? (
            <Box mt={2} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box mt={2} display="flex" gap={2} justifyContent="center">
              {/* Clock In / Clock Out */}
              {!currentSession ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStart}
                  disabled={loading}
                >
                  Work start
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleEnd}
                  disabled={loading}
                >
                  Work end
                </Button>
              )}

              {/* Toggle Timesheet view */}
              <Button variant="outlined"
              component={RouterLink}
               to="TimesheetLayout"
             >
               My Timesheet
              </Button>
            </Box>
          )}

          {/* Optional: short status text */}
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {currentSession
                ? `Active session started at ${new Date(currentSession.start_time).toLocaleTimeString()}`
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
        <Alert onClose={() => setErrorMsg(null)} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MyTimerCard;
