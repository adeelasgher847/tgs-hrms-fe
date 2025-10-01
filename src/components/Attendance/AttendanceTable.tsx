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
  
  Button,
  Pagination,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import attendanceApi from '../../api/attendanceApi';
import { exportCSV } from '../../api/exportApi';
import { isManager as checkIsManager, isAdmin } from '../../utils/roleUtils';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInISO: string | null;
  checkOutISO: string | null;
  checkIn: string | null;
  checkOut: string | null;
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
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminView, setAdminView] = useState<'my' | 'all'>('my');
  const [managerView, setManagerView] = useState<'my' | 'team'>('my');
  const [tab, setTab] = useState(0);
  const [teamAttendance, setTeamAttendance] = useState<AttendanceEvent[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalPages, setTeamTotalPages] = useState(1);
  const [teamTotalItems, setTeamTotalItems] = useState(0);

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;

  /** ----------- EVENT BUILDER ---------- */
  const buildFromEvents = (
    eventsRaw: AttendanceEvent[],
    currentUserId: string,
    isAllAttendance: boolean = false
  ): AttendanceRecord[] => {
    const events = eventsRaw
      .filter(e => e && (e as any).timestamp && (e as any).type)
      .map(e => ({
        id: (e as any).id,
        user_id: (e as any).user_id || (isAllAttendance ? null : currentUserId),
        timestamp: (e as any).timestamp,
        type: (e as any).type as 'check-in' | 'check-out',
        user: (e as any).user,
      }))
      .filter(e => e.user_id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const sessions: AttendanceRecord[] = [];
    const userEvents = new Map<string, typeof events>();

    for (const ev of events) {
      if (!userEvents.has(ev.user_id)) userEvents.set(ev.user_id, []);
      userEvents.get(ev.user_id)!.push(ev);
    }

    for (const [userId, userEventList] of userEvents.entries()) {
      const openSessions: any[] = [];
      for (const event of userEventList) {
        if (event.type === 'check-in') {
          openSessions.push({ checkIn: event, checkOut: null });
        } else if (event.type === 'check-out') {
          const lastOpen = openSessions.find(s => !s.checkOut);
          if (lastOpen) lastOpen.checkOut = event;
        }
      }

      for (const session of openSessions) {
        const checkInDate = new Date(session.checkIn.timestamp);
        const shiftDate = formatLocalYMD(checkInDate);
        let workedHours = null;
        let checkOutISO = null;
        let checkOutDisplay = null;

        if (session.checkOut) {
          checkOutISO = session.checkOut.timestamp;
          checkOutDisplay = toDisplayTime(checkOutISO);
          const inTime = new Date(session.checkIn.timestamp).getTime();
          const outTime = new Date(checkOutISO).getTime();
          if (outTime > inTime) workedHours = +((outTime - inTime) / 3600000).toFixed(2);
        }

        sessions.push({
          id: `${session.checkIn.id}-${session.checkOut ? session.checkOut.id : 'open'}`,
          userId,
          date: shiftDate,
          checkInISO: session.checkIn.timestamp,
          checkOutISO,
          checkIn: toDisplayTime(session.checkIn.timestamp),
          checkOut: checkOutDisplay,
          workedHours,
          user: { first_name: session.checkIn.user?.first_name || 'N/A' },
        });
      }
    }

    return sessions.sort((a, b) =>
      a.date !== b.date
        ? a.date < b.date ? 1 : -1
        : (b.checkInISO ? new Date(b.checkInISO).getTime() : 0) -
          (a.checkInISO ? new Date(a.checkInISO).getTime() : 0)
    );
  };

  /** ----------- FETCHING ---------- */
  const fetchAttendance = async (
    page: number = 1,
    view?: 'my' | 'all',
    selectedUserId?: string,
    startDateOverride?: string,
    endDateOverride?: string
  ) => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const currentUser = JSON.parse(storedUser);
      const roleName = (currentUser.role?.name || currentUser.role || '').toString();
      setUserRole(roleName);
      const isManagerFlag = checkIsManager(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      setIsManager(isManagerFlag);
      setIsAdminUser(isAdminFlag);

      const effectiveView = view ?? adminView;
      const effectiveSelectedEmployee = selectedUserId ?? selectedEmployee;
      const effectiveStartDate = startDateOverride ?? startDate;
      const effectiveEndDate = endDateOverride ?? endDate;

      let response: AttendanceResponse;
      if (isAdminFlag && effectiveView === 'all') {
        if (effectiveSelectedEmployee) {
          response = await attendanceApi.getAttendanceEvents(
            effectiveSelectedEmployee,
            page,
            effectiveStartDate || undefined,
            effectiveEndDate || undefined
          );
        } else {
          response = await attendanceApi.getAllAttendance(
            page,
            effectiveStartDate || undefined,
            effectiveEndDate || undefined
          );
        }
      } else {
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          page,
          effectiveStartDate || undefined,
          effectiveEndDate || undefined
        );
      }

      setCurrentPage(page);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || 0);

      const events: AttendanceEvent[] = (response.items as AttendanceEvent[]) || [];
      const rows = buildFromEvents(events, currentUser.id, isAdminFlag && effectiveView === 'all');
      setAttendanceData(rows);
      setFilteredData(rows);
    } catch {
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  /** ----------- EFFECTS ---------- */
  useEffect(() => {
    fetchAttendance(1, 'my');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let data = [...attendanceData];
    if (selectedEmployee) {
      data = data.filter(r => r.userId === selectedEmployee);
    }
    setFilteredData(data);
  }, [attendanceData, selectedEmployee]);

  /** ----------- RENDER ---------- */
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike = userRoleLc === 'admin' || userRoleLc === 'system_admin';
  const token = localStorage.getItem('token');
  const filters = { page: '1' };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      {/* Admin Toggle */}
      {isAdminLike && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={adminView === 'my' ? 'contained' : 'outlined'}
            onClick={() => fetchAttendance(1, 'my')}
          >
            My Attendance
          </Button>
          <Button
            variant={adminView === 'all' ? 'contained' : 'outlined'}
            onClick={() => fetchAttendance(1, 'all')}
          >
            All Attendance
          </Button>
        </Box>
      )}

      {/* Export Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {isAdminUser && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => exportCSV('/attendance/export/all', 'attendance-all.csv', token, filters)}
          >
            Export All Attendance CSV
          </Button>
        )}
        {isManager && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => exportCSV('/attendance/export/team', 'attendance-team.csv', token, filters)}
          >
            Export Team Attendance CSV
          </Button>
        )}
        {!isAdminUser && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => exportCSV('/attendance/export/self', 'attendance-self.csv', token, filters)}
          >
            Export My Attendance CSV
          </Button>
        )}
      </Box>

      {/* Attendance Table */}
      <Paper sx={{ mt: 3, background: 'unset', boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {isAdminLike && adminView === 'all' && <TableCell>Employee</TableCell>}
                <TableCell>Date</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Worked Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdminLike ? 5 : 4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map(record => (
                  <TableRow key={record.id}>
                    {isAdminLike && adminView === 'all' && <TableCell>{record.user?.first_name}</TableCell>}
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkIn || '--'}</TableCell>
                    <TableCell>{record.checkOut || '--'}</TableCell>
                    <TableCell>{record.workedHours ?? '--'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdminLike ? 5 : 4} align="center">
                    No records found
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
