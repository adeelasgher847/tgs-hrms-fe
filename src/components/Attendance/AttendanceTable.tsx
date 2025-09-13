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
  MenuItem,
} from '@mui/material';
import attendanceApi from '../../api/attendanceApi';
import employeeApi from '../../api/employeeApi';
import type {
  AttendanceEvent,
  AttendanceResponse,
} from '../../api/attendanceApi';
import { isManager as checkIsManager, isAdmin } from '../../utils/roleUtils';

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

  // Admin view state
  const [adminView, setAdminView] = useState<'my' | 'all'>('my');
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [tab, setTab] = useState(0); // 0: My Attendance, 1: Team Attendance
  const [teamAttendance, setTeamAttendance] = useState<AttendanceEvent[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [isManager, setIsManager] = useState(false);

  // Team attendance pagination state
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalPages, setTeamTotalPages] = useState(1);
  const [teamTotalItems, setTeamTotalItems] = useState(0);

  // Employee filter
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;

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
      .filter(e => e.user_id) // Filter out events without user_id for "All Attendance"
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
      const dt = new Date((ev as any).timestamp);
      const date = formatLocalYMD(dt); // LOCAL date (no UTC shift)
      const key = `${(ev as any).user_id}_${date}`;
      if (!openByKey.has(key))
        openByKey.set(key, { checkIn: null, user: (ev as any).user });
      const bucket = openByKey.get(key)!;
      
      if ((ev as any).type === 'check-in') {
        // If a previous check-in wasn't closed, push it as an open session
        if (bucket.checkIn) {
          sessions.push({
            id: `${(bucket.checkIn as any).id}-open`,
            userId: (ev as any).user_id,
            date,
            checkInISO: (bucket.checkIn as any).timestamp,
            checkOutISO: null,
            checkIn: toDisplayTime((bucket.checkIn as any).timestamp),
            checkOut: null,
            workedHours: null,
            user: { first_name: (ev as any).user?.first_name || 'N/A' },
          });
        }
        bucket.checkIn = ev as unknown as AttendanceEvent;
        bucket.user = (ev as any).user;
      } else if ((ev as any).type === 'check-out') {
        if (
          bucket.checkIn &&
          new Date((ev as any).timestamp) >
            new Date((bucket.checkIn as any).timestamp)
        ) {
          const inISO = (bucket.checkIn as any).timestamp;
          const outISO = (ev as any).timestamp;
          const worked = parseFloat(
            (
              (new Date(outISO).getTime() - new Date(inISO).getTime()) /
              3600000
            ).toFixed(2)
          );
          sessions.push({
            id: `${(bucket.checkIn as any).id}-${(ev as any).id}`,
            userId: (ev as any).user_id,
            date,
            checkInISO: inISO,
            checkOutISO: outISO,
            checkIn: toDisplayTime(inISO),
            checkOut: toDisplayTime(outISO),
            workedHours: worked,
            user: { first_name: (ev as any).user?.first_name || 'N/A' },
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
          id: `${(val.checkIn as any).id}-open`,
          userId,
          date,
          checkInISO: (val.checkIn as any).timestamp,
          checkOutISO: null,
          checkIn: toDisplayTime((val.checkIn as any).timestamp),
          checkOut: null,
          workedHours: null,
          user: { first_name: (val.checkIn as any).user?.first_name || 'N/A' },
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

      setTeamAttendance(response.items || []);

      // Update pagination state
      setTeamCurrentPage(response.page || 1);
      setTeamTotalPages(response.totalPages || 1);
      setTeamTotalItems(response.total || 0);
    } catch {
      setTeamError('Failed to load team attendance');
      setTeamAttendance([]);
      setTeamCurrentPage(1);
      setTeamTotalPages(1);
      setTeamTotalItems(0);
    } finally {
      setTeamLoading(false);
    }
  };

  // Fetch employees from attendance data
  const fetchEmployeesFromAttendance = async () => {
    try {
      console.log('Fetching employees from attendance data...');
      
      // Get all attendance data to extract unique employees
      const attendanceResponse = await attendanceApi.getAllAttendance(1);
      
      if (attendanceResponse && attendanceResponse.items) {
        const uniqueEmployees = new Map();
        
        // Extract unique employees from attendance data
        attendanceResponse.items.forEach((item: any) => {
          if (item.user_id && item.user?.first_name) {
            const employeeId = item.user_id;
            const employeeName = item.user.first_name + (item.user.last_name ? ` ${item.user.last_name}` : '');
            
            // Only add if not already added
            if (!uniqueEmployees.has(employeeId)) {
              uniqueEmployees.set(employeeId, {
                id: employeeId,
                name: employeeName
              });
            }
          }
        });
        
        const employeeList = Array.from(uniqueEmployees.values());
        console.log('Employees from attendance:', employeeList);
        setEmployees(employeeList);
      } else {
        console.log('No attendance data found');
        setEmployees([]);
      }
      
    } catch (error) {
      console.error('Error fetching employees from attendance:', error);
      setEmployees([]);
    }
  };

  const fetchAttendance = async (page: number = 1) => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(storedUser);
      const roleName = (
        currentUser.role?.name ||
        currentUser.role ||
        ''
      ).toString();
      const roleLc = roleName.toLowerCase();
      setUserRole(roleName);
      setIsManager(checkIsManager(currentUser.role));
      setIsAdminUser(isAdmin(currentUser.role));

      let response: AttendanceResponse;

      // Admin logic: fetch based on selected view
      if (isAdminUser) {
        if (adminView === 'all') {
          response = await attendanceApi.getAllAttendance(
            page,
            startDate || undefined,
            endDate || undefined,
            selectedEmployee || undefined
          );
        } else {
          response = await attendanceApi.getAttendanceEvents(
            currentUser.id,
            page,
            startDate || undefined,
            endDate || undefined
          );
        }
      } else {
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          page,
          startDate || undefined,
          endDate || undefined
        );
      }

      setCurrentPage(page);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || 0);

      const events: AttendanceEvent[] = (response.items as AttendanceEvent[]) || [];
      
      const rows = buildFromEvents(
        events, 
        currentUser.id, 
        isAdminUser && adminView === 'all'
      );
      
      setAttendanceData(rows);
      setFilteredData(rows);

    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData([]);
      setFilteredData([]);
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

  // Handle admin view change - separate buttons
  const handleMyAttendance = () => {
    setAdminView('my');
    setCurrentPage(1);
    setSelectedEmployee('');
    setStartDate('');
    setEndDate('');
    fetchAttendance(1);
  };

  const handleAllAttendance = async () => {
    setAdminView('all');
    setCurrentPage(1);
    setSelectedEmployee('');
    setStartDate('');
    setEndDate('');
    
    // Fetch employees from attendance data first, then attendance
    await fetchEmployeesFromAttendance();
    fetchAttendance(1);
  };

  // Initial load
  useEffect(() => {
    fetchAttendance(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to convert YYYY-MM-DD -> Date at local midnight
  const ymdToLocalDate = (ymd: string) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  };

  // Separate effect for data filtering (without page reset)
  useEffect(() => {
    let data = [...attendanceData];

    // Employee filter
    if (selectedEmployee) {
      data = data.filter(rec => rec.userId === selectedEmployee);
    }

    // Date filters: compare using Date objects (local midnight)
    const start = startDate ? ymdToLocalDate(startDate) : null;
    const end = endDate ? ymdToLocalDate(endDate) : null;

    if (start) {
      data = data.filter(rec => {
        const recDate = ymdToLocalDate(rec.date);
        if (!recDate) return false;
        return recDate.getTime() >= start.getTime();
      });
    }
    if (end) {
      data = data.filter(rec => {
        const recDate = ymdToLocalDate(rec.date);
        if (!recDate) return false;
        return recDate.getTime() <= end.getTime();
      });
    }

    setFilteredData(data);
  }, [attendanceData, selectedEmployee, startDate, endDate]);

  // Handle filter changes - reset page to 1 and fetch new data
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchAttendance(1);
  };

  // Handle employee filter change
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
    fetchAttendance(1);
  };

  // Handle date filter changes
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(1);
    fetchAttendance(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(1);
    fetchAttendance(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEmployee('');
    setCurrentPage(1);
    fetchAttendance(1);
  };

  // Determine admin-like UI behavior (Admin or System-Admin)
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike =
    userRoleLc === 'admin' ||
    userRoleLc === 'system-admin' ||
    userRoleLc === 'system admin' ||
    userRoleLc === 'system_admin';

  return (
    <Box>
      {/* Admin View Buttons */}
      {isAdminUser && (
        <Box mb={3}>
          <Button
            variant={adminView === 'my' ? 'contained' : 'outlined'}
            onClick={handleMyAttendance}
            sx={{ mr: 2 }}
          >
            My Attendance
          </Button>
          <Button
            variant={adminView === 'all' ? 'contained' : 'outlined'}
            onClick={handleAllAttendance}
          >
            All Attendance
          </Button>
        </Box>
      )}

      {/* Regular Tab Navigation for Non-Admins */}
      {!isAdminUser && (
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
      )}

      {/* My Attendance Tab Content */}
      {(tab === 0 || isAdminUser) && (
        <>
          <Typography variant="h6" gutterBottom mb={2}>
            {isAdminUser 
              ? (adminView === 'all' ? 'All Employees Attendance' : 'My Attendance')
              : 'Attendance Sessions'
            }
          </Typography>

          <Box
            display="flex"
            gap={2}
            mb={2}
            flexWrap="wrap"
            alignItems="center"
          >
            {/* Employee Dropdown - Only show for All Attendance */}
            {isAdminUser && adminView === 'all' && (
              <TextField
                label="Employee"
                select
                value={selectedEmployee}
                onChange={e => handleEmployeeChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '6.5px 14px',
                  },
                  minWidth: 200,
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: value => {
                    if (value === '') {
                      return 'All Employees';
                    }
                    const emp = employees.find(e => e.id === value);
                    return emp ? emp.name : 'All Employees';
                  },
                }}
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Date Filters - Always show */}
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              sx={{
                '& .MuiInputBase-input': {
                  padding: '6.5px 14px',
                },
              }}
            />

            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
              sx={{
                '& .MuiInputBase-input': {
                  padding: '6.5px 14px',
                },
              }}
            />
            
            <Button variant="outlined" onClick={clearFilters}>
              Clear Filter
            </Button>
          </Box>
          
          <Paper elevation={3} sx={{ boxShadow: 'none' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {(isAdminLike && adminView === 'all') && (
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Employee Name
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Worked Hours
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={(isAdminLike && adminView === 'all') ? 5 : 4} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    filteredData.map(record => (
                      <TableRow key={record.id}>
                        {(isAdminLike && adminView === 'all') && (
                          <TableCell>
                            {record.user?.first_name || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>{record.date || '--'}</TableCell>
                        <TableCell>{record.checkIn || '--'}</TableCell>
                        <TableCell>{record.checkOut || '--'}</TableCell>
                        <TableCell>{record.workedHours ?? '--'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={(isAdminLike && adminView === 'all') ? 5 : 4} align="center">
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
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Pagination Info */}
          {totalItems > 0 && (
            <Box display="flex" justifyContent="center" mt={1}>
              <Typography variant="body2" color="textSecondary">
                Showing page {currentPage} of {totalPages} ({totalItems} total
                records)
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Team Attendance Tab Content (Only for Managers, not Admins) */}
      {tab === 1 && isManager && !isAdminUser && (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Team Attendance</Typography>
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
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Employee Name
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Designation
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Department
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Days Worked
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Hours Worked
                        </TableCell>
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
                          <TableRow key={(member as any).user_id}>
                            <TableCell>
                              {(member as any).first_name}{' '}
                              {(member as any).last_name}
                            </TableCell>
                            <TableCell>{(member as any).designation}</TableCell>
                            <TableCell>{(member as any).department}</TableCell>
                            <TableCell>
                              {(member as any).totalDaysWorked}
                            </TableCell>
                            <TableCell>
                              {(member as any).totalHoursWorked}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Pagination */}
              {teamTotalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={teamTotalPages}
                    page={teamCurrentPage}
                    onChange={(_, page) => handleTeamPageChange(page)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Pagination Info */}
              {teamTotalItems > 0 && (
                <Box display="flex" justifyContent="center" mt={1}>
                  <Typography variant="body2" color="textSecondary">
                    Showing page {teamCurrentPage} of {teamTotalPages} (
                    {teamTotalItems} total records)
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
