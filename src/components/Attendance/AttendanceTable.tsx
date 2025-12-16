import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from '@mui/material';
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
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../Common/ErrorSnackbar';
import AppButton from '../Common/AppButton';
import AppTable from '../Common/AppTable';

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
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
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
  const [teamStartDate, setTeamStartDate] = useState('');
  const [teamEndDate, setTeamEndDate] = useState('');

  const toDisplayTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString() : null;
  const token = localStorage.getItem('token');

  // Build query params for CSV export based on current filters
  const buildExportFilters = () => {
    const params: Record<string, string> = {};

    // Optional tenant filter (used by System Admin)
    if (selectedTenant) {
      params.tenantId = selectedTenant;
    }

    // Optional date range filters
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    return params;
  };
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
    const events = eventsRaw
      .filter(e => e && (e as any).timestamp && (e as any).type)
      .map(e => {
        const eventUserId = (e as any).user_id as string;
        // Also check user.id if user_id is not available
        const userObjId = (e as any).user?.id as string;
        const finalUserId =
          eventUserId || userObjId || (isAllAttendance ? null : currentUserId);

        return {
          id: (e as any).id as string,
          user_id: finalUserId,
          timestamp: (e as any).timestamp as string,
          type: (e as any).type as 'check-in' | 'check-out',
          user: (e as any).user,
        };
      })
      .filter(e => !!e.user_id) // Only include events with valid user_id
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
    } catch (error) {
      setTeamError('Failed to load team attendance');
      setTeamAttendance([]);
      setFilteredTeamAttendance([]);
      setTeamCurrentPage(1);
      setTeamTotalPages(1);
      setTeamTotalItems(0);
      showError(error);
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
    } catch (error) {
      if (view === 'all' || view === 'my') {
        setAttendanceData([]);
        setFilteredData([]);
      } else {
        setTeamAttendance([]);
        setFilteredTeamAttendance([]);
      }
      showError(error);
    } finally {
      if (view === 'all' || view === 'my') {
        setLoading(false);
      } else {
        setTeamLoading(false);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fetchEmployeesFromAttendance = async (_viewOverride?: 'my' | 'all') => {
    try {
      const currentView = viewOverride || adminView;

      if (currentView === 'my') {
        setEmployees([]);
        return;
      }

      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
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
        }
      }
      const userIdMapByEmail = new Map<string, string>();
      const userIdMapByName = new Map<string, string>();

      if (isSystemAdminFlag) {
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
      }

      const response = await systemEmployeeApiService.getSystemEmployees({
        tenantId: tenantIdForEmployees,
        page: null,
      });

      const employeesData = Array.isArray(response)
        ? response
        : 'items' in response && Array.isArray(response.items)
          ? response.items
          : [];

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
          } else if (employeeEmail && userIdMapByEmail.has(employeeEmail)) {
            employeeUserId = userIdMapByEmail.get(employeeEmail);
          } else if (
            employeeName &&
            userIdMapByName.has(employeeName.toLowerCase())
          ) {
            employeeUserId = userIdMapByName.get(employeeName.toLowerCase());
          } else if (emp.user_id) {
            employeeUserId = emp.user_id;
          } else {
            employeeUserId = emp.id;
          }

          return {
            id: employeeUserId!,
            name: employeeName,
          };
        })
        .filter(emp => emp.id && emp.name !== 'Unknown');
      setEmployees(employeeOptions);
    } catch (error) {
      setEmployees([]);
      showError(error);
    }
  };

  const getAdminTenantId = (currentUser: any): string | undefined => {
    try {
      const storedTenantId = localStorage.getItem('tenant_id');
      if (storedTenantId) {
        return storedTenantId.trim();
      }
    } catch {
      // Ignore; fall back to user object
    }

    try {
      const tenantId = currentUser?.tenant_id || currentUser?.tenant;
      if (tenantId) {
        return String(tenantId).trim();
      }
    } catch {
      // Ignore; tenant id will remain undefined
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

            response = await attendanceApi.getAttendanceEvents(
              effectiveSelectedEmployee,
              1,
              employeeStart,
              employeeEnd,
              tenantIdForFetch
            );
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

        if (events.length > 0) {
          // Intentionally left empty; sample logging removed for production
        }
        const isShiftBased =
          events.length > 0 &&
          events[0] &&
          (events[0] as any).date &&
          (events[0] as any).checkIn !== undefined;

        if (isShiftBased) {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          rows = buildFromSummaries(events as any, userIdForBuild);
        } else {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          const isAllAttendanceView =
            canViewAllAttendance &&
            effectiveView === 'all' &&
            !effectiveSelectedEmployee;

          rows = buildFromEvents(events, userIdForBuild, isAllAttendanceView);
        }
      }

      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(rows.length);

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

        if (extractedEmployees.length > 0) {
          setEmployees(extractedEmployees);
        }
      }
      let filteredRows = rows;
      if (effectiveSelectedEmployee) {
        filteredRows = rows.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(effectiveSelectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          return matches;
        });
      }

      setFilteredData(filteredRows);
    } catch (error) {
      setAttendanceData([]);
      setFilteredData([]);
      showError(error);
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

    // 👉 Load tenants using same API as Employee List (only for system admin)
    // Run this in parallel so it doesn't delay the attendance API call.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        const isSystemAdminFlag = isSystemAdmin(currentUser.role);

        if (isSystemAdminFlag) {
          console.log('handleAllAttendance: Loading tenants for system admin');
          // No await here – let tenants load in background
          fetchTenantsFromSystemAttendance();
        }
      } catch (error) {
        console.error('Error in handleAllAttendance:', error);
      }
    }

    // Employees will be automatically extracted from attendance data in fetchAttendance
  };
  const fetchTenantsFromSystemAttendance = async () => {
    try {
      setTenantsLoading(true);

      // Use the same API as Employee List to get all tenants
      const allTenants = await systemEmployeeApiService.getAllTenants(true);
      
      console.log('Fetched tenants from API:', allTenants);

      // Use tenants directly like Employee List does - map to the expected format
      const tenantOptions = (allTenants || []).map((t: any) => ({
        id: t.id || t.tenant_id || '',
        name: t.name || t.tenant_name || '',
      })).filter((t: any) => t.id && t.name); // Only keep tenants with valid id and name

      console.log('Mapped tenant options:', tenantOptions);
      setTenants(tenantOptions);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenants([]);
      showError(error);
    } finally {
      setTenantsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fetchEmployeesFromSystemAttendance = async (tenantId?: string) => {
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
    } catch {
      setEmployees([]);
      showError(error);
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

  // Load tenants when system admin views "All Attendance" - using same API as Employee List
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || adminView !== 'all') return;

    try {
      const currentUser = JSON.parse(storedUser);
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);

      if (isSystemAdminFlag && tenants.length === 0 && !tenantsLoading) {
        console.log('Loading tenants for system admin in All Attendance view');
        fetchTenantsFromSystemAttendance();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView]);

  useEffect(() => {
    if (adminView === 'all' && isSystemAdminUser) {
      fetchAttendance('all', undefined, startDate, endDate);
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (attendanceData.length > 0 && adminView === 'all') {
      if (selectedEmployee) {
        const filtered = attendanceData.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(selectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          return matches;
        });
        setFilteredData(filtered);
      } else {
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
    } catch (error) {
      setFilteredTeamAttendance([]);
      showError(error);
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
    <Box>
      <Typography variant='h4' gutterBottom>
        Attendance Management
      </Typography>
      {!isManager && !isAdminLike && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex' }}>
            {isManager && (
              <AppButton
                onClick={() => setTab(1)}
                variantType={tab === 1 ? 'primary' : 'secondary'}
                variant={tab === 1 ? 'contained' : 'outlined'}
                sx={{
                  borderBottom: tab === 1 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
              >
                Team Attendance
              </AppButton>
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
                  <AppButton
                    variant={adminView === 'my' ? 'contained' : 'outlined'}
                    variantType={adminView === 'my' ? 'primary' : 'secondary'}
                    onClick={handleMyAttendance}
                  >
                    My Attendance
                  </AppButton>
                  <AppButton
                    variant={adminView === 'all' ? 'contained' : 'outlined'}
                    variantType={adminView === 'all' ? 'primary' : 'secondary'}
                    onClick={handleAllAttendance}
                  >
                    All Attendance
                  </AppButton>
                </>
              )}

              {isManager && !isAdminLike && (
                <>
                  <AppButton
                    variant={managerView === 'my' ? 'contained' : 'outlined'}
                    variantType={managerView === 'my' ? 'primary' : 'secondary'}
                    onClick={handleManagerMyAttendance}
                  >
                    My Attendance
                  </AppButton>
                  <AppButton
                    variant={managerView === 'team' ? 'contained' : 'outlined'}
                    variantType={
                      managerView === 'team' ? 'primary' : 'secondary'
                    }
                    onClick={handleManagerTeamAttendance}
                  >
                    Team Attendance
                  </AppButton>
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
                  label='Select Employee'
                  value={selectedEmployee}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleEmployeeChange(e.target.value)
                  }
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
                  placeholder='Start Date - End Date'
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

              <AppButton
                variant='contained'
                variantType='primary'
                onClick={handleFilterChange}
              >
                Clear Filters
              </AppButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Single CSV export button - behavior changes based on view and role */}
              <Tooltip
                title={
                  isSystemAdminUser && adminView === 'all'
                    ? 'Export System Attendance'
                    : isManager && !isAdminLike && managerView === 'team'
                      ? 'Export Team Attendance'
                      : 'Export My Attendance'
                }
              >
                <IconButton
                  color='primary'
                  onClick={() => {
                    // System Admin in "All Attendance" view → use /attendance/export/system
                    if (isSystemAdminUser && adminView === 'all') {
                      const params = buildExportFilters();
                      exportCSV(
                        '/attendance/export/system',
                        'attendance-system.csv',
                        token || '',
                        params
                      );
                    }
                    // Manager in "Team Attendance" view → use /attendance/export/team
                    else if (
                      isManager &&
                      !isAdminLike &&
                      managerView === 'team'
                    ) {
                      exportCSV(
                        '/attendance/export/team',
                        'attendance-team.csv',
                        token || '',
                        buildExportFilters()
                      );
                    }
                    // Everyone else (including System Admin in "My Attendance") → use /attendance/export/self
                    else {
                      const selfParams: Record<string, string> = {};
                      if (startDate) selfParams.startDate = startDate;
                      if (endDate) selfParams.endDate = endDate;

                      exportCSV(
                        '/attendance/export/self',
                        'attendance-self.csv',
                        token || '',
                        selfParams
                      );
                    }
                  }}
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
            </Box>
          </Box>
          <AppTable>
            <TableHead>
              <TableRow>
                {canViewAllAttendance && adminView === 'all' && (
                  <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
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
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </AppTable>

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
                Showing all {totalItems} records
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
            <Typography variant='h6'>Team Attendance</Typography>
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
                placeholder='Start Date - End Date'
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleTeamEmployeeChange(e.target.value)
                }
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
            <AppButton
              variant='outlined'
              variantType='secondary'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                setTeamCurrentNavigationDate('all');
                setSelectedTeamEmployee('');
                fetchTeamAttendance(1);
              }}
            >
              Clear Filters
            </AppButton>
          </Box>

          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Days Worked</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hours Worked</TableCell>
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
                          <TableRow key={`${(member as any).user_id}-${index}`}>
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
                            <TableCell>{attendance.workedHours || 0}</TableCell>
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
          </AppTable>
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
            <AppButton
              variant={
                (managerView as string) === 'my' ? 'contained' : 'outlined'
              }
              variantType={
                (managerView as string) === 'my' ? 'primary' : 'secondary'
              }
              onClick={handleManagerMyAttendance}
            >
              My Attendance
            </AppButton>
            <AppButton
              variant={managerView === 'team' ? 'contained' : 'outlined'}
              variantType={managerView === 'team' ? 'primary' : 'secondary'}
              onClick={handleManagerTeamAttendance}
            >
              Team Attendance
            </AppButton>

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
                placeholder='Start Date - End Date'
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleTeamEmployeeChange(e.target.value)
                }
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
            <AppButton
              variant='outlined'
              variantType='secondary'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                setTeamCurrentNavigationDate('all');
                setSelectedTeamEmployee('');
                fetchTeamAttendance(1);
              }}
            >
              Clear Filters
            </AppButton>
          </Box>

          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hours Worked</TableCell>
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
                          <TableRow key={`${(member as any).user_id}-${index}`}>
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
                            <TableCell>{attendance.workedHours || 0}</TableCell>
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
          </AppTable>
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
        </Paper>
      )}

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default AttendanceTable;
