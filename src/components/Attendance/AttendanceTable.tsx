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
import { exportCSV } from '../../api/exportApi';
import type {
  AttendanceEvent,
  AttendanceResponse,
} from '../../api/attendanceApi';
import { isManager as checkIsManager, isAdmin } from '../../utils/roleUtils';
import DateNavigation from './DateNavigation';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (shift date)
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
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminView, setAdminView] = useState<'my' | 'all'>('my');
  const [managerView, setManagerView] = useState<'my' | 'team'>('my');
  const [tab, setTab] = useState(0); // 0: My Attendance, 1: Team Attendance
  const [teamAttendance, setTeamAttendance] = useState<AttendanceEvent[]>([]);
  const [filteredTeamAttendance, setFilteredTeamAttendance] = useState<AttendanceEvent[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalPages, setTeamTotalPages] = useState(1);
  const [teamTotalItems, setTeamTotalItems] = useState(0);
  
  // Date navigation state for All Attendance and Team Attendance
  const [currentNavigationDate, setCurrentNavigationDate] = useState('all');
  const [teamCurrentNavigationDate, setTeamCurrentNavigationDate] = useState('all');

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;
   const token = localStorage.getItem('token');
   const filters = { page: '1' };

  // Function to handle daily summaries from backend (cross-day compatible)
  const buildFromSummaries = (
    summariesRaw: any[],
    currentUserId: string,
    isAllAttendance: boolean = false
  ): AttendanceRecord[] => {
    return summariesRaw.map((summary: any) => ({
      id: `${summary.date}-${currentUserId}`,
      userId: currentUserId,
      date: summary.date,
      checkInISO: summary.checkIn,
      checkOutISO: summary.checkOut,
      checkIn: summary.checkIn ? toDisplayTime(summary.checkIn) : null,
      checkOut: summary.checkOut ? toDisplayTime(summary.checkOut) : null,
      workedHours: summary.workedHours || null,
      user: { first_name: 'Current User' }, // Will be updated from API response
    }));
  };

  // UPDATED: Function to handle events-based data with proper cross-day support
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
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    const sessions: AttendanceRecord[] = [];

    // Group events by user for cross-day compatibility
    const userEvents = new Map<
      string,
      Array<{
        id: string;
        timestamp: string;
        type: 'check-in' | 'check-out';
        user?: { first_name?: string };
      }>
    >();

    // Group events by user
    for (const ev of events) {
      const userId = (ev as any).user_id;
      if (!userEvents.has(userId)) {
        userEvents.set(userId, []);
      }
      userEvents.get(userId)!.push({
        id: (ev as any).id,
        timestamp: (ev as any).timestamp,
        type: (ev as any).type,
        user: (ev as any).user,
      });
    }

    // Process each user's events chronologically
    for (const [userId, userEventList] of userEvents.entries()) {
      const openSessions: Array<{
        checkIn: {
          id: string;
          timestamp: string;
          user?: { first_name?: string };
        };
        checkOut: { id: string; timestamp: string } | null;
      }> = [];

      for (const event of userEventList) {
        if (event.type === 'check-in') {
          // Add new open session
          openSessions.push({
            checkIn: {
              id: event.id,
              timestamp: event.timestamp,
              user: event.user,
            },
            checkOut: null,
          });
        } else if (event.type === 'check-out') {
          // Find the most recent open session (last check-in without check-out)
          const lastOpenIndex = openSessions.findIndex(
            session => !session.checkOut
          );

          if (lastOpenIndex !== -1) {
            // Close the most recent open session
            openSessions[lastOpenIndex].checkOut = {
              id: event.id,
              timestamp: event.timestamp,
            };
          }
          // If no open session found, we ignore orphaned check-outs
        }
      }

      // Convert sessions to AttendanceRecord format
      for (const session of openSessions) {
        const checkInDate = new Date(session.checkIn.timestamp);
        const shiftDate = formatLocalYMD(checkInDate); // Use check-in date as the shift date

        let workedHours = null;
        let checkOutISO = null;
        let checkOutDisplay = null;

        if (session.checkOut) {
          checkOutISO = session.checkOut.timestamp;
          checkOutDisplay = toDisplayTime(checkOutISO);

          const inTime = new Date(session.checkIn.timestamp).getTime();
          const outTime = new Date(checkOutISO).getTime();

          if (outTime > inTime) {
            workedHours = parseFloat(((outTime - inTime) / 3600000).toFixed(2));
          }
        }

        sessions.push({
          id: `${session.checkIn.id}-${session.checkOut ? session.checkOut.id : 'open'}`,
          userId,
          date: shiftDate, // This will be the check-in date
          checkInISO: session.checkIn.timestamp,
          checkOutISO,
          checkIn: toDisplayTime(session.checkIn.timestamp),
          checkOut: checkOutDisplay,
          workedHours,
          user: { first_name: session.checkIn.user?.first_name || 'N/A' },
        });
      }
    }

    // Sort by date (desc) then time (desc)
    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
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
      setFilteredTeamAttendance(response.items || []);

      // Update pagination state
      setTeamCurrentPage(response.page || 1);
      setTeamTotalPages(response.totalPages || 1);
      setTeamTotalItems(response.total || 0);
    } catch {
      setTeamError('Failed to load team attendance');
      setTeamAttendance([]);
      setFilteredTeamAttendance([]);
      setTeamCurrentPage(1);
      setTeamTotalPages(1);
      setTeamTotalItems(0);
    } finally {
      setTeamLoading(false);
    }
  };

  // Fetch attendance data for a specific date (for date navigation)
  const fetchAttendanceByDate = async (date: string, view: 'all' | 'team') => {
    if (view === 'all') {
      setLoading(true);
    } else {
      setTeamLoading(true);
    }
    
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        if (view === 'all') {
          setLoading(false);
        } else {
          setTeamLoading(false);
        }
        return;
      }

      const currentUser = JSON.parse(storedUser);
      let response: AttendanceResponse;

      if (view === 'all') {
        response = await attendanceApi.getAllAttendance(
          1, // Always page 1 for date-based fetching
          date, // Start date
          date  // End date (same day)
        );
        
        const events: AttendanceEvent[] = (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];
        
        // Check if response contains shift-based data or events
        const isShiftBased = events.length > 0 && events[0] && 
          (events[0] as any).date && 
          (events[0] as any).checkIn !== undefined;

        if (isShiftBased) {
          rows = buildFromSummaries(events, currentUser.id, true);
        } else {
          rows = buildFromEvents(events, currentUser.id, true);
        }

        setAttendanceData(rows);
        setFilteredData(rows);
        
        // Set pagination state for date-filtered results
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(rows.length);
      } else {
        // For Team Attendance, we'll keep the existing team attendance logic
        // but could be modified to fetch by date if the API supports it
        const teamResponse = await attendanceApi.getTeamAttendance(1);
        // Convert to AttendanceResponse format
        response = {
          items: teamResponse.items,
          total: teamResponse.total,
          page: teamResponse.page,
          limit: 10, // Default limit
          totalPages: teamResponse.totalPages,
        };
        setTeamAttendance((response.items as AttendanceEvent[]) || []);
      }
    } catch (error) {
      if (view === 'all') {
        setAttendanceData([]);
        setFilteredData([]);
      } else {
        setTeamAttendance([]);
      }
    } finally {
      if (view === 'all') {
        setLoading(false);
      } else {
        setTeamLoading(false);
      }
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
    endDateOverride?: string,
    showAllRecords: boolean = false
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

      // UPDATED: Use getAttendanceEvents for all attendance fetching
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
          if (showAllRecords) {
            // Fetch all records without pagination for All Attendance view
            response = await attendanceApi.getAllAttendance(
              1, // Always page 1 when showing all
              undefined, // No date filters
              undefined
            );
          } else {
            response = await attendanceApi.getAllAttendance(
              page,
              effectiveStartDate || undefined,
              effectiveEndDate || undefined
            );
          }
        }
      } else {
        // For non-admins or 'my' view, fetch events for the current user
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          page,
          effectiveStartDate || undefined,
          effectiveEndDate || undefined
        );
      }

      if (showAllRecords) {
        // When showing all records, set pagination to show everything on one page
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(response.total || 0);
      } else {
        setCurrentPage(page);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.total || 0);
      }

      const events: AttendanceEvent[] =
        (response.items as AttendanceEvent[]) || [];

      // Check if response contains shift-based data or events
      const isShiftBased =
        events.length > 0 &&
        events[0] &&
        (events[0] as any).date &&
        (events[0] as any).checkIn !== undefined;

      let rows: AttendanceRecord[];

      if (isShiftBased) {
        // Handle shift-based data from backend
        rows = buildFromSummaries(
          events,
          currentUser.id,
          isAdminFlag && effectiveView === 'all'
        );
      } else {
        // Handle events-based data (primary method)
        rows = buildFromEvents(
          events,
          currentUser.id,
          isAdminFlag && effectiveView === 'all'
        );
      }

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

  // Handle date navigation changes
  const handleDateNavigationChange = (newDate: string) => {
    setCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all records (no pagination)
      fetchAttendance(1, 'all', selectedEmployee, '', '', true);
    } else {
      fetchAttendanceByDate(newDate, 'all');
    }
  };

  const handleTeamDateNavigationChange = (newDate: string) => {
    setTeamCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all team records
      setFilteredTeamAttendance(teamAttendance);
    } else {
      // Filter team records for specific date
      const filtered = teamAttendance.map(member => {
        const filteredAttendance = (member as any).attendance?.filter((att: any) => att.date === newDate) || [];
        return {
          ...member,
          attendance: filteredAttendance
        };
      }).filter(member => (member as any).attendance.length > 0);
      setFilteredTeamAttendance(filtered);
    }
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
    // Reset to show all records for date navigation
    setCurrentNavigationDate('all');

    // Fetch employees from attendance data first, then attendance
    await fetchEmployeesFromAttendance();
    // Show all records initially (no date filtering)
    fetchAttendance(1, 'all', undefined, '', '', true);
  };

  // Handle manager view change - separate buttons
  const handleManagerMyAttendance = () => {
    setManagerView('my');
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    fetchAttendance(1, 'my', undefined, '', '');
  };

  const handleManagerTeamAttendance = () => {
    setManagerView('team');
    setTeamCurrentPage(1);
    // Reset to show all records for date navigation
    setTeamCurrentNavigationDate('all');
    // Show all team records initially
    fetchTeamAttendance(1);
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
      data = data.filter(record => record.userId === selectedEmployee);
    }
    setFilteredData(data);
  }, [attendanceData, selectedEmployee]);

  // Handle filter changes - reset page to 1 and fetch new data
  const handleFilterChange = () => {
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    setSelectedEmployee('');
    fetchAttendance(1, isAdminUser ? adminView : 'my', '', '', '');
  };

  // Handle employee selection change
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
    // Immediately pass the selected employee to avoid stale state in fetch
    fetchAttendance(1, 'all', value, startDate, endDate);
  };

  // Determine admin-like UI behavior (Admin or System-Admin)
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike = userRoleLc === 'admin' || userRoleLc === 'system_admin';

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Attendance Management
      </Typography>

      {/* Admin View Toggle */}
      {isAdminLike && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={adminView === 'my' ? 'contained' : 'outlined'}
            onClick={handleMyAttendance}
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

      {/* Manager View Toggle */}
      {isManager && !isAdminLike && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={managerView === 'my' ? 'contained' : 'outlined'}
            onClick={handleManagerMyAttendance}
          >
            My Attendance
          </Button>
          <Button
            variant={managerView === 'team' ? 'contained' : 'outlined'}
            onClick={handleManagerTeamAttendance}
          >
            Team Attendance
          </Button>
          
        </Box>
      )}

      {/* Tabs - Only show for regular users (non-Managers and non-Admins) */}
      {!isManager && !isAdminLike && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex' }}>
            <Button
              onClick={() => setTab(0)}
              sx={{
                borderBottom: tab === 0 ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                mr: 2,
              }}
            >
              My Attendance
            </Button>
            {isManager && (
              <Button
                onClick={() => setTab(1)}
                sx={{
                  borderBottom: tab === 1 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
              >
                Team Attendance
              </Button>
              
            )}
            
          </Box>
         
        </Box>
        
      )}
 
      {/* My Attendance Tab - Show for regular users (tab 0) or when Manager/Admin is viewing My Attendance or Admin is viewing All Attendance */}
      {((tab === 0 && !isManager && !isAdminLike) ||
        (isManager && !isAdminLike && managerView === 'my') ||
        (isAdminLike && (adminView === 'my' || adminView === 'all'))) && (
        <Paper sx={{ background: 'unset', boxShadow: 'none' }}>
          {/* Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Employee Filter - Only show for admin "All" view */}
            {isAdminLike && adminView === 'all' && (
              <TextField
                select
                label='Select Employee'
                value={selectedEmployee}
                onChange={e => handleEmployeeChange(e.target.value)}
                sx={{ minWidth: 200 }}
                size='small'
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
                   if (dates && dates.length === 2) {
                     const start = dates[0]?.format('YYYY-MM-DD') || '';
                     const end = dates[1]?.format('YYYY-MM-DD') || '';
                     setStartDate(start);
                     setEndDate(end);
                     // Trigger the filter change
                     setCurrentPage(1);
                     const view = isAdminUser ? adminView : 'my';
                     const selectedId = view === 'all' ? selectedEmployee : undefined;
                     fetchAttendance(1, view, selectedId, start, end);
                   } else if (dates && dates.length === 1) {
                     const start = dates[0]?.format('YYYY-MM-DD') || '';
                     setStartDate(start);
                     setEndDate('');
                     // Trigger the filter change
                     setCurrentPage(1);
                     const view = isAdminUser ? adminView : 'my';
                     const selectedId = view === 'all' ? selectedEmployee : undefined;
                     fetchAttendance(1, view, selectedId, start, '');
                   } else {
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
            <Button variant='contained' onClick={handleFilterChange}>
              Clear Filters
            </Button>
           
          </Box>
  {/* Export Buttons */}
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}
          >
            {isAdminUser && (
              <Button
                variant='contained'
                onClick={() =>
                  exportCSV(
                    '/attendance/export/all',
                    'attendance-all.csv',
                    token,
                    filters
                  )
                }
              >
                Export All Attendance
              </Button>
            )}
            {isManager && (
              <Button
                variant='contained'
                onClick={() =>
                  exportCSV(
                    '/attendance/export/team',
                    'attendance-team.csv',
                    token,
                    filters
                  )
                }
              >
                Export Team Attendance
              </Button>
            )}
             {/* Export Button for Employees */}
        {!isAdminUser && (
          <Box mb={0} display='flex' justifyContent='flex-end'>
            <Button
              variant='contained'
              color='primary'
              onClick={() =>
                exportCSV(
                  '/attendance/export/self',
                  'attendance-self.csv',
                  token,
                  filters
                )
              }
            >
              Export My Attendance CSV
            </Button>
          </Box>
        )}
          </Box>
          {/* Attendance Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {isAdminLike && adminView === 'all' && (
                    <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
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
                      <TableCell>{record.checkInISO ? record.checkInISO.split('T')[0] : '--'}</TableCell>
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

          {/* Date Navigation for All Attendance */}
          {isAdminLike && adminView === 'all' && (
            <DateNavigation
              currentDate={currentNavigationDate}
              onDateChange={handleDateNavigationChange}
              disabled={loading}
            />
          )}

          {/* Pagination - Only show for My Attendance */}
          {!(isAdminLike && adminView === 'all') && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color='primary'
              />
            </Box>
          )}

          {/* Pagination Info - Only show for My Attendance */}
          {!(isAdminLike && adminView === 'all') && totalItems > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Showing {(currentPage - 1) * 10 + 1} to{' '}
                {Math.min(currentPage * 10, totalItems)} of {totalItems} records
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Team Attendance Tab - Only show for regular users (tab system) */}
      {tab === 1 && !isManager && !isAdminLike && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant='h6'>Team Attendance</Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Days Worked
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Hours Worked
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredTeamAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No team attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeamAttendance.flatMap(member => 
                    (member as any).attendance && (member as any).attendance.length > 0 
                      ? (member as any).attendance.map((attendance: any, index: number) => (
                          <TableRow key={`${(member as any).user_id}-${index}`}>
                            <TableCell>
                              {(member as any).first_name}{' '}
                              {(member as any).last_name}
                            </TableCell>
                            <TableCell>{attendance.date || '--'}</TableCell>
                            <TableCell>{attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : '--'}</TableCell>
                            <TableCell>{attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : '--'}</TableCell>
                            <TableCell>
                              {(member as any).totalDaysWorked}
                            </TableCell>
                            <TableCell>
                              {attendance.workedHours || 0}
                            </TableCell>
                          </TableRow>
                        ))
                      : [(
                          <TableRow key={(member as any).user_id}>
                            <TableCell>
                              {(member as any).first_name}{' '}
                              {(member as any).last_name}
                            </TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>
                              {(member as any).totalDaysWorked}
                            </TableCell>
                            <TableCell>
                              {(member as any).totalHoursWorked}
                            </TableCell>
                          </TableRow>
                        )]
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Date Navigation for Team Attendance */}
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
        </Paper>
      )}

      {/* Manager Team Attendance - Show when Manager clicks Team Attendance button */}
      {isManager && !isAdminLike && managerView === 'team' && (
        <Paper sx={{ background: 'unset !important', boxShadow: 'none' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            {/* <Typography variant='h6'>Team Attendance</Typography> */}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Hours Worked
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredTeamAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No team attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeamAttendance.flatMap(member => 
                    (member as any).attendance && (member as any).attendance.length > 0 
                      ? (member as any).attendance.map((attendance: any, index: number) => (
                          <TableRow key={`${(member as any).user_id}-${index}`}>
                            <TableCell>
                              {(member as any).first_name}{' '}
                              {(member as any).last_name}
                            </TableCell>
                            <TableCell>{attendance.date || '--'}</TableCell>
                            <TableCell>{attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : '--'}</TableCell>
                            <TableCell>{attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : '--'}</TableCell>
                            <TableCell>
                              {attendance.workedHours || 0}
                            </TableCell>
                          </TableRow>
                        ))
                      : [(
                          <TableRow key={(member as any).user_id}>
                            <TableCell>
                              {(member as any).first_name}{' '}
                              {(member as any).last_name}
                            </TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>
                              {(member as any).totalHoursWorked}
                            </TableCell>
                          </TableRow>
                        )]
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Date Navigation for Manager Team Attendance */}
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceTable;
