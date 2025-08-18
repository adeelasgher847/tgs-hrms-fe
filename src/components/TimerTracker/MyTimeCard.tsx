import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  // IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

type Props = {
  onClockIn?: () => void;
  onClockOut?: () => void;
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // adjust when day is Sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(weekStart: Date) {
  const iso = new Date(weekStart);
  iso.setHours(0, 0, 0, 0);
  return `timesheet:${iso.toISOString().slice(0, 10)}`;
}

function loadWeek(weekStart: Date) {
  try {
    const raw = localStorage.getItem(weekKey(weekStart));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [] as any[];
}

function formatHoursText(h: number) {
  const totalMinutes = Math.max(0, Math.round(h * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
}

const MyTimeCard: React.FC<Props> = ({ onClockIn, onClockOut }) => {
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [weekTotalHours, setWeekTotalHours] = useState<number>(0);

  // Restore from localStorage on load
  useEffect(() => {
    const savedStart = localStorage.getItem('clockInTime');
    if (savedStart) {
      const start = parseInt(savedStart, 10);
      setStartTime(start);
      setIsClockedIn(true);
    }
  }, []);

  // Stopwatch update
  useEffect(() => {
    let timer: number | undefined;
    if (isClockedIn && startTime) {
      timer = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isClockedIn, startTime]);

  // Circular progress loop animation
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

  // Compute This Week total (saved entries + live session)
  useEffect(() => {
    const ws = getMonday(new Date());
    const data = loadWeek(ws);
    const base = Array.isArray(data)
      ? data.reduce((sum: number, e: any) => sum + (e?.hours || 0), 0)
      : 0;
    const live =
      isClockedIn && startTime ? (Date.now() - startTime) / 3_600_000 : 0;
    setWeekTotalHours(base + live);
    // Also update when localStorage week changes (e.g., after clock-out in Timesheet UI)
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('timesheet:')) {
        const d = loadWeek(ws);
        const b = Array.isArray(d)
          ? d.reduce((sum: number, x: any) => sum + (x?.hours || 0), 0)
          : 0;
        const l =
          isClockedIn && startTime ? (Date.now() - startTime) / 3_600_000 : 0;
        setWeekTotalHours(b + l);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isClockedIn, startTime, elapsedMs]);

  const handleClockIn = () => {
    const now = Date.now();
    setIsClockedIn(true);
    setStartTime(now);
    setElapsedMs(0);
    localStorage.setItem('clockInTime', now.toString());
    onClockIn?.();
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('clockInTime');
    onClockOut?.();
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        overflow: 'visible',
        mx: 'auto',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: '#f6fbf8',
            px: 3,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <AccessTimeIcon sx={{ color: '#45407A' }} />
          <Typography sx={{ color: '#45407A', fontWeight: 700 }}>
            My Time
          </Typography>
        </Box>

        {/* Main content */}
        <Box
          sx={{
            px: 4,
            py: 3,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Stopwatch circle */}
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
              <Typography
                variant='h6'
                sx={{ fontWeight: 800, color: '#45407A' }}
              >
                {isClockedIn ? formatElapsed(elapsedMs) : '00:00:00'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6b6b6b' }}>
                Today
              </Typography>
            </Box>
          </Box>

          {/* Clock In / Out Buttons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <Button
              variant='contained'
              onClick={isClockedIn ? handleClockOut : handleClockIn}
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

            {/* <IconButton
              sx={{
                border: "1px solid rgba(0,0,0,0.08)",
                height: 46,
                width: 46,
                borderRadius: 3,
              }}
            >
              <ArrowDropDownIcon />
            </IconButton> */}
          </Box>
        </Box>

        <Divider sx={{ mx: 3 }} />

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>
              This Week
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {formatHoursText(weekTotalHours)}
            </Typography>
          </Box>

          {/* <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, color: "#9a9a9a" }}>
              Pay Period
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>0h 00m</Typography>
          </Box> */}

          <Box sx={{ textAlign: 'right' }}>
            <Button
              variant='outlined'
              sx={{ borderRadius: 3, textTransform: 'none' }}
              component={RouterLink}
              to='/dashboard/TimesheetLayout'
            >
              My Timesheet
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MyTimeCard;
