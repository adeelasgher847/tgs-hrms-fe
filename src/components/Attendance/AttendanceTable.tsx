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
  Pagination,
  CircularProgress,
} from '@mui/material';
import attendanceApi from '../../api/attendanceApi';
import type {
  AttendanceEvent,
  AttendanceResponse,
} from '../../api/attendanceApi';
import { isManager as checkIsManager } from '../../utils/roleUtils';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [tab, setTab] = useState(0); // 0: My Attendance, 1: Team Attendance
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [isManager, setIsManager] = useState(false);
  
  // Team attendance pagination state
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalPages, setTeamTotalPages] = useState(1);
  const [teamTotalItems, setTeamTotalItems] = useState(0);

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

  const fetchTeamAttendance = async (page = 1) => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await attendanceApi.getTeamAttendance(page);
      console.log('✅ Team Attendance API Response:', response);
      
      setTeamAttendance(response.items || []);
      
      // Update pagination state
      setTeamCurrentPage(response.page || 1);
      setTeamTotalPages(response.totalPages || 1);
      setTeamTotalItems(response.total || 0);
    } catch (err) {
      console.error('❌ Error fetching team attendance:', err);
      setTeamError('Failed to load team attendance');
      setTeamAttendance([]);
      setTeamCurrentPage(1);
      setTeamTotalPages(1);
      setTeamTotalItems(0);
    } finally {
      setTeamLoading(false);
    }
  };


  const fetchAttendance = async (page: number = 1) => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const currentUser = JSON.parse(storedUser);
      const roleName = (currentUser.role?.name || currentUser.role || '').toString();
      const roleLc = roleName.toLowerCase();
      setUserRole(roleName);
      setIsManager(checkIsManager(currentUser.role));

      let response: AttendanceResponse;

      // Admin or System-Admin: raw events across tenant
      if (roleLc === 'admin' || roleLc === 'system-admin' || roleLc === 'system admin' || roleLc === 'system_admin') {
        response = await attendanceApi.getAllAttendance(page);
      } else {
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          page
        );
      }

      console.log('✅ AttendanceTable - API Response:', response);

      // Update pagination state
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);

      const events: AttendanceEvent[] =
        (response.items as AttendanceEvent[]) || [];
      const rows = buildFromEvents(events, currentUser.id);
      setAttendanceData(rows);
      setFilteredData(rows);
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAttendance(page);
  };

  // Handle team page change
  const handleTeamPageChange = (page: number) => {
    setTeamCurrentPage(page);
    fetchTeamAttendance(page);
  };

  useEffect(() => {
    fetchAttendance(1);
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

  // Determine admin-like UI behavior (Admin or System-Admin)
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike = userRoleLc === 'admin' || userRoleLc === 'system-admin' || userRoleLc === 'system admin' || userRoleLc === 'system_admin';

  return (
    <Box>
      <Box mb={2}>
        <Button
          variant={tab === 0 ? 'contained' : 'outlined'}
          onClick={() => setTab(0)}
        >
          My Attendance
        </Button>
        {isManager && (
          <Button
            variant={tab === 1 ? 'contained' : 'outlined'}
            onClick={() => {
              setTab(1);
              fetchTeamAttendance(1);
            }}
            sx={{ ml: 2 }}
          >
            Team Attendance
          </Button>
        )}
      </Box>
      {tab === 0 && (
        <>
          <Typography variant='h6' gutterBottom mb={2}>
            Attendance Sessions
          </Typography>

          <Box display='flex' gap={2} mb={2} flexWrap='wrap' alignItems='center'>
   <TextField
  label="Start Date"
  type="date"
  InputLabelProps={{ shrink: true }}
  value={startDate}
  onChange={e => setStartDate(e.target.value)}
  sx={{
    "& .MuiInputBase-input": {
      padding: "6.5px 14px",
    },
  }}
/>

        <TextField
          label='End Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
            sx={{
    "& .MuiInputBase-input": {
      padding: "6.5px 14px",
    },
  }}
        />
        <Button variant='outlined' onClick={clearFilters}>
          Clear Filter
        </Button>
      </Box>
      <Paper elevation={3} sx={{ boxShadow: 'none'}}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {isAdminLike && (
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdminLike ? 5 : 4}
                    align='center'
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map(record => (
                  <TableRow key={record.id}>
                    {isAdminLike && (
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
                    colSpan={isAdminLike ? 5 : 4}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => handlePageChange(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {totalPages} ({totalItems} total
            records)
          </Typography>
        </Box>
      )}
    </>
      )}
      {tab === 1 && isManager && (
        <Box>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6'>
              Team Attendance
            </Typography>
           
          </Box>
          
          {teamLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : teamError ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Typography color="error">{teamError}</Typography>
            </Box>
          ) : (
            <>
              <Paper elevation={3} sx={{ boxShadow: 'none' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Days Worked</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Hours Worked</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamAttendance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No team attendance records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamAttendance.map(member => (
                          <TableRow key={member.user_id}>
                            <TableCell>
                              {member.first_name} {member.last_name}
                            </TableCell>
                            <TableCell>{member.designation}</TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell>{member.totalDaysWorked}</TableCell>
                            <TableCell>{member.totalHoursWorked}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Pagination */}
              {teamTotalPages > 1 && (
                <Box display='flex' justifyContent='center' mt={2}>
                  <Pagination
                    count={teamTotalPages}
                    page={teamCurrentPage}
                    onChange={(_, page) => handleTeamPageChange(page)}
                    color='primary'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Pagination Info */}
              {teamTotalItems > 0 && (
                <Box display='flex' justifyContent='center' mt={1}>
                  <Typography variant='body2' color='textSecondary'>
                    Showing page {teamCurrentPage} of {teamTotalPages} ({teamTotalItems} total
                    records)
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AttendanceTable;
