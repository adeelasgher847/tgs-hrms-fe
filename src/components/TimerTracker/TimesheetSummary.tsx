import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

type Props = {
  isClockedIn: boolean;
  startTime: number | null;
  onClockIn: () => void;
  onClockOut: () => void;
  weekStart: Date;
  weekTotalHours?: number;
};

const formatElapsed = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
};

const formatRange = (start: Date) => {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startPart = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endPart = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${startPart} – ${endPart}`;
};

const formatHoursText = (h: number) => {
  const totalMinutes = Math.max(0, Math.round(h * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const formatClockLabel = (tsStr: string | null) => {
  if (!tsStr) return null;
  const ts = parseInt(tsStr, 10);
  if (Number.isNaN(ts)) return null;
  const d = new Date(ts);
  const time = d
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${date} • ${time}`;
};

const TimesheetSummary: React.FC<Props> = ({
  isClockedIn,
  startTime,
  onClockIn,
  onClockOut,
  weekStart,
  weekTotalHours = 0,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progress, setProgress] = useState<number>(0);
  const [lastIn, setLastIn] = useState<string | null>(
    localStorage.getItem('lastClockInTime')
  );
  const [lastOut, setLastOut] = useState<string | null>(
    localStorage.getItem('lastClockOutTime')
  );

  // Stopwatch update
  useEffect(() => {
    let timer: number | undefined;
    if (isClockedIn && startTime) {
      timer = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isClockedIn, startTime]);

  // Circular progress loop animation (purely visual)
  useEffect(() => {
    let anim: number | undefined;
    if (isClockedIn) {
      const intervalMs = 100; // 0.1s
      const step = (100 * (intervalMs / 1000)) / 60; // complete in 60s
      anim = window.setInterval(() => {
        setProgress(old => {
          const next = old + step;
          return next >= 100 ? 0 : next;
        });
      }, intervalMs);
    } else {
      setProgress(0);
    }
    return () => {
      if (anim) window.clearInterval(anim);
    };
  }, [isClockedIn]);

  // Sync last clock labels when localStorage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lastClockInTime') setLastIn(e.newValue);
      if (e.key === 'lastClockOutTime') setLastOut(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const lastInLabel = formatClockLabel(lastIn);
  const lastOutLabel = formatClockLabel(lastOut);

  return (
    <Box p={2} height={'100%'}>
      <Box display='flex' alignItems='center' gap={2}>
        <Avatar sx={{ bgcolor: 'success.main' }}>A</Avatar>
        <Box>
          <Typography fontWeight={700}>John Doe</Typography>
          <Typography variant='body2' color='text.secondary'>
            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Typography>
        </Box>
      </Box>

      <Box
        mt={3}
        textAlign='center'
        display='flex'
        flexDirection='column'
        alignItems='center'
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          {/* Track */}
          <CircularProgress
            variant='determinate'
            value={100}
            size={120}
            thickness={4}
            sx={{ color: '#e5e5e5' }}
          />
          {/* Animated ring */}
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <CircularProgress
              variant='determinate'
              value={progress}
              size={120}
              thickness={4}
              sx={{
                color: isClockedIn ? '#1f7a4f' : '#ccc',
                transition: 'color 0.3s ease',
              }}
            />
          </Box>
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 800, color: '#45407A' }}>
              {isClockedIn ? formatElapsed(elapsedMs) : '00:00:00'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#6b6b6b' }}>
              Today
            </Typography>
          </Box>
        </Box>

        <Button
          variant='contained'
          onClick={isClockedIn ? onClockOut : onClockIn}
          sx={{
            bgcolor: '#1f7a4f',
            textTransform: 'none',
            borderRadius: 5,
            px: 5,
            py: 1.5,
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#16603a', boxShadow: 'none' },
          }}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />{' '}
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>

        <Box mt={1.5}>
          {lastInLabel && (
            <Typography variant='caption' color='text.secondary'>
              Clock In: {lastInLabel}
            </Typography>
          )}
          {lastOutLabel && (
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
            >
              Clock Out: {lastOutLabel}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* <TimesheetChart /> */}

      <Box
        mt={2}
        display='flex'
        alignItems='center'
        justifyContent='space-between'
      >
        <Box textAlign='right'>
          <Typography variant='body2' color='text.secondary'>
            This Week
          </Typography>
          <Typography fontWeight={700}>
            {formatHoursText(weekTotalHours)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TimesheetSummary;
