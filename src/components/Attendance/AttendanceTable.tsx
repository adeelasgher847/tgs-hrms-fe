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
import DatePicker from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';
import './AttendanceTable.css';
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
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );
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
      // Aggregate all unique employees from all attendance pages
      let page = 1;
      let totalPages = 1;
      const uniqueEmployees = new Map();

      do {
        const attendanceResponse = await attendanceApi.getAllAttendance(page);
        if (attendanceResponse && attendanceResponse.items) {
          attendanceResponse.items.forEach((item: any) => {
            if (item.user_id && item.user?.first_name) {
              const employeeId = item.user_id;
              const employeeName =
                item.user.first_name +
                (item.user.last_name ? ` ${item.user.last_name}` : '');
              if (!uniqueEmployees.has(employeeId)) {
                uniqueEmployees.set(employeeId, {
                  id: employeeId,
                  name: employeeName,
                });
              }
            }
          });
          totalPages = attendanceResponse.totalPages || 1;
        }
        page++;
      } while (page <= totalPages);

      setEmployees(Array.from(uniqueEmployees.values()));
    } catch (error) {
      setEmployees([]);
    }
  };

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
      const isManagerFlag = checkIsManager(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      setIsManager(isManagerFlag);
      setIsAdminUser(isAdminFlag);

      let response: AttendanceResponse;

      const effectiveView: 'my' | 'all' = view ?? adminView;
      const effectiveSelectedEmployee = selectedUserId ?? selectedEmployee;
      const effectiveStartDate = startDateOverride ?? startDate;
      const effectiveEndDate = endDateOverride ?? endDate;

      // Choose API explicitly based on effectiveView and admin privilege
      if (isAdminFlag && effectiveView === 'all') {
        if (effectiveSelectedEmployee) {
          // When a specific employee is selected, fetch events for that user
          response = await attendanceApi.getAttendanceEvents(
            effectiveSelectedEmployee,
            page,
            effectiveStartDate || undefined,
            effectiveEndDate || undefined
          );
        } else {
          // No employee selected: fetch all attendance with pagination/date filters
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

      const events: AttendanceEvent[] =
        (response.items as AttendanceEvent[]) || [];

      const rows = buildFromEvents(
        events,
        currentUser.id,
        isAdminFlag && effectiveView === 'all'
      );

      setAttendanceData(rows);
      setFilteredData(rows);
    } catch (error) {
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAttendance(page, isAdminUser ? adminView : 'my');
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
    fetchAttendance(1, 'my', undefined, '', '');
  };

  const handleAllAttendance = async () => {
    setAdminView('all');
    setCurrentPage(1);
    setSelectedEmployee('');
    setStartDate('');
    setEndDate('');

    // Fetch employees from attendance data first, then attendance
    await fetchEmployeesFromAttendance();
    fetchAttendance(1, 'all', undefined, '', '');
  };

  // Initial load
  useEffect(() => {
    fetchAttendance(1, 'my');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to convert YYYY-MM-DD -> Date at local midnight
  const ymdToLocalDate = (ymd: string) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  };

  // Separate effect for data filtering (only by selected employee; dates handled server-side)
  useEffect(() => {
    let data = [...attendanceData];

    if (selectedEmployee) {
      data = data.filter(rec => rec.userId === selectedEmployee);
    }

    setFilteredData(data);
  }, [attendanceData, selectedEmployee]);

  // Handle filter changes - reset page to 1 and fetch new data
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchAttendance(1, isAdminUser ? adminView : 'my');
  };

  // Handle employee filter change
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
    // Immediately pass the selected employee to avoid stale state in fetch
    fetchAttendance(1, 'all', value, startDate, endDate);
  };

  // Handle date filter changes
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(1);
    const view = isAdminUser ? adminView : 'my';
    const selectedId = view === 'all' ? selectedEmployee : undefined;
    fetchAttendance(1, view, selectedId, value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(1);
    const view = isAdminUser ? adminView : 'my';
    const selectedId = view === 'all' ? selectedEmployee : undefined;
    fetchAttendance(1, view, selectedId, startDate, value);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEmployee('');
    setCurrentPage(1);
    const view = isAdminUser ? adminView : 'my';
    fetchAttendance(1, view, undefined, '', '');
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
          <Typography variant='h6' gutterBottom mb={2}>
            {isAdminUser
              ? adminView === 'all'
                ? 'All Employees Attendance'
                : 'My Attendance'
              : 'Attendance Sessions'}
          </Typography>

          <Box
            display='flex'
            gap={2}
            mb={2}
            flexWrap='wrap'
            alignItems='center'
          >
            {/* Employee Dropdown - Only show for All Attendance */}
            {isAdminUser && adminView === 'all' && (
              <TextField
                label='Employee'
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
                <MenuItem value=''>All Employees</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

             {/* Date Range Filter - Always show */}
             <Box >
               <DatePicker
                 range
                 numberOfMonths={2}
                 value={startDate && endDate ? [new Date(startDate), new Date(endDate)] : startDate ? [new Date(startDate)] : []}
                 onChange={(dates) => {
                   console.log('DatePicker onChange:', dates);
                   if (dates && dates.length === 2) {
                     const start = dates[0]?.format('YYYY-MM-DD') || '';
                     const end = dates[1]?.format('YYYY-MM-DD') || '';
                     console.log('Setting dates:', { start, end });
                     setStartDate(start);
                     setEndDate(end);
                     // Trigger the filter change
                     setCurrentPage(1);
                     const view = isAdminUser ? adminView : 'my';
                     const selectedId = view === 'all' ? selectedEmployee : undefined;
                     fetchAttendance(1, view, selectedId, start, end);
                   } else if (dates && dates.length === 1) {
                     const start = dates[0]?.format('YYYY-MM-DD') || '';
                     console.log('Setting start date only:', start);
                     setStartDate(start);
                     setEndDate('');
                     // Trigger the filter change
                     setCurrentPage(1);
                     const view = isAdminUser ? adminView : 'my';
                     const selectedId = view === 'all' ? selectedEmployee : undefined;
                     fetchAttendance(1, view, selectedId, start, '');
                   } else {
                     console.log('Clearing dates');
                     setStartDate('');
                     setEndDate('');
                     // Trigger the filter change
                     setCurrentPage(1);
                     const view = isAdminUser ? adminView : 'my';
                     const selectedId = view === 'all' ? selectedEmployee : undefined;
                     fetchAttendance(1, view, selectedId, '', '');
                   }
                 }}
                 format="MM/DD/YYYY"
                 placeholder="Start Date - End Date"
                 style={{
                   width: '100%',
                   height: '40px',
                   padding: '6.5px 14px',
                   border: '1px solid rgba(0, 0, 0, 0.23)',
                   borderRadius: '4px',
                   fontSize: '16px',
                   fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                   backgroundColor: 'transparent',
                   outline: 'none',
                 }}
                 containerStyle={{
                   width: '100%',
                 }}
                 inputClass="custom-date-picker-input"
                 className="custom-date-picker"
                 editable={false}
                 showOtherDays={true}
                 onOpen={() => {
                   // Prevent body scroll when calendar opens
                   document.body.style.overflow = 'hidden';
                 }}
                 onClose={() => {
                   // Restore body scroll when calendar closes
                   document.body.style.overflow = 'auto';
                 }}
               />
             </Box>

            <Button variant='outlined' onClick={clearFilters}>
              Clear Filter
            </Button>
          </Box>

          <Paper elevation={3} sx={{ boxShadow: 'none' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {isAdminLike && adminView === 'all' && (
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
                      <TableCell
                        colSpan={isAdminLike && adminView === 'all' ? 5 : 4}
                        align='center'
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    filteredData.map(record => (
                      <TableRow key={record.id}>
                        {isAdminLike && adminView === 'all' && (
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
                      <TableCell
                        colSpan={isAdminLike && adminView === 'all' ? 5 : 4}
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

      {/* Team Attendance Tab Content (Only for Managers, not Admins) */}
      {tab === 1 && isManager && !isAdminUser && (
        <Box>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
          >
            <Typography variant='h6'>Team Attendance</Typography>
          </Box>

          {teamLoading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : teamError ? (
            <Box display='flex' justifyContent='center' py={4}>
              <Typography color='error'>{teamError}</Typography>
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
                          <TableCell colSpan={5} align='center'>
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
