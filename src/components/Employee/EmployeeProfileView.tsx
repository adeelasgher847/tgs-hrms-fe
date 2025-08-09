import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import employeeApi from '../../api/employeeApi';
import type { EmployeeFullProfile, EmployeeProfileAttendanceSummaryItem, EmployeeProfileLeaveHistoryItem } from '../../api/employeeApi';

const EmployeeProfileView: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const base64UrlDecode = (str: string): string => {
    // Convert from base64url to base64
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad string length to multiple of 4
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
      // Try common keys that may contain employee id
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

  // Determine which user to load: prefer token payload; fallback to localStorage user
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
    return isNaN(d.getTime()) ? String(iso) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Box py={3}><Typography>Loading profile...</Typography></Box>
    );
  }

  if (error) {
    return (
      <Box py={3}><Typography color="error">{error}</Typography></Box>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Box py={3}>
      {/* Profile Section */}
      <Card sx={{ mb: 1, borderRadius: 2, border: '1px solid #f0f0f0', backgroundcolor: ' #fff ', boxShadow: 'none' }}>
        <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center">
            <Avatar src={''} sx={{ width: 90, height: 90, mr: { sm: 2 }, mb: { xs: 2, sm: 0 } }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>{profile.name}</Typography>
              <Typography variant="subtitle1" color="textSecondary">{profile.designation || '—'}</Typography>
              <Typography variant="subtitle2" color="textSecondary">{profile.department || '—'}</Typography>
              <Typography variant="body2" color="textSecondary">{profile.email}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Logs */}
      <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 'none', border: '1px solid #f0f0f0', backgroundcolor: ' #fff ' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Recent Attendance</Typography>
          {(profile.attendanceSummary || []).slice(0, 5).map((log: EmployeeProfileAttendanceSummaryItem, index: number) => (
            <Box key={index} display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2">{log.date}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {`${formatTime(log.checkIn)} - ${formatTime(log.checkOut)} (${log.workedHours ?? 0}h)`}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Leave Summary */}
      <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #f0f0f0', backgroundcolor: ' #fff ' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Leave History</Typography>
          {(profile.leaveHistory || []).slice(0, 5).map((lv: EmployeeProfileLeaveHistoryItem, idx: number) => (
            <Box key={idx} display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2">{lv.type}</Typography>
              <Typography variant="body2" color="textSecondary">{lv.fromDate} → {lv.toDate}</Typography>
              <Typography variant="body2" fontWeight="bold">{lv.status}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeProfileView;
