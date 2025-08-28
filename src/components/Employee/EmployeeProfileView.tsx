import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Work, Business, Email, CalendarToday } from '@mui/icons-material';
import employeeApi from '../../api/employeeApi';
import type {
  EmployeeFullProfile,
  EmployeeProfileAttendanceSummaryItem,
  EmployeeProfileLeaveHistoryItem,
} from '../../api/employeeApi';
import UserAvatar from '../common/UserAvatar';

const EmployeeProfileView: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const base64UrlDecode = (str: string): string => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = output.length % 4;
    if (pad === 2) output += '==';
    else if (pad === 3) output += '=';
    else if (pad !== 0) output += '===';
    try {
      return atob(output);
    } catch {
      return '';
    }
  };

  const resolveUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payloadJson = base64UrlDecode(parts[1]);
      if (!payloadJson) return null;
      const payload = JSON.parse(payloadJson);
      const candidate =
        payload.employeeId ||
        payload.employee_id ||
        payload.empId ||
        payload.emp_id ||
        payload.userId ||
        payload.user_id ||
        payload.id;
      if (!candidate) return null;
      return String(candidate);
    } catch {
      return null;
    }
  };

  const resolveUserId = (): string | null => {
    const fromToken = resolveUserIdFromToken();
    if (fromToken) return fromToken;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed?.id || parsed?.user?.id || null;
      }
    } catch {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = resolveUserId();
        if (!userId) {
          setError('Unable to resolve user id from token. Please re-login.');
          setIsLoading(false);
          return;
        }
        const res = await employeeApi.getEmployeeProfile(userId);
        setProfile(res);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setError('Profile not found for the resolved user id.');
        } else {
          setError(e?.message || 'Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? String(iso)
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Box py={3} display='flex' justifyContent='center'>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={3}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Box py={2}>
      <Paper
        elevation={1}
        sx={{ borderRadius: 3, p: 3, bgcolor: 'background.paper', mb: 4 }}
      >
        <Typography
          variant='h5'
          fontWeight={600}
          gutterBottom
          color='primary.main'
        >
          Employee Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box display='flex' alignItems='center' mb={3}>
          <UserAvatar
            user={{
              id: profile.id,
              first_name: profile.name.split(' ')[0] || '',
              last_name: profile.name.split(' ').slice(1).join(' ') || '',
              profile_pic: profile.profile_pic,
            }}
            size={80}
            sx={{ mr: 2 }}
          />
          <Box>
            <Typography variant='h6' fontWeight={600}>
              {profile.name}
            </Typography>
            <Chip
              label={profile.designation || '—'}
              icon={<Work />}
              sx={{ mr: 1, mb: 1 }}
              color='secondary'
            />
            <Chip
              label={profile.department || '—'}
              icon={<Business />}
              sx={{ mb: 1 }}
              color='info'
            />
            <Typography variant='body2' color='text.secondary' mt={1}>
              <Email sx={{ fontSize: 16, mr: 0.5 }} /> {profile.email}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} /> Joined:{' '}
              {new Date(profile.joinedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Recent Attendance Table */}
      <Paper
        elevation={1}
        sx={{ borderRadius: 3, p: 3, bgcolor: 'background.paper', mb: 4 }}
      >
        <Typography
          variant='h6'
          fontWeight={600}
          gutterBottom
          color='primary.main'
        >
          Recent Attendance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size='small' sx={{ minWidth: 350 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(76, 175, 80, 0.08)' }}>
                <TableCell>Date</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Worked Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(profile.attendanceSummary || [])
                .slice(0, 5)
                .map(
                  (
                    log: EmployeeProfileAttendanceSummaryItem,
                    index: number
                  ) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor:
                          index % 2 === 0 ? 'background.default' : 'grey.50',
                      }}
                    >
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{formatTime(log.checkIn)}</TableCell>
                      <TableCell>{formatTime(log.checkOut)}</TableCell>
                      <TableCell>{log.workedHours ?? 0}h</TableCell>
                    </TableRow>
                  )
                )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Leave History Table */}
      <Paper
        elevation={1}
        sx={{ borderRadius: 3, p: 3, bgcolor: 'background.paper' }}
      >
        <Typography
          variant='h6'
          fontWeight={600}
          gutterBottom
          color='primary.main'
        >
          Leave History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size='small' sx={{ minWidth: 350 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(33, 150, 243, 0.08)' }}>
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(profile.leaveHistory || [])
                .slice(0, 5)
                .map((lv: EmployeeProfileLeaveHistoryItem, idx: number) => (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor:
                        idx % 2 === 0 ? 'background.default' : 'grey.50',
                    }}
                  >
                    <TableCell>{lv.type}</TableCell>
                    <TableCell>{lv.fromDate}</TableCell>
                    <TableCell>{lv.toDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={lv.status}
                        sx={{
                          bgcolor:
                            lv.status === 'approved'
                              ? 'success.main'
                              : lv.status === 'Pending'
                                ? 'primary.dark'
                                : 'error.main',
                          color: '#fff',
                          fontWeight: 600,
                        }}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default EmployeeProfileView;
