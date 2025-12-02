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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DatePicker from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';
import './AttendanceTable.css';
import attendanceApi, {
  type SystemAllAttendanceResponse,
} from '../../api/attendanceApi';
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
import { formatDate } from '../../utils/dateUtils';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { SystemTenantApi } from '../../api/systemTenantApi';

type TenantOption = { id: string; name: string };

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInISO: string | null;
  checkOutISO: string | null;
  checkIn: string | null;
  checkOut: string | null;
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
  const { language } = useLanguage();

  const attendanceLabels = {
    en: {
      pageTitle: 'Attendance Management',
      employee: 'Employee',
      date: 'Date',
      checkIn: 'Check In',
      checkOut: 'Check Out',
      workedHours: 'Worked Hours',
      name: 'Name',
      daysWorked: 'Days Worked',
      hoursWorked: 'Hours Worked',
      teamAttendanceTitle: 'Team Attendance',
      noTeamRecords: 'No team attendance records found.',
      myAttendance: 'My Attendance',
      allAttendance: 'All Attendance',
      selectEmployee: 'Select Employee',
      allEmployees: 'All Employees',
      dateRangePlaceholder: 'Start Date - End Date',
      exportTeamTooltip: 'Export Team Attendance',
      exportMyTooltip: 'Export My Attendance',
      exportAllTooltip: 'Export All Attendance',
      noAttendanceRecords: 'No attendance records found.',
      clearFilters: 'Clear Filters',
      showingAll: 'Showing all {records} records',
    },
    ar: {
      pageTitle: 'إدارة الحضور',
      employee: 'الموظف',
      date: 'التاريخ',
      checkIn: 'تسجيل الدخول',
      checkOut: 'تسجيل الخروج',
      workedHours: 'ساعات العمل',
      name: 'الاسم',
      daysWorked: 'أيام العمل',
      hoursWorked: 'ساعات العمل',
      teamAttendanceTitle: 'حضور الفريق',
      noTeamRecords: 'لا توجد سجلات حضور للفريق.',
      myAttendance: 'حضوري',
      allAttendance: 'جميع الحضور',
      selectEmployee: 'اختر موظف',
      allEmployees: 'جميع الموظفين',
      dateRangePlaceholder: 'تاريخ البدء - تاريخ الانتهاء',
      exportTeamTooltip: 'تصدير حضور الفريق',
      exportMyTooltip: 'تصدير حضوري',
      exportAllTooltip: 'تصدير جميع الحضور',
      noAttendanceRecords: 'لا توجد سجلات حضور.',
      clearFilters: 'مسح الفلاتر',
      showingAll: 'عرض جميع {records} سجلات',
    },
  } as const;
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
  const [teamEmployees, setTeamEmployees] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTeamEmployee, setSelectedTeamEmployee] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [, setTeamError] = useState('');
  const [, setTeamCurrentPage] = useState(1);
  const [, setTeamTotalPages] = useState(1);
  const [, setTeamTotalItems] = useState(0);
  const [currentNavigationDate, setCurrentNavigationDate] = useState('all');
  const [myAttendanceNavigationDate, setMyAttendanceNavigationDate] =
    useState('all');
  const [teamCurrentNavigationDate, setTeamCurrentNavigationDate] =
    useState('all');

  // Date range filter state for Team Attendance
  const [teamStartDate, setTeamStartDate] = useState('');
  const [teamEndDate, setTeamEndDate] = useState('');

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;
  const token = localStorage.getItem('token');
  const filters = { page: '1' };
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

  const buildFromEvents = (
    eventsRaw: AttendanceEvent[],
    currentUserId: string,
    isAllAttendance: boolean = false
  ): AttendanceRecord[] => {
    console.log('buildFromEvents called with:', {
      eventsCount: eventsRaw.length,
      currentUserId,
      isAllAttendance,
    });

    const events = eventsRaw
      .filter(e => e && (e as any).timestamp && (e as any).type)
      .map(e => {
        const eventUserId = (e as any).user_id as string;
        // Also check user.id if user_id is not available
        const userObjId = (e as any).user?.id as string;
        const finalUserId =
          eventUserId || userObjId || (isAllAttendance ? null : currentUserId);

        console.log('Processing event:', {
          eventId: (e as any).id,
          eventUserId,
          userObjId,
          finalUserId,
          currentUserId,
          isAllAttendance,
        });

        return {
          id: (e as any).id as string,
          user_id: finalUserId,
          timestamp: (e as any).timestamp as string,
          type: (e as any).type as 'check-in' | 'check-out',
          user: (e as any).user,
        };
      })
      .filter(e => {
        const hasUserId = !!e.user_id;
        if (!hasUserId) {
          console.warn('Filtering out event without user_id:', e);
        }
        return hasUserId;
      }) // Only include events with valid user_id
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    const sessions: AttendanceRecord[] = [];

    const userEvents = new Map<
      string,
      Array<{
        id: string;
        timestamp: string;
        type: 'check-in' | 'check-out';
        user?: { first_name?: string; last_name?: string };
      }>
    >();

    for (const ev of events) {
      const userId = ev.user_id as string;

      if (!isAllAttendance) {
        if (userId && userId !== currentUserId) {
          // Skip events for other users when specific employee is selected
          console.log(
            '⏭️ Skipping event - userId:',
            userId,
            'does not match selected employee:',
            currentUserId
          );
          continue;
        }
        // Only process events for the selected employee (currentUserId)
        if (!userEvents.has(currentUserId)) {
          userEvents.set(currentUserId, []);
        }
        userEvents.get(currentUserId)!.push({
          id: ev.id as string,
          timestamp: ev.timestamp as string,
          type: ev.type as 'check-in' | 'check-out',
          user: ev.user as any,
        });
        console.log(' Added event for selected employee:', {
          eventId: ev.id,
          userId: currentUserId,
          type: ev.type,
        });
      } else {
        // For all attendance view (no employee selected), process all events
        const finalUserId = userId || currentUserId;
        if (!finalUserId) continue;

        if (!userEvents.has(finalUserId)) {
          userEvents.set(finalUserId, []);
        }
        userEvents.get(finalUserId)!.push({
          id: ev.id as string,
          timestamp: ev.timestamp as string,
          type: ev.type as 'check-in' | 'check-out',
          user: ev.user as any,
        });
      }
    }

    for (const [userId, userEventList] of userEvents.entries()) {
      // When employee is selected (isAllAttendance = false), only process events for that employee
      if (!isAllAttendance && userId !== currentUserId) {
        console.log(
          'Skipping events for userId:',
          userId,
          'expected:',
          currentUserId
        );
        continue;
      }
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
          openSessions.push({
            checkIn: {
              id: event.id,
              timestamp: event.timestamp,
              user: event.user,
            },
            checkOut: null,
          });
        } else if (event.type === 'check-out') {
          const lastOpenIndex = openSessions.findIndex(
            session => !session.checkOut
          );

          if (lastOpenIndex !== -1) {
            openSessions[lastOpenIndex].checkOut = {
              id: event.id,
              timestamp: event.timestamp,
            };
          }
        }
      }
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
          userId: userId, // Use the userId from the map key (this is the user_id from events)
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
    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      const at = a.checkInISO ? new Date(a.checkInISO).getTime() : 0;
      const bt = b.checkInISO ? new Date(b.checkInISO).getTime() : 0;
      return bt - at;
    });

    return sessions;
  };
  const buildFromSystemAll = (
    systemData: SystemAllAttendanceResponse,
    tenantFilter?: string | null,
    employeeFilter?: string | null
  ): AttendanceRecord[] => {
    const rows: AttendanceRecord[] = [];

    systemData.tenants.forEach(tenant => {
      if (tenantFilter && tenant.tenant_id !== tenantFilter) return;

      tenant.employees.forEach(emp => {
        // Filter by employee if employeeFilter is provided
        if (employeeFilter && emp.user_id !== employeeFilter) return;

        emp.attendance.forEach(att => {
          const id = `${tenant.tenant_id}-${emp.user_id}-${att.date}`;

          rows.push({
            id,
            userId: emp.user_id,
            date: att.date,
            checkInISO: att.checkIn,
            checkOutISO: att.checkOut,
            checkIn: att.checkIn ? toDisplayTime(att.checkIn) : null,
            checkOut: att.checkOut ? toDisplayTime(att.checkOut) : null,
            workedHours:
              typeof att.workedHours === 'number' ? att.workedHours : null,
            user: {
              first_name: emp.first_name,
              last_name: emp.last_name,
            },
          });
        });
      });
    });

    return rows;
  };

  const fetchTeamAttendance = async (
    page = 1,
    startDate?: string,
    endDate?: string
  ) => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await attendanceApi.getTeamAttendance(
        page,
        startDate,
        endDate,
        selectedTenant || undefined // tenantId
      );

      const teamItems = response.items || [];
      setTeamAttendance(teamItems);
      if (startDate || endDate) {
        const filteredItems = teamItems
          .map(member => {
            const filteredAttendance =
              (member as any).attendance?.filter((att: any) => {
                if (!att.date) return false;
                let attDateStr = '';
                if (
                  typeof att.date === 'string' &&
                  att.date.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                  attDateStr = att.date;
                }
                // If date is an ISO timestamp, extract YYYY-MM-DD
                else if (
                  typeof att.date === 'string' &&
                  att.date.includes('T')
                ) {
                  attDateStr = att.date.split('T')[0];
                } else {
                  try {
                    const dateObj = new Date(att.date);
                    if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(
                        2,
                        '0'
                      );
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      attDateStr = `${year}-${month}-${day}`;
                    }
                  } catch {
                    attDateStr = String(att.date);
                  }
                }
                if (startDate && endDate) {
                  return attDateStr >= startDate && attDateStr <= endDate;
                } else if (startDate) {
                  return attDateStr >= startDate;
                } else if (endDate) {
                  return attDateStr <= endDate;
                }
                return true;
              }) || [];
            return {
              ...member,
              attendance: filteredAttendance,
            };
          })
          .filter(
            member =>
              (member as any).attendance &&
              (member as any).attendance.length > 0
          );
        setFilteredTeamAttendance(filteredItems);
      } else {
        setFilteredTeamAttendance(teamItems);
      }
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
          1,
          date,
          date,
          undefined,
          selectedTenant || undefined
        );

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];

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

        // If an employee is selected in admin "All" view, keep only that employee's records
        let filteredRows = rows;
        if (selectedEmployee) {
          const selectedId = String(selectedEmployee).trim();
          filteredRows = rows.filter(record => {
            const recordUserId = String(record.userId || '').trim();
            return recordUserId === selectedId;
          });
        }

        setAttendanceData(filteredRows);
        setFilteredData(filteredRows);

        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(filteredRows.length);
      } else if (view === 'my') {
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          1,
          date,
          date,
          selectedTenant || undefined
        );

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];

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

        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(rows.length);
      } else {
        const teamResponse = await attendanceApi.getTeamAttendance(
          1,
          date, // Start date
          date, // End date (same day)
          selectedTenant || undefined // tenantId
        );
        response = {
          items: teamResponse.items,
          total: teamResponse.total,
          page: teamResponse.page,
          limit: 10, // Default limit
          totalPages: teamResponse.totalPages,
        };
        const teamItems = (response.items as AttendanceEvent[]) || [];
        setTeamAttendance(teamItems);

        // Apply client-side filtering by date immediately (in case API doesn't filter properly)
        // This ensures empty array [] if no records exist for the selected date
        const selectedDateStr = date;
        const filteredItems = teamItems
          .map(member => {
            const filteredAttendance =
              (member as any).attendance?.filter((att: any) => {
                if (!att.date) return false;

                let attDateStr = '';

                if (
                  typeof att.date === 'string' &&
                  att.date.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                  attDateStr = att.date;
                } else if (
                  typeof att.date === 'string' &&
                  att.date.includes('T')
                ) {
                  attDateStr = att.date.split('T')[0];
                } else {
                  try {
                    const dateObj = new Date(att.date);
                    if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(
                        2,
                        '0'
                      );
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      attDateStr = `${year}-${month}-${day}`;
                    }
                  } catch {
                    attDateStr = String(att.date);
                  }
                }

                return attDateStr === selectedDateStr;
              }) || [];
            return {
              ...member,
              attendance: filteredAttendance,
            };
          })
          .filter(
            member =>
              (member as any).attendance &&
              (member as any).attendance.length > 0
          );
        setFilteredTeamAttendance(filteredItems);
      }
    } catch {
      if (view === 'all' || view === 'my') {
        setAttendanceData([]);
        setFilteredData([]);
      } else {
        setTeamAttendance([]);
        setFilteredTeamAttendance([]);
      }
    } finally {
      if (view === 'all' || view === 'my') {
        setLoading(false);
      } else {
        setTeamLoading(false);
      }
    }
  };

  const fetchEmployeesFromAttendance = async (viewOverride?: 'my' | 'all') => {
    try {
      const currentView = viewOverride || adminView;

      if (currentView === 'my') {
        setEmployees([]);
        return;
      }

      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.warn('No user found in localStorage');
        setEmployees([]);
        return;
      }

      const currentUser = JSON.parse(storedUser);
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      const isNetworkAdminFlag = isNetworkAdmin(currentUser.role);
      const isHRAdminFlag = isHRAdmin(currentUser.role);

      let tenantIdForEmployees: string | undefined =
        selectedTenant || undefined;

      if (
        !isSystemAdminFlag &&
        (isAdminFlag || isNetworkAdminFlag || isHRAdminFlag)
      ) {
        const adminTenantId = getAdminTenantId(currentUser);
        if (adminTenantId) {
          tenantIdForEmployees = adminTenantId;
          console.log('Using admin tenant_id for employees:', adminTenantId);
        } else {
          console.warn('Admin tenant_id not found');
        }
      }
      const userIdMapByEmail = new Map<string, string>(); 
      const userIdMapByName = new Map<string, string>(); 

      if (isSystemAdminFlag) {
        console.log(
          'System Admin: Getting user_id mapping from system/all API with tenantId:',
          tenantIdForEmployees
        );

        const systemAttendanceResponse =
          await attendanceApi.getSystemAllAttendance();

        systemAttendanceResponse.tenants.forEach(tenant => {
          if (
            tenantIdForEmployees &&
            tenant.tenant_id !== tenantIdForEmployees
          ) {
            return;
          }

          if (tenant.tenant_status !== 'active') {
            return;
          }

          tenant.employees.forEach(emp => {
            if (emp.user_id && emp.first_name) {
              const fullName =
                `${emp.first_name} ${emp.last_name || ''}`.trim();

              if (emp.email) {
                userIdMapByEmail.set(emp.email.toLowerCase(), emp.user_id);
              }
              if (fullName) {
                userIdMapByName.set(fullName.toLowerCase(), emp.user_id);
              }
            }
          });
        });

        console.log('User ID mapping from attendance API:', {
          byEmail: userIdMapByEmail.size,
          byName: userIdMapByName.size,
        });
      } else {
        console.log(
          'Regular Admin: Skipping attendance API call, using employees API directly'
        );
      }

      const response = await systemEmployeeApiService.getSystemEmployees({
        tenantId: tenantIdForEmployees,
        page: null, 
      });

      console.log('Employees API response:', response);

      const employeesData = Array.isArray(response)
        ? response
        : 'items' in response && Array.isArray(response.items)
          ? response.items
          : [];

      console.log(
        'Employees data after processing:',
        employeesData.length,
        'employees'
      );

      const employeeOptions = employeesData
        .map((emp: any) => {
          let employeeName = 'Unknown';
          let employeeEmail = (emp.email || '').toLowerCase();

          const userObj = emp.user || {};
          const userFirstName = userObj.first_name || emp.first_name || '';
          const userLastName = userObj.last_name || emp.last_name || '';
          const userEmail = (userObj.email || emp.email || '').toLowerCase();

          if (userFirstName) {
            employeeName =
              `${userFirstName}${userLastName ? ` ${userLastName}` : ''}`.trim();
          } else if (emp.firstName && emp.lastName) {
            employeeName = `${emp.firstName} ${emp.lastName}`.trim();
          } else if (emp.name) {
            employeeName = emp.name;
          } else if (userEmail) {
            employeeName = userEmail;
          }

          employeeEmail = userEmail || employeeEmail;

          let employeeUserId: string | undefined;

          if (userObj.id) {
            employeeUserId = userObj.id;
            console.log(
              ' Using user.id from employees API (correct user_id):',
              employeeUserId
            );
          } else if (employeeEmail && userIdMapByEmail.has(employeeEmail)) {
            employeeUserId = userIdMapByEmail.get(employeeEmail);
            console.log(
              'Using user_id from attendance API (by email):',
              employeeUserId
            );
          } else if (
            employeeName &&
            userIdMapByName.has(employeeName.toLowerCase())
          ) {
            employeeUserId = userIdMapByName.get(employeeName.toLowerCase());
            console.log(
              'Using user_id from attendance API (by name):',
              employeeUserId
            );
          }
          else if (emp.user_id) {
            employeeUserId = emp.user_id;
            console.log('Using emp.user_id:', employeeUserId);
          } else {
            employeeUserId = emp.id;
            console.warn(
              'Using emp.id as fallback (may not match attendance):',
              employeeUserId
            );
          }

          console.log('Mapping employee to dropdown:', {
            name: employeeName,
            email: employeeEmail,
            user_id: employeeUserId,
            employee_id: emp.id,
            hasUserObject: !!userObj.id,
          });

          return {
            id: employeeUserId!,
            name: employeeName,
          };
        })
        .filter(emp => emp.id && emp.name !== 'Unknown');

      console.log('Final employee options:', employeeOptions);
      setEmployees(employeeOptions);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const getAdminTenantId = (currentUser: any): string | undefined => {
    try {
      const storedTenantId = localStorage.getItem('tenant_id');
      if (storedTenantId) {
        return storedTenantId.trim();
      }
    } catch (error) {
      console.warn('Failed to get tenant_id from localStorage:', error);
    }

    try {
      const tenantId = currentUser?.tenant_id || currentUser?.tenant;
      if (tenantId) {
        return String(tenantId).trim();
      }
    } catch (error) {
      console.warn('Failed to get tenant_id from user object:', error);
    }

    return undefined;
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

      const adminTenantId =
        !isSystemAdminFlag &&
        (isAdminFlag || isNetworkAdminFlag || isHRAdminFlag)
          ? getAdminTenantId(currentUser)
          : undefined;

      let response: AttendanceResponse;

      const effectiveView: 'my' | 'all' = view ?? adminView;
      const effectiveSelectedEmployee = selectedUserId ?? selectedEmployee;
      const effectiveStartDate = startDateOverride ?? startDate;
      const effectiveEndDate = endDateOverride ?? endDate;
      let rows: AttendanceRecord[] = [];

      if (isSystemAdminFlag && effectiveView === 'all') {
        const systemData = await attendanceApi.getSystemAllAttendance(
          effectiveStartDate || undefined,
          effectiveEndDate || undefined
        );
        rows = buildFromSystemAll(
          systemData,
          selectedTenant || null,
          effectiveSelectedEmployee || null
        );
      } else {
        if (canViewAllAttendance && effectiveView === 'all') {
          const tenantIdForFetch = isSystemAdminFlag
            ? selectedTenant || undefined
            : adminTenantId || selectedTenant || undefined;

          if (effectiveSelectedEmployee) {
            // When a specific employee is selected in All Attendance view,
            // apply the selected date range as well so that both filters work together.
            const employeeStart =
              effectiveStartDate && effectiveStartDate !== ''
                ? effectiveStartDate
                : undefined;
            const employeeEnd =
              effectiveEndDate && effectiveEndDate !== ''
                ? effectiveEndDate
                : undefined;

            console.log(
              'Fetching attendance for selected employee with date range:',
              {
                userId: effectiveSelectedEmployee,
                startDate: employeeStart,
                endDate: employeeEnd,
                tenantId: tenantIdForFetch,
              }
            );

            response = await attendanceApi.getAttendanceEvents(
              effectiveSelectedEmployee,
              1,
              employeeStart,
              employeeEnd,
              tenantIdForFetch
            );
            console.log('Attendance response for selected employee:', response);
          } else {
            response = await attendanceApi.getAllAttendance(
              1,
              effectiveStartDate || undefined,
              effectiveEndDate || undefined,
              undefined,
              tenantIdForFetch
            );
          }
        } else {
          let myStartDate = effectiveStartDate;
          let myEndDate = effectiveEndDate;

          if (!myStartDate || !myEndDate) {
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            myStartDate = myStartDate || formatLocalYMD(oneYearAgo);
            myEndDate = myEndDate || formatLocalYMD(today);
          }

          response = await attendanceApi.getAttendanceEvents(
            currentUser.id,
            1,
            myStartDate,
            myEndDate,
            selectedTenant || undefined
          );
        }

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];

        console.log(
          'Events from API response:',
          events.length,
          'events',
          'for employee:',
          effectiveSelectedEmployee
        );
        console.log('Full response:', response);

        if (events.length > 0) {
          console.log(
            'Sample events with user_id:',
            events.slice(0, 3).map(ev => ({
              id: (ev as any).id,
              user_id: (ev as any).user_id,
              user: (ev as any).user,
              type: (ev as any).type,
              timestamp: (ev as any).timestamp,
            }))
          );
        }
        const isShiftBased =
          events.length > 0 &&
          events[0] &&
          (events[0] as any).date &&
          (events[0] as any).checkIn !== undefined;

        console.log('Is shift-based data:', isShiftBased);

        if (isShiftBased) {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          rows = buildFromSummaries(events as any, userIdForBuild);
        } else {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          const isAllAttendanceView =
            canViewAllAttendance &&
            effectiveView === 'all' &&
            !effectiveSelectedEmployee; 

          console.log('🔨 Building from events:', {
            userIdForBuild,
            isAllAttendanceView,
            eventsCount: events.length,
            selectedEmployee: effectiveSelectedEmployee,
          });

          rows = buildFromEvents(events, userIdForBuild, isAllAttendanceView);

          console.log(' Built attendance records:', {
            rowsCount: rows.length,
            userId: userIdForBuild,
            isAllAttendance: isAllAttendanceView,
          });
        }
      }

      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(rows.length);

      console.log(
        'Setting attendance data, rows count:',
        rows.length,
        'for employee:',
        effectiveSelectedEmployee
      );
      console.log('Sample rows:', rows.slice(0, 2));

      setAttendanceData(rows);
      if (
        canViewAllAttendance &&
        effectiveView === 'all' &&
        !effectiveSelectedEmployee
      ) {
        const employeesFromAttendance = new Map<
          string,
          { id: string; name: string }
        >();

        rows.forEach(record => {
          if (record.userId && record.user) {
            const userId = String(record.userId).trim();
            const firstName = record.user.first_name || '';
            const lastName = record.user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

            if (!employeesFromAttendance.has(userId)) {
              employeesFromAttendance.set(userId, {
                id: userId,
                name: fullName,
              });
            }
          }
        });

        const extractedEmployees = Array.from(employeesFromAttendance.values());

        console.log('📋 Extracted employees from attendance data:', {
          count: extractedEmployees.length,
          employees: extractedEmployees.slice(0, 5),
        });

        if (extractedEmployees.length > 0) {
          setEmployees(extractedEmployees);
          console.log(
            ' Updated employee dropdown with',
            extractedEmployees.length,
            'employees from attendance data'
          );
        }
      }
      let filteredRows = rows;
      if (effectiveSelectedEmployee) {
        console.log('Filtering rows by employee:', effectiveSelectedEmployee);
        console.log('Rows before filtering:', rows.length);
        filteredRows = rows.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(effectiveSelectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          if (!matches && rows.length > 0) {
            console.log('Record userId mismatch:', {
              recordUserId: recordUserId,
              selectedUserId: selectedUserId,
              record: {
                id: record.id,
                userId: record.userId,
                date: record.date,
                user: record.user,
              },
            });
          }
          return matches;
        });
        console.log('Filtered rows count:', filteredRows.length);
        console.log('Sample filtered rows:', filteredRows.slice(0, 2));
      }

      setFilteredData(filteredRows);
      console.log(
        'Final filteredData set with',
        filteredRows.length,
        'records'
      );
    } catch {
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateNavigationChange = (newDate: string) => {
    setCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      fetchAttendance('all', selectedEmployee, '', '');
    } else {
      fetchAttendanceByDate(newDate, 'all');
    }
  };
  const handleMyAttendanceDateNavigationChange = (newDate: string) => {
    setMyAttendanceNavigationDate(newDate);
    if (newDate === 'all') {
      
      fetchAttendance('my', undefined, '', '');
    } else {
      fetchAttendanceByDate(newDate, 'my');
    }
  };

  const handleTeamDateNavigationChange = (newDate: string) => {
    setTeamCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all team records or only selected employee records (no date filter)
      if (selectedTeamEmployee) {
        // No date filter, just selected employee
        handleTeamEmployeeChange(selectedTeamEmployee, '', '');
      } else {
        fetchTeamAttendance(1);
      }
    } else {
      // Fetch attendance for specific date
      if (selectedTeamEmployee) {
        // Apply date filter + selected employee together
        handleTeamEmployeeChange(selectedTeamEmployee, newDate, newDate);
      } else {
        // No employee selected -> fetch full team attendance for that date
        fetchAttendanceByDate(newDate, 'team');
      }
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

    // Fetch attendance - will show only the current user's attendance
    fetchAttendance('my', undefined, '', '');

    // Clear employees list for "My Attendance" since it only shows user's own attendance
    setEmployees([]);
  };

  const handleAllAttendance = async () => {
    setAdminView('all');
    setCurrentPage(1);
    setSelectedEmployee('');
    setSelectedTenant('');
    setStartDate('');
    setEndDate('');
    setCurrentNavigationDate('all');

    // Fetch initial attendance IMMEDIATELY for System Admin "All Attendance"
    // so that /attendance/system/all is hit right away on button click.
    fetchAttendance('all', undefined, '', '');

    // 👉 Load tenants from system-wide attendance (only for system admin)
    // Run this in parallel so it doesn't delay the attendance API call.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);

      if (isSystemAdminFlag) {
        // No await here – let tenants load in background
        fetchTenantsFromSystemAttendance();
      }
    }

    // Employees will be automatically extracted from attendance data in fetchAttendance
  };
  const fetchTenantsFromSystemAttendance = async () => {
    try {
      setTenantsLoading(true);

      // Use SystemTenantApi to get ALL tenants (not just those with attendance)
      // Fetch all tenants (without pagination limit)
      const allTenants = await SystemTenantApi.getAllTenants(false); // false = exclude deleted

      // Filter ACTIVE tenants only - STRICT filtering to exclude suspended and deleted
      // Convert status to lowercase for case-insensitive comparison
      const activeTenants = allTenants.filter((t: any) => {
        // Get status in lowercase for comparison
        const statusLower = String(t.status || '')
          .toLowerCase()
          .trim();

        // STRICT CHECK 1: Status must be exactly 'active'
        const isActive = statusLower === 'active';

        // STRICT CHECK 2: Must not be deleted (check multiple fields)
        const isNotDeleted =
          t.isDeleted === false &&
          !t.deleted_at &&
          t.deleted_at === null &&
          statusLower !== 'deleted';
        const isNotSuspended =
          statusLower !== 'suspended' && statusLower !== 'suspend';
        const shouldInclude = isActive && isNotDeleted && isNotSuspended;
        if (!shouldInclude) {
          const reason = !isActive
            ? 'status is not active'
            : !isNotDeleted
              ? 'tenant is deleted'
              : !isNotSuspended
                ? 'tenant is suspended'
                : 'unknown reason';

          console.log(' Excluding tenant:', {
            name: t.name,
            id: t.id,
            status: t.status,
            statusLower,
            isDeleted: t.isDeleted,
            deleted_at: t.deleted_at,
            reason,
          });
        }

        return shouldInclude;
      });

      console.log('Fetched all tenants:', {
        total: allTenants.length,
        active: activeTenants.length,
        allTenantsStatus: allTenants.map((t: any) => ({
          name: t.name,
          status: t.status,
          isDeleted: t.isDeleted,
          deleted_at: t.deleted_at,
        })),
      });
      const tenantOptions = activeTenants
        .filter((t: any) => {
          const statusLower = String(t.status || '')
            .toLowerCase()
            .trim();
          const isActive = statusLower === 'active';
          const isNotDeleted = t.isDeleted === false && !t.deleted_at;
          const isNotSuspended = statusLower !== 'suspended';

          return isActive && isNotDeleted && isNotSuspended;
        })
        .map((t: any) => ({
          id: t.id,
          name: t.name,
        }));
      console.log('🔍 Final tenant verification:', {
        totalFetched: allTenants.length,
        afterFilter: activeTenants.length,
        finalDropdown: tenantOptions.length,
        finalTenants: tenantOptions.map(t => t.name),
      });

      setTenants(tenantOptions);
      console.log(' Set tenants in dropdown:', {
        count: tenantOptions.length,
        tenants: tenantOptions.map(t => t.name),
      });

      const excludedTenants = allTenants.filter((t: any) => {
        const statusLower = String(t.status || '')
          .toLowerCase()
          .trim();
        const isActive = statusLower === 'active';
        const isNotDeleted =
          !t.isDeleted && !t.deleted_at && statusLower !== 'deleted';
        const isNotSuspended = statusLower !== 'suspended';
        return !(isActive && isNotDeleted && isNotSuspended);
      });

      if (excludedTenants.length > 0) {
        console.log(
          ' Excluded tenants:',
          excludedTenants.map((t: any) => ({
            name: t.name,
            status: t.status,
            isDeleted: t.isDeleted,
            deleted_at: t.deleted_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenants([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchEmployeesFromSystemAttendance = async (tenantId?: string) => {
    try {
      const response = await attendanceApi.getSystemAllAttendance();
      const uniqueEmployees = new Map<string, { id: string; name: string }>();

      response.tenants.forEach(tenant => {
        if (tenantId && tenant.tenant_id !== tenantId) return;

        tenant.employees.forEach(emp => {
          if (emp.user_id && emp.first_name) {
            const employeeId = emp.user_id;
            const employeeName =
              emp.first_name + (emp.last_name ? ` ${emp.last_name}` : '');
            if (!uniqueEmployees.has(employeeId)) {
              uniqueEmployees.set(employeeId, {
                id: employeeId,
                name: employeeName,
              });
            }
          }
        });
      });

      setEmployees(Array.from(uniqueEmployees.values()));
    } catch (error) {
      console.error('Error fetching employees from system attendance:', error);
      setEmployees([]);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedEmployee('');
    setCurrentPage(1);

  };

  const handleManagerMyAttendance = () => {
    setManagerView('my');
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    setMyAttendanceNavigationDate('all');
    fetchAttendance('my', undefined, '', '');
  };

  const handleManagerTeamAttendance = () => {
    setManagerView('team');
    setTeamCurrentPage(1);
    setTeamCurrentNavigationDate('all');
    setTeamStartDate('');
    setTeamEndDate('');
    fetchTeamAttendance(1);
  };
  useEffect(() => {
    if (mode === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [mode]);

  useEffect(() => {
    fetchAttendance('my', undefined, '', '');
  }, []);
  useEffect(() => {
    if (adminView === 'all' && isSystemAdminUser) {
      fetchAttendance('all', undefined, startDate, endDate);
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (attendanceData.length > 0 && adminView === 'all') {
      if (selectedEmployee) {
        console.log(
          'useEffect: Filtering data for employee:',
          selectedEmployee,
          'from',
          attendanceData.length,
          'records'
        );
        const filtered = attendanceData.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(selectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          if (!matches) {
            console.log('useEffect: Filtering out - userId mismatch:', {
              recordUserId: recordUserId,
              selectedUserId: selectedUserId,
              record: {
                id: record.id,
                userId: record.userId,
                date: record.date,
              },
            });
          }
          return matches;
        });
        console.log(
          'useEffect: Filtered to',
          filtered.length,
          'records for employee:',
          selectedEmployee
        );
        setFilteredData(filtered);
      } else {
        console.log(
          'useEffect: No employee selected, showing all',
          attendanceData.length,
          'records'
        );
        setFilteredData(attendanceData);
      }
    } else if (attendanceData.length > 0) {
      setFilteredData(attendanceData);
    }
  }, [attendanceData, selectedEmployee, adminView]);

  useEffect(() => {
    if (teamStartDate || teamEndDate) {
      return;
    }

    if (teamCurrentNavigationDate === 'all') {
      setFilteredTeamAttendance(teamAttendance);
    } else if (
      teamCurrentNavigationDate &&
      teamCurrentNavigationDate !== 'all'
    ) {
      const selectedDateStr = teamCurrentNavigationDate;

      if (teamAttendance.length === 0) {
        setFilteredTeamAttendance([]);
        return;
      }

      const filtered = teamAttendance
        .map(member => {
          const filteredAttendance =
            (member as any).attendance?.filter((att: any) => {
              if (!att.date) return false;

              let attDateStr = '';

              if (
                typeof att.date === 'string' &&
                att.date.match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                attDateStr = att.date;
              }
              else if (typeof att.date === 'string' && att.date.includes('T')) {
                attDateStr = att.date.split('T')[0];
              }
              else {
                try {
                  const dateObj = new Date(att.date);
                  if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(
                      2,
                      '0'
                    );
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    attDateStr = `${year}-${month}-${day}`;
                  }
                } catch {
                  attDateStr = String(att.date);
                }
              }

              return attDateStr === selectedDateStr;
            }) || [];
          return {
            ...member,
            attendance: filteredAttendance,
          };
        })
        .filter(
          member =>
            (member as any).attendance && (member as any).attendance.length > 0
        );

      setFilteredTeamAttendance(filtered);
    } else {
      setFilteredTeamAttendance(teamAttendance);
    }
  }, [teamAttendance, teamCurrentNavigationDate, teamStartDate, teamEndDate]);

  // Build unique team employee list whenever team attendance changes
  useEffect(() => {
    const unique = new Map<string, { id: string; name: string }>();
    teamAttendance.forEach(member => {
      const anyMember = member as any;
      const id = anyMember.user_id as string | undefined;
      if (!id) return;
      const firstName =
        anyMember.first_name || anyMember.user?.first_name || '';
      const lastName = anyMember.last_name || anyMember.user?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown';
      if (!unique.has(id)) {
        unique.set(id, { id, name });
      }
    });
    setTeamEmployees(Array.from(unique.values()));
  }, [teamAttendance]);

  // Handle team employee selection change (use events API by userId)
  const handleTeamEmployeeChange = async (
    value: string,
    startDateOverride?: string | null,
    endDateOverride?: string | null
  ) => {
    setSelectedTeamEmployee(value);

    // Resolve effective start/end dates (override > state)
    const resolvedStart =
      typeof startDateOverride !== 'undefined'
        ? startDateOverride || ''
        : teamStartDate;
    const resolvedEnd =
      typeof endDateOverride !== 'undefined'
        ? endDateOverride || ''
        : teamEndDate;

    const startForApi = resolvedStart || undefined;
    const endForApi = resolvedEnd || undefined;

    // If cleared, reload team data for current date range
    if (!value) {
      await fetchTeamAttendance(1, startForApi, endForApi);
      return;
    }

    setTeamLoading(true);
    try {
      const response = await attendanceApi.getAttendanceEvents(
        value,
        1,
        startForApi,
        endForApi
      );

      const events: AttendanceEvent[] =
        (response.items as AttendanceEvent[]) || [];

      const records = buildFromEvents(events, value, false);

      if (records.length === 0) {
        setFilteredTeamAttendance([]);
        return;
      }

      const first = records[0];
      const totalDaysWorked = records.length;
      const totalHoursWorked = records.reduce(
        (sum, r) => sum + (r.workedHours || 0),
        0
      );

      const member = {
        user_id: value,
        first_name: first.user?.first_name || '',
        last_name: first.user?.last_name || '',
        totalDaysWorked,
        totalHoursWorked,
        attendance: records.map(r => ({
          date: r.date,
          checkIn: r.checkInISO,
          checkOut: r.checkOutISO,
          workedHours: r.workedHours || 0,
        })),
      };

      setFilteredTeamAttendance([member as any]);
    } catch {
      setFilteredTeamAttendance([]);
    } finally {
      setTeamLoading(false);
    }
  };

  // Handle filter changes - reset page to 1 and fetch new data
  const handleFilterChange = () => {
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    setSelectedEmployee('');
    const viewForFetch = canViewAllAttendance ? adminView : 'my';
    fetchAttendance(viewForFetch, '', '', '');
  };

  const handleEmployeeChange = (value: string) => {
    console.log('Employee selected from dropdown:', value);
    console.log(
      'Available employees:',
      employees.map(emp => ({ id: emp.id, name: emp.name }))
    );

    const selectedEmp = employees.find(emp => emp.id === value);
    console.log('Selected employee details:', selectedEmp);

    setSelectedEmployee(value);
    setCurrentPage(1);
    fetchAttendance('all', value, startDate, endDate);
  };
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike =
    userRoleLc === 'admin' ||
    userRoleLc === 'system_admin' ||
    userRoleLc === 'network_admin' ||
    userRoleLc === 'hr_admin';
  const canViewAllAttendance =
    isAdminUser || isSystemAdminUser || isNetworkAdminUser || isHRAdminUser;

  return (
    <Box dir={'ltr'} sx={{ direction: 'ltr' }}>
      <Typography
        variant='h4'
        gutterBottom
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
      >
        {attendanceLabels[language].pageTitle}
      </Typography>
      {!isManager && !isAdminLike && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex' }}>
           
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

      {((tab === 0 && !isManager && !isAdminLike) ||
        (isManager && !isAdminLike && managerView === 'my') ||
        (isAdminLike && (adminView === 'my' || adminView === 'all'))) && (
        <Paper sx={{ background: 'unset', boxShadow: 'none' }}>
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
              {canViewAllAttendance && (
                <>
                  <Button
                    variant={adminView === 'my' ? 'contained' : 'outlined'}
                    onClick={handleMyAttendance}
                  >
                    {attendanceLabels[language].myAttendance}
                  </Button>
                  <Button
                    variant={adminView === 'all' ? 'contained' : 'outlined'}
                    onClick={handleAllAttendance}
                  >
                    {attendanceLabels[language].allAttendance}
                  </Button>
                </>
              )}

              {isManager && !isAdminLike && (
                <>
                  <Button
                    variant={managerView === 'my' ? 'contained' : 'outlined'}
                    onClick={handleManagerMyAttendance}
                  >
                    {attendanceLabels[language].myAttendance}
                  </Button>
                  <Button
                    variant={managerView === 'team' ? 'contained' : 'outlined'}
                    onClick={handleManagerTeamAttendance}
                  >
                    {attendanceLabels[language].teamAttendanceTitle}
                  </Button>
                </>
              )}

              {adminView === 'all' && isSystemAdminUser && (
                <FormControl size='small' sx={{ minWidth: 220 }}>
                  <InputLabel>Tenant</InputLabel>
                  <Select
                    value={selectedTenant}
                    label='Tenant'
                    disabled={tenantsLoading}
                    onChange={e => handleTenantChange(e.target.value)}
                  >
                    <MenuItem value=''>
                      <em>All Tenants</em>
                    </MenuItem>

                    {tenants.map(tenant => (
                      <MenuItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {canViewAllAttendance && adminView === 'all' && (
                <TextField
                  select
                  label={attendanceLabels[language].selectEmployee}
                  value={selectedEmployee}
                  onChange={e => handleEmployeeChange(e.target.value)}
                  sx={{ minWidth: 200 }}
                  size='small'
                >
                  <MenuItem value=''>
                    {attendanceLabels[language].allEmployees}
                  </MenuItem>
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
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
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, end);
                    } else if (dates && dates.length === 1) {
                      const start = dates[0]?.format('YYYY-MM-DD') || '';
                      setStartDate(start);
                      setEndDate('');
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, '');
                    } else {
                      setStartDate('');
                      setEndDate('');
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, '', '');
                    }
                  }}
                  format='MM/DD/YYYY'
                  placeholder={attendanceLabels[language].dateRangePlaceholder}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '6.5px 14px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
                    document.body.style.overflow = 'hidden';
                  }}
                  onClose={() => {
                    document.body.style.overflow = 'auto';
                  }}
                />
              </Box>

              <Button variant='contained' onClick={handleFilterChange}>
                {attendanceLabels[language].clearFilters}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {canViewAllAttendance && (
                <Tooltip title={attendanceLabels[language].exportAllTooltip}>
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
              {isManager && !isAdminLike && (
                <Tooltip title={attendanceLabels[language].exportTeamTooltip}>
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
              {!isAdminUser &&
                !isSystemAdminUser &&
                !isNetworkAdminUser &&
                !isHRAdminUser &&
                !isManager && (
                  <Tooltip title={attendanceLabels[language].exportMyTooltip}>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {canViewAllAttendance && adminView === 'all' && (
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {attendanceLabels[language].employee}
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].date}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkIn}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkOut}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].workedHours}
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
                          ? formatDate(record.checkInISO.split('T')[0])
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
                      {attendanceLabels[language].noAttendanceRecords}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {canViewAllAttendance && adminView === 'all' && (
            <DateNavigation
              currentDate={currentNavigationDate}
              onDateChange={handleDateNavigationChange}
              disabled={loading}
            />
          )}

          {(!canViewAllAttendance ||
            (canViewAllAttendance && adminView === 'my') ||
            (isManager && !isAdminLike && managerView === 'my')) && (
            <DateNavigation
              currentDate={myAttendanceNavigationDate}
              onDateChange={handleMyAttendanceDateNavigationChange}
              disabled={loading}
            />
          )}

          {totalItems > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                {attendanceLabels[language].showingAll.replace(
                  '{records}',
                  String(totalItems)
                )}
                {/* ensure numeric content remains LTR */}
                {/* In case Arabic surrounding text flips, keep number readable */}
                {/* but we already inserted number into the localized string; enforce LTR on number span */}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

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
            <Typography variant='h6'>
              {attendanceLabels[language].teamAttendanceTitle}
            </Typography>
          </Box>

          <Box
            sx={{
              mb: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <DatePicker
                range
                numberOfMonths={2}
                value={
                  teamStartDate && teamEndDate
                    ? [new Date(teamStartDate), new Date(teamEndDate)]
                    : teamStartDate
                      ? [new Date(teamStartDate)]
                      : []
                }
                onChange={dates => {
                  if (dates && dates.length === 2) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    const end = dates[1]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate(end);
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Apply date range + selected employee together
                      handleTeamEmployeeChange(
                        selectedTeamEmployee,
                        start,
                        end
                      );
                    } else {
                      // No employee selected -> fetch full team attendance
                      fetchTeamAttendance(1, start, end);
                    }
                  } else if (dates && dates.length === 1) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      handleTeamEmployeeChange(selectedTeamEmployee, start, '');
                    } else {
                      fetchTeamAttendance(1, start, '');
                    }
                  } else {
                    setTeamStartDate('');
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Clear date filter but keep selected employee
                      handleTeamEmployeeChange(selectedTeamEmployee, '', '');
                    } else {
                      fetchTeamAttendance(1);
                    }
                  }
                }}
                format='MM/DD/YYYY'
                placeholder={attendanceLabels[language].dateRangePlaceholder}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '6.5px 14px',
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
                  document.body.style.overflow = 'hidden';
                }}
                onClose={() => {
                  document.body.style.overflow = 'auto';
                }}
              />
            </Box>
            {/* Team Employee Filter - for team attendance (regular users) */}
            {teamEmployees.length > 0 && (
              <TextField
                select
                label='Select Employee'
                value={selectedTeamEmployee}
                onChange={e => handleTeamEmployeeChange(e.target.value)}
                sx={{ minWidth: 200 }}
                size='small'
              >
                <MenuItem value=''>All Employees</MenuItem>
                {teamEmployees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Button
              variant='outlined'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                setTeamCurrentNavigationDate('all');
                setSelectedTeamEmployee('');
                fetchTeamAttendance(1);
              }}
            >
              {attendanceLabels[language].clearFilters}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].name}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].date}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkIn}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkOut}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].daysWorked}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].hoursWorked}
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
                      {attendanceLabels[language].noTeamRecords}
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
                              <TableCell>
                                {attendance.date
                                  ? formatDate(attendance.date)
                                  : '--'}
                              </TableCell>
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
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
        </Paper>
      )}

      {isManager && !isAdminLike && managerView === 'team' && (
        <Paper sx={{ background: 'unset !important', boxShadow: 'none' }}>
          <Box
            sx={{
              mb: 3,
              mt: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
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

            <Box>
              <DatePicker
                range
                numberOfMonths={2}
                value={
                  teamStartDate && teamEndDate
                    ? [new Date(teamStartDate), new Date(teamEndDate)]
                    : teamStartDate
                      ? [new Date(teamStartDate)]
                      : []
                }
                onChange={dates => {
                  if (dates && dates.length === 2) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    const end = dates[1]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate(end);
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Apply date range + selected employee together
                      handleTeamEmployeeChange(
                        selectedTeamEmployee,
                        start,
                        end
                      );
                    } else {
                      fetchTeamAttendance(1, start, end);
                    }
                  } else if (dates && dates.length === 1) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      handleTeamEmployeeChange(selectedTeamEmployee, start, '');
                    } else {
                      fetchTeamAttendance(1, start, '');
                    }
                  } else {
                    setTeamStartDate('');
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Clear date filter but keep selected employee
                      handleTeamEmployeeChange(selectedTeamEmployee, '', '');
                    } else {
                      fetchTeamAttendance(1);
                    }
                  }
                }}
                format='MM/DD/YYYY'
                placeholder={attendanceLabels[language].dateRangePlaceholder}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '6.5px 14px',
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
                  document.body.style.overflow = 'hidden';
                }}
                onClose={() => {
                  document.body.style.overflow = 'auto';
                }}
              />
            </Box>
            {/* Team Employee Filter - for manager team attendance */}
            {teamEmployees.length > 0 && (
              <TextField
                select
                label='Select Employee'
                value={selectedTeamEmployee}
                onChange={e => handleTeamEmployeeChange(e.target.value)}
                sx={{ minWidth: 200 }}
                size='small'
              >
                <MenuItem value=''>All Employees</MenuItem>
                {teamEmployees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Button
              variant='outlined'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                setTeamCurrentNavigationDate('all');
                setSelectedTeamEmployee('');
                fetchTeamAttendance(1);
              }}
            >
              {attendanceLabels[language].clearFilters}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].name}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].date}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkIn}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].checkOut}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {attendanceLabels[language].hoursWorked}
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
                      {attendanceLabels[language].noTeamRecords}
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
                              <TableCell>
                                {attendance.date
                                  ? formatDate(attendance.date)
                                  : '--'}
                              </TableCell>
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
