/* eslint-disable @typescript-eslint/no-explicit-any */
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
  CircularProgress,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DatePicker from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';
import './AttendanceTable.css';
import attendanceApi from '../../api/attendanceApi';
import { exportCSV } from '../../api/exportApi';
import type {
  AttendanceEvent,
  AttendanceResponse,
} from '../../api/attendanceApi';
import {
  isManager as checkIsManager,
  isAdmin,
  isSystemAdmin,
  isNetworkAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';
import DateNavigation from './DateNavigation';
import { useTheme } from '../../theme/hooks';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (shift date)
  checkInISO: string | null; // ISO for calc/sort
  checkOutISO: string | null; // ISO for calc/sort
  checkIn: string | null; // display
  checkOut: string | null; // display
  workedHours: number | null;
  user?: { first_name: string; last_name?: string };
}

const formatLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const AttendanceTable = () => {
  const { mode } = useTheme();
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
  const [, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSystemAdminUser, setIsSystemAdminUser] = useState(false);
  const [isNetworkAdminUser, setIsNetworkAdminUser] = useState(false);
  const [isHRAdminUser, setIsHRAdminUser] = useState(false);
  const [adminView, setAdminView] = useState<'my' | 'all'>('my');
  const [managerView, setManagerView] = useState<'my' | 'team'>('my');
  const [tab, setTab] = useState(0); // 0: My Attendance, 1: Team Attendance
  const [teamAttendance, setTeamAttendance] = useState<AttendanceEvent[]>([]);
  const [filteredTeamAttendance, setFilteredTeamAttendance] = useState<
    AttendanceEvent[]
  >([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [, setTeamError] = useState('');
  const [, setTeamCurrentPage] = useState(1);
  const [, setTeamTotalPages] = useState(1);
  const [, setTeamTotalItems] = useState(0);

  // Date navigation state for All Attendance, My Attendance, and Team Attendance
  const [currentNavigationDate, setCurrentNavigationDate] = useState('all');
  const [myAttendanceNavigationDate, setMyAttendanceNavigationDate] =
    useState('all');
  const [teamCurrentNavigationDate, setTeamCurrentNavigationDate] =
    useState('all');

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;
  const token = localStorage.getItem('token');
  const filters = { page: '1' };

  // Function to handle daily summaries from backend (cross-day compatible)
  const buildFromSummaries = (
    summariesRaw: Record<string, unknown>[],
    currentUserId: string
  ): AttendanceRecord[] => {
    return summariesRaw.map((summary: Record<string, unknown>) => ({
      id: `${summary.date}-${currentUserId}`,
      userId: currentUserId,
      date: summary.date as string,
      checkInISO: summary.checkIn as string,
      checkOutISO: summary.checkOut as string,
      checkIn: summary.checkIn
        ? toDisplayTime(summary.checkIn as string)
        : null,
      checkOut: summary.checkOut
        ? toDisplayTime(summary.checkOut as string)
        : null,
      workedHours: (summary.workedHours as number) || null,
      user: {
        first_name:
          `${(summary.user as any)?.first_name || ''} ${(summary.user as any)?.last_name || ''}`.trim(),
      },
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
        id: (e as any).id as string,
        user_id:
          ((e as any).user_id as string) ||
          (isAllAttendance ? null : currentUserId),
        timestamp: (e as any).timestamp as string,
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
        user?: { first_name?: string; last_name?: string };
      }>
    >();

    // Group events by user
    for (const ev of events) {
      const userId = ev.user_id as string;
      if (!userEvents.has(userId)) {
        userEvents.set(userId, []);
      }
      userEvents.get(userId)!.push({
        id: ev.id as string,
        timestamp: ev.timestamp as string,
        type: ev.type as 'check-in' | 'check-out',
        user: ev.user as any,
      });
    }

    // Process each user's events chronologically
    for (const [userId, userEventList] of userEvents.entries()) {
      const openSessions: Array<{
        checkIn: {
          id: string;
          timestamp: string;
          user?: { first_name?: string; last_name?: string };
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
          date: shiftDate,
          checkInISO: session.checkIn.timestamp,
          checkOutISO,
          checkIn: toDisplayTime(session.checkIn.timestamp),
          checkOut: checkOutDisplay,
          workedHours,
          user: {
            first_name: session.checkIn.user?.first_name || 'N/A',
            last_name: session.checkIn.user?.last_name || '',
          },
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
  const fetchAttendanceByDate = async (
    date: string,
    view: 'all' | 'my' | 'team'
  ) => {
    if (view === 'all' || view === 'my') {
      setLoading(true);
    } else {
      setTeamLoading(true);
    }

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        if (view === 'all' || view === 'my') {
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
          1, // Always page 1 - show all records
          date, // Start date
          date // End date (same day)
        );

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];

        // Check if response contains shift-based data or events
        const isShiftBased =
          events.length > 0 &&
          events[0] &&
          (events[0] as any).date &&
          (events[0] as any).checkIn !== undefined;

        if (isShiftBased) {
          rows = buildFromSummaries(events as any, currentUser.id);
        } else {
          rows = buildFromEvents(events, currentUser.id, true);
        }

        setAttendanceData(rows);
        setFilteredData(rows);

        // Always show all records without pagination
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(rows.length);
      } else if (view === 'my') {
        // For My Attendance, fetch events for the current user for specific date
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          1, // Always page 1 when showing all
          date, // Start date
          date // End date (same day)
        );

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];

        // Check if response contains shift-based data or events
        const isShiftBased =
          events.length > 0 &&
          events[0] &&
          (events[0] as any).date &&
          (events[0] as any).checkIn !== undefined;

        if (isShiftBased) {
          rows = buildFromSummaries(events as any, currentUser.id);
        } else {
          rows = buildFromEvents(events, currentUser.id, false);
        }

        setAttendanceData(rows);
        setFilteredData(rows);

        // Always show all records without pagination
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
    } catch {
      if (view === 'all' || view === 'my') {
        setAttendanceData([]);
        setFilteredData([]);
      } else {
        setTeamAttendance([]);
      }
    } finally {
      if (view === 'all' || view === 'my') {
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
    } catch {
      setEmployees([]);
    }
  };

  const fetchAttendance = async (
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
      setUserRole(roleName);
      const isManagerFlag = checkIsManager(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);
      const isNetworkAdminFlag = isNetworkAdmin(currentUser.role);
      const isHRAdminFlag = isHRAdmin(currentUser.role);
      setIsManager(isManagerFlag);
      setIsAdminUser(isAdminFlag);
      setIsSystemAdminUser(isSystemAdminFlag);
      setIsNetworkAdminUser(isNetworkAdminFlag);
      setIsHRAdminUser(isHRAdminFlag);

      let response: AttendanceResponse;

      const effectiveView: 'my' | 'all' = view ?? adminView;
      const effectiveSelectedEmployee = selectedUserId ?? selectedEmployee;
      const effectiveStartDate = startDateOverride ?? startDate;
      const effectiveEndDate = endDateOverride ?? endDate;

      // UPDATED: Use getAttendanceEvents for all attendance fetching
      if (canViewAllAttendance && effectiveView === 'all') {
        if (effectiveSelectedEmployee) {
          // When a specific employee is selected, fetch events for that user
          response = await attendanceApi.getAttendanceEvents(
            effectiveSelectedEmployee,
            1, // Always page 1 - show all records
            effectiveStartDate || undefined,
            effectiveEndDate || undefined
          );
        } else {
          // No employee selected: fetch all attendance without pagination
          response = await attendanceApi.getAllAttendance(
            1, // Always page 1 - show all records
            effectiveStartDate || undefined,
            effectiveEndDate || undefined
          );
        }
      } else {
        // For non-admins or 'my' view, fetch events for the current user
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          1, // Always page 1 - show all records
          effectiveStartDate || undefined,
          effectiveEndDate || undefined
        );
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
        rows = buildFromSummaries(events as any, currentUser.id);
      } else {
        // Handle events-based data (primary method)
        rows = buildFromEvents(
          events,
          currentUser.id,
          canViewAllAttendance && effectiveView === 'all'
        );
      }

      // Always show all records without pagination
      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(rows.length);

      setAttendanceData(rows);
      setFilteredData(rows);
    } catch {
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle team page change
  // const _handleTeamPageChange = (page: number) => {
  //   setTeamCurrentPage(page);
  //   fetchTeamAttendance(page);
  // };

  // Handle date navigation changes for All Attendance
  const handleDateNavigationChange = (newDate: string) => {
    setCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all records (no pagination)
      fetchAttendance('all', selectedEmployee, '', '');
    } else {
      // Show all records for specific date
      fetchAttendanceByDate(newDate, 'all');
    }
  };

  // Handle date navigation changes for My Attendance
  const handleMyAttendanceDateNavigationChange = (newDate: string) => {
    setMyAttendanceNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all records (no pagination)
      fetchAttendance('my', undefined, '', '');
    } else {
      // Show all records for specific date in My Attendance
      fetchAttendanceByDate(newDate, 'my');
    }
  };

  const handleTeamDateNavigationChange = (newDate: string) => {
    setTeamCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all team records
      setFilteredTeamAttendance(teamAttendance);
    } else {
      // Filter team records for specific date
      const filtered = teamAttendance
        .map(member => {
          const filteredAttendance =
            (member as any).attendance?.filter(
              (att: any) => att.date === newDate
            ) || [];
          return {
            ...member,
            attendance: filteredAttendance,
          };
        })
        .filter(member => (member as any).attendance.length > 0);
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
    // Reset to show all records for date navigation
    setMyAttendanceNavigationDate('all');
    fetchAttendance('my', undefined, '', '');
  };

  const handleAllAttendance = () => {
    setAdminView('all');
    setCurrentPage(1);
    setSelectedEmployee('');
    setStartDate('');
    setEndDate('');
    // Reset to show all records for date navigation
    setCurrentNavigationDate('all');

    // Show all records initially (no date filtering)
    fetchAttendance('all', undefined, '', '');
    // Fetch employees from attendance data after initial load
    fetchEmployeesFromAttendance();
  };

  // Handle manager view change - separate buttons
  const handleManagerMyAttendance = () => {
    setManagerView('my');
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    // Reset to show all records for date navigation
    setMyAttendanceNavigationDate('all');
    fetchAttendance('my', undefined, '', '');
  };

  const handleManagerTeamAttendance = () => {
    setManagerView('team');
    setTeamCurrentPage(1);
    // Reset to show all records for date navigation
    setTeamCurrentNavigationDate('all');
    // Show all team records initially
    fetchTeamAttendance(1);
  };

  // Set theme attribute on body when component mounts or theme changes
  useEffect(() => {
    if (mode === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [mode]);

  // Initial load
  useEffect(() => {
    fetchAttendance('my', undefined, '', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to convert YYYY-MM-DD -> Date at local midnight
  // const _ymdToLocalDate = (ymd: string) => {
  //   if (!ymd) return null;
  //   const [y, m, d] = ymd.split('-').map(Number);
  //   return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  // };

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
    fetchAttendance(canViewAllAttendance ? adminView : 'my', '', '', '');
  };

  // Handle employee selection change
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
    // Immediately pass the selected employee to avoid stale state in fetch
    fetchAttendance('all', value, startDate, endDate);
  };

  // Determine admin-like UI behavior (Admin, System-Admin, Network-Admin, or HR-Admin)
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike =
    userRoleLc === 'admin' ||
    userRoleLc === 'system_admin' ||
    userRoleLc === 'network_admin' ||
    userRoleLc === 'hr_admin';

  // Check if user is strictly an admin (not system-admin, network-admin, or hr-admin)
  // const _isStrictAdmin = isAdminUser && !isSystemAdminUser && !isNetworkAdminUser && !isHRAdminUser;

  // Check if user can view all attendance (Admin, System-Admin, Network-Admin, or HR-Admin)
  const canViewAllAttendance =
    isAdminUser || isSystemAdminUser || isNetworkAdminUser || isHRAdminUser;

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Attendance Management
      </Typography>

      {/* Manager View Toggle */}
      {isManager && !isAdminLike && managerView === 'team' && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={
              (managerView as string) === 'my' ? 'contained' : 'outlined'
            }
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
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex' }}>
            {/* <Button
              onClick={() => setTab(0)}
              sx={{
                borderBottom: tab === 0 ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                mr: 2,
              }}
            >
              My Attendance
            </Button> */}
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
          {/* All Controls in Same Line */}
          <Box
            sx={{
              mb: 3,
              mt: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* Admin View Toggle - Show for Admin, System-Admin, Network-Admin, and HR-Admin users */}
              {canViewAllAttendance && (
                <>
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
                </>
              )}

              {/* Manager View Toggle */}
              {isManager && !isAdminLike && (
                <>
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
                </>
              )}

              {/* Employee Filter - Show for admin "All" view (including HR-Admin) */}
              {canViewAllAttendance && adminView === 'all' && (
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
              <Box>
                <DatePicker
                  range
                  numberOfMonths={2}
                  value={
                    startDate && endDate
                      ? [new Date(startDate), new Date(endDate)]
                      : startDate
                        ? [new Date(startDate)]
                        : []
                  }
                  onChange={dates => {
                    if (dates && dates.length === 2) {
                      const start = dates[0]?.format('YYYY-MM-DD') || '';
                      const end = dates[1]?.format('YYYY-MM-DD') || '';
                      setStartDate(start);
                      setEndDate(end);
                      // Trigger the filter change
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, end);
                    } else if (dates && dates.length === 1) {
                      const start = dates[0]?.format('YYYY-MM-DD') || '';
                      setStartDate(start);
                      setEndDate('');
                      // Trigger the filter change
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, '');
                    } else {
                      setStartDate('');
                      setEndDate('');
                      // Trigger the filter change
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, '', '');
                    }
                  }}
                  format='MM/DD/YYYY'
                  placeholder='Start Date - End Date'
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
                  inputClass={`custom-date-picker-input ${mode === 'dark' ? 'theme-dark' : ''}`}
                  className={`custom-date-picker ${mode === 'dark' ? 'theme-dark' : ''}`}
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

            {/* Export Buttons - Right Side */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Export All Attendance - For Admin, System-Admin, Network-Admin, and HR-Admin users */}
              {canViewAllAttendance && (
                <Tooltip title='Export All Attendance'>
                  <IconButton
                    color='primary'
                    onClick={() =>
                      exportCSV(
                        '/attendance/export/all',
                        'attendance-all.csv',
                        token || '',
                        filters
                      )
                    }
                    sx={{
                      backgroundColor: 'primary.main',
                      borderRadius: '6px',
                      padding: '6px',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
              {/* Export Team Attendance - Only for Managers */}
              {isManager && !isAdminLike && (
                <Tooltip title='Export Team Attendance'>
                  <IconButton
                    color='primary'
                    onClick={() =>
                      exportCSV(
                        '/attendance/export/team',
                        'attendance-team.csv',
                        token || '',
                        filters
                      )
                    }
                    sx={{
                      backgroundColor: 'primary.main',
                      borderRadius: '6px',
                      padding: '6px',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
              {/* Export Button for Regular Employees */}
              {!isAdminUser &&
                !isSystemAdminUser &&
                !isNetworkAdminUser &&
                !isHRAdminUser &&
                !isManager && (
                  <Tooltip title='Export My Attendance'>
                    <IconButton
                      color='primary'
                      onClick={() =>
                        exportCSV(
                          '/attendance/export/self',
                          'attendance-self.csv',
                          token || '',
                          filters
                        )
                      }
                      sx={{
                        backgroundColor: 'primary.main',
                        borderRadius: '6px',
                        padding: '6px',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                    >
                      <FileDownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}
            </Box>
          </Box>
          {/* Attendance Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {canViewAllAttendance && adminView === 'all' && (
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
                      colSpan={
                        canViewAllAttendance && adminView === 'all' ? 5 : 4
                      }
                      align='center'
                    >
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map(record => (
                    <TableRow key={record.id}>
                      {canViewAllAttendance && adminView === 'all' && (
                        <TableCell>
                          {record.user?.first_name} {record.user?.last_name}
                        </TableCell>
                      )}
                      <TableCell>
                        {record.checkInISO
                          ? record.checkInISO.split('T')[0]
                          : '--'}
                      </TableCell>
                      <TableCell>{record.checkIn || '--'}</TableCell>
                      <TableCell>{record.checkOut || '--'}</TableCell>
                      <TableCell>{record.workedHours ?? '--'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        canViewAllAttendance && adminView === 'all' ? 5 : 4
                      }
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
          {canViewAllAttendance && adminView === 'all' && (
            <DateNavigation
              currentDate={currentNavigationDate}
              onDateChange={handleDateNavigationChange}
              disabled={loading}
            />
          )}

          {/* Date Navigation for My Attendance */}
          {(!canViewAllAttendance ||
            (canViewAllAttendance && adminView === 'my') ||
            (isManager && !isAdminLike && managerView === 'my')) && (
            <DateNavigation
              currentDate={myAttendanceNavigationDate}
              onDateChange={handleMyAttendanceDateNavigationChange}
              disabled={loading}
            />
          )}

          {/* Show total records count */}
          {totalItems > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Showing all {totalItems} records
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Days Worked</TableCell>
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
                    (member as any).attendance &&
                    (member as any).attendance.length > 0
                      ? (member as any).attendance.map(
                          (attendance: any, index: number) => (
                            <TableRow
                              key={`${(member as any).user_id}-${index}`}
                            >
                              <TableCell>
                                {(member as any).first_name}{' '}
                                {(member as any).last_name}
                              </TableCell>
                              <TableCell>{attendance.date || '--'}</TableCell>
                              <TableCell>
                                {attendance.checkIn
                                  ? new Date(
                                      attendance.checkIn
                                    ).toLocaleTimeString()
                                  : '--'}
                              </TableCell>
                              <TableCell>
                                {attendance.checkOut
                                  ? new Date(
                                      attendance.checkOut
                                    ).toLocaleTimeString()
                                  : '--'}
                              </TableCell>
                              <TableCell>
                                {(member as any).totalDaysWorked}
                              </TableCell>
                              <TableCell>
                                {attendance.workedHours || 0}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      : [
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
                          </TableRow>,
                        ]
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
                    (member as any).attendance &&
                    (member as any).attendance.length > 0
                      ? (member as any).attendance.map(
                          (attendance: any, index: number) => (
                            <TableRow
                              key={`${(member as any).user_id}-${index}`}
                            >
                              <TableCell>
                                {(member as any).first_name}{' '}
                                {(member as any).last_name}
                              </TableCell>
                              <TableCell>{attendance.date || '--'}</TableCell>
                              <TableCell>
                                {attendance.checkIn
                                  ? new Date(
                                      attendance.checkIn
                                    ).toLocaleTimeString()
                                  : '--'}
                              </TableCell>
                              <TableCell>
                                {attendance.checkOut
                                  ? new Date(
                                      attendance.checkOut
                                    ).toLocaleTimeString()
                                  : '--'}
                              </TableCell>
                              <TableCell>
                                {attendance.workedHours || 0}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      : [
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
                          </TableRow>,
                        ]
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
