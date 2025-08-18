import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
  Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../../api/axiosInstance';
interface AttendanceEvent {
  id: string;
  user_id: string;
  timestamp: string; // ISO
  type: 'check-in' | 'check-out' | string;
  user?: { first_name?: string };
}
interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (local)
  checkInISO: string | null; // ISO for calc/sort
  checkOutISO: string | null; // ISO for calc/sort
  checkIn: string | null; // display
  checkOut: string | null; // display
  workedHours: number | null;
  user?: { first_name: string };
}
const formatLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;
  const buildFromEvents = (
    eventsRaw: AttendanceEvent[],
    currentUserId: string
  ): AttendanceRecord[] => {
    const events = eventsRaw
      .filter(e => e && e.timestamp && e.type)
      .map(e => ({
        id: e.id,
        user_id: (e as any).user_id || currentUserId,
        timestamp: e.timestamp,
        type: e.type as 'check-in' | 'check-out',
        user: e.user,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    const sessions: AttendanceRecord[] = [];
    const openByKey = new Map<
      string,
      { checkIn: AttendanceEvent | null; user?: { first_name?: string } }
    >();
    for (const ev of events) {
      const dt = new Date(ev.timestamp);
      const date = formatLocalYMD(dt); // LOCAL date (no UTC shift)
      const key = `${ev.user_id}_${date}`;
      if (!openByKey.has(key))
        openByKey.set(key, { checkIn: null, user: ev.user });
      const bucket = openByKey.get(key)!;
      if (ev.type === 'check-in') {
        // If a previous check-in wasn't closed, push it as an open session
        if (bucket.checkIn) {
          sessions.push({
            id: `${bucket.checkIn.id}-open`,
            userId: ev.user_id,
            date,
            checkInISO: bucket.checkIn.timestamp,
            checkOutISO: null,
            checkIn: toDisplayTime(bucket.checkIn.timestamp),
            checkOut: null,
            workedHours: null,
            user: { first_name: ev.user?.first_name || 'N/A' },
          });
        }
        bucket.checkIn = ev;
        bucket.user = ev.user;
      } else if (ev.type === 'check-out') {
        if (
          bucket.checkIn &&
          new Date(ev.timestamp) > new Date(bucket.checkIn.timestamp)
        ) {
          const inISO = bucket.checkIn.timestamp;
          const outISO = ev.timestamp;
          const worked = parseFloat(
            (
              (new Date(outISO).getTime() - new Date(inISO).getTime()) /
              3600000
            ).toFixed(2)
          );
          sessions.push({
            id: `${bucket.checkIn.id}-${ev.id}`,
            userId: ev.user_id,
            date,
            checkInISO: inISO,
            checkOutISO: outISO,
            checkIn: toDisplayTime(inISO),
            checkOut: toDisplayTime(outISO),
            workedHours: worked,
            user: { first_name: ev.user?.first_name || 'N/A' },
          });
          bucket.checkIn = null;
        }
      }
    }
    // Flush any open sessions without checkout
    for (const [key, val] of openByKey.entries()) {
      if (val.checkIn) {
        const [userId, date] = key.split('_');
        sessions.push({
          id: `${val.checkIn.id}-open`,
          userId,
          date,
          checkInISO: val.checkIn.timestamp,
          checkOutISO: null,
          checkIn: toDisplayTime(val.checkIn.timestamp),
          checkOut: null,
          workedHours: null,
          user: { first_name: val.checkIn.user?.first_name || 'N/A' },
        });
      }
    }
    // Sort by date (desc) then time (desc)
    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1; // string compare
      const at = a.checkInISO ? new Date(a.checkInISO).getTime() : 0;
      const bt = b.checkInISO ? new Date(b.checkInISO).getTime() : 0;
      return bt - at;
    });
    return sessions;
  };
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);
      setUserRole(currentUser.role.name);
      // Admin: raw events across tenant; User: raw events for self
      const endpoint =
        currentUser.role.name === 'Admin'
          ? '/attendance/all'
          : `/attendance/events?userId=${currentUser.id}`;
      const res = await axiosInstance.get(endpoint);
      const events: AttendanceEvent[] = res.data || [];
      const rows = buildFromEvents(events, currentUser.id);
      setAttendanceData(rows);
      setFilteredData(rows);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(':x: Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAttendance();
  }, []);
  useEffect(() => {
    let data = [...attendanceData];
    if (startDate) data = data.filter(rec => rec.date >= startDate); // string compare
    if (endDate) data = data.filter(rec => rec.date <= endDate); // string compare
    setFilteredData(data);
  }, [startDate, endDate, attendanceData]);
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };
  return (
    <Box p={2}>
      <Typography variant='h6' gutterBottom>
        Attendance Sessions
      </Typography>
      <Box display='flex' gap={2} mb={2} flexWrap='wrap' alignItems='center'>
        <TextField
          label='Start Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <TextField
          label='End Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <Button variant='outlined' onClick={clearFilters}>
          Clear Filter
        </Button>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={fetchAttendance}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {userRole === 'Admin' && (
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Employee Name
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Worked Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map(record => (
                  <TableRow key={record.id}>
                    {userRole === 'Admin' && (
                      <TableCell>{record.user?.first_name || 'N/A'}</TableCell>
                    )}
                    <TableCell>{record.date || '--'}</TableCell>
                    <TableCell>{record.checkIn || '--'}</TableCell>
                    <TableCell>{record.checkOut || '--'}</TableCell>
                    <TableCell>{record.workedHours ?? '--'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={userRole === 'Admin' ? 5 : 4}
                    align='center'
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
export default AttendanceTable;
