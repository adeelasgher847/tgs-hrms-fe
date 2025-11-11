import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import GenerateIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { useUser } from '../../hooks/useUser';
import {
  payrollApi,
  type PayrollRecord,
  type PayrollStatus,
} from '../../api/payrollApi';
import { snackbar } from '../../utils/snackbar';
import { useIsDarkMode } from '../../theme';
import dayjsPluginLocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(dayjsPluginLocalizedFormat);

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const statusOptions: PayrollStatus[] = ['pending', 'approved', 'paid'];

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(numberValue);
};

const PayrollRecords: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { darkMode: outletDarkMode } = useOutletContext<{
    darkMode: boolean;
  }>();
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;
  const { user } = useUser();
  const role = (user?.role || '').toLowerCase();
  const isSystemAdmin = role === 'system-admin';
  const isHrAdmin = role === 'hr-admin';
  const isTenantAdmin = role === 'admin';
  const canGeneratePayroll = isSystemAdmin || isHrAdmin || isTenantAdmin;
  const canUpdateStatus = canGeneratePayroll;

  const currentDate = dayjs();
  const [month, setMonth] = useState<number>(currentDate.month() + 1);
  const [year, setYear] = useState<number>(currentDate.year());
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [generateMonth, setGenerateMonth] = useState<number>(
    currentDate.month() + 1
  );
  const [generateYear, setGenerateYear] = useState<number>(currentDate.year());
  const [generateEmployeeId, setGenerateEmployeeId] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [statusRecord, setStatusRecord] = useState<PayrollRecord | null>(null);
  const [statusValue, setStatusValue] = useState<PayrollStatus>('pending');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const [historyRecords, setHistoryRecords] = useState<PayrollRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const totals = useMemo(() => {
    if (!records.length) {
      return { gross: 0, deductions: 0, bonuses: 0, net: 0 };
    }
    return records.reduce(
      (acc, record) => {
        const gross = Number(record.grossSalary) || 0;
        const deductions = Number(record.totalDeductions) || 0;
        const bonuses = Number(record.bonuses || 0) || 0;
        const net = Number(record.netSalary) || 0;
        return {
          gross: acc.gross + gross,
          deductions: acc.deductions + deductions,
          bonuses: acc.bonuses + bonuses,
          net: acc.net + net,
        };
      },
      { gross: 0, deductions: 0, bonuses: 0, net: 0 }
    );
  }, [records]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await payrollApi.getAllEmployeeSalaries();
      const mapped = data
        .filter(
          item =>
            item.salary && item.employee?.status?.toLowerCase() === 'active'
        )
        .map(item => ({
          id: item.employee.id,
          name: `${item.employee.user.first_name} ${item.employee.user.last_name}`,
        }));
      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await payrollApi.getPayrollRecords({
        month,
        year,
      });
      setRecords(data);
    } catch (error) {
      console.error('Failed to load payroll records:', error);
      snackbar.error('Failed to load payroll records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    setEmployeeFilter('');
  }, [month, year]);

  const openDetails = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);

    const employeeIdentifier =
      record.employee?.id ||
      record.employee_id ||
      record.employee?.user?.id ||
      '';

    if (!employeeIdentifier) {
      setHistoryRecords([]);
      setHistoryError('Employee information unavailable for this record.');
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    payrollApi
      .getPayrollHistory(employeeIdentifier)
      .then(history => {
        const sorted = [...history].sort((a, b) =>
          dayjs(`${b.year}-${b.month}-01`).valueOf() -
          dayjs(`${a.year}-${a.month}-01`).valueOf()
        );
        setHistoryRecords(sorted);
      })
      .catch(error => {
        console.error('Failed to load payroll history:', error);
        setHistoryRecords([]);
        setHistoryError('Failed to load payroll history.');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const closeDetails = () => {
    setSelectedRecord(null);
    setDetailsOpen(false);
    setHistoryRecords([]);
    setHistoryError(null);
  };

  const openStatusDialog = (record: PayrollRecord) => {
    setStatusRecord(record);
    setStatusValue(record.status);
    setStatusRemarks(record.remarks || '');
    setStatusDialogOpen(true);
  };

  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setStatusRecord(null);
    setStatusRemarks('');
    setStatusValue('pending');
  };

  const handleStatusUpdate = async () => {
    if (!statusRecord) return;
    try {
      setUpdatingStatus(true);
      const updated = await payrollApi.updatePayrollStatus(statusRecord.id, {
        status: statusValue,
        remarks: statusRemarks || undefined,
      });
      setRecords(prev =>
        prev.map(record =>
          record.id === updated.id ? { ...record, ...updated } : record
        )
      );
      snackbar.success('Payroll status updated successfully');
      closeStatusDialog();
    } catch (error) {
      console.error('Failed to update payroll status:', error);
      snackbar.error('Failed to update payroll status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const recordEmployees = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(record => {
      const id =
        record.employee?.id ||
        record.employee_id ||
        record.employee?.user?.id ||
        '';
      if (!id || map.has(id)) return;
      const name = record.employee?.user
        ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
        : record.employee_id || 'Employee';
      map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  const employeesForGeneration = useMemo(() => {
    if (!records.length) {
      return employees;
    }
    const paidIds = new Set(
      records
        .filter(record => record.status === 'paid')
        .map(
          record =>
            record.employee?.id ||
            record.employee_id ||
            record.employee?.user?.id ||
            ''
        )
        .filter(Boolean)
    );
    return employees.filter(emp => !paidIds.has(emp.id));
  }, [employees, records]);

  const displayedRecords = useMemo(() => {
    if (!employeeFilter) return records;
    return records.filter(record => {
      const id =
        record.employee?.id ||
        record.employee_id ||
        record.employee?.user?.id ||
        '';
      return id === employeeFilter;
    });
  }, [records, employeeFilter]);

  const isGenerateFormValid = useMemo(
    () => Boolean(generateMonth && generateYear),
    [generateMonth, generateYear]
  );

  const handleGenerate = useCallback(async () => {
    if (!generateMonth || !generateYear) {
      snackbar.error('Select both month and year to generate payroll');
      return;
    }
    try {
      setGenerating(true);
      const response = await payrollApi.generatePayroll({
        month: generateMonth,
        year: generateYear,
        employee_id: generateEmployeeId || undefined,
      });
      if (response.length > 0) {
        snackbar.success('Payroll generated successfully');
      } else {
        snackbar.info(
          'No payroll records were generated for the selected period'
        );
      }
      const refreshedRecords = await payrollApi.getPayrollRecords({
        month: generateMonth,
        year: generateYear,
      });
      setRecords(refreshedRecords);
      setMonth(generateMonth);
      setYear(generateYear);
      setEmployeeFilter(generateEmployeeId);
      setGenerateDialogOpen(false);
      setGenerateEmployeeId('');
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      snackbar.error('Failed to generate payroll. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [generateMonth, generateYear, generateEmployeeId]);

  const openGenerateDialog = useCallback(() => {
    setGenerateMonth(month);
    setGenerateYear(year);
    setGenerateEmployeeId('');
    setGenerateDialogOpen(true);
  }, [month, year]);

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        color: textColor,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600, color: textColor }}>
            Payroll Records
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems='flex-start'
        >
          <TextField
            select
            label='Month'
            value={month}
            size='small'
            sx={{ minWidth: 160 }}
            onChange={event => setMonth(Number(event.target.value))}
          >
            {monthOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label='Year'
            type='number'
            size='small'
            sx={{ minWidth: 140 }}
            value={year}
            onChange={event => setYear(Number(event.target.value) || year)}
          />

          <TextField
            select
            label='Employee'
            size='small'
            sx={{ minWidth: 220 }}
            value={employeeFilter}
            onChange={event => setEmployeeFilter(event.target.value)}
          >
            <MenuItem value=''>All employees</MenuItem>
            {recordEmployees.length === 0 ? (
              <MenuItem value='' disabled>
                No employees for this period
              </MenuItem>
            ) : (
              recordEmployees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))
            )}
          </TextField>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {canGeneratePayroll && (
              <Button
                variant='contained'
                startIcon={<GenerateIcon />}
                onClick={openGenerateDialog}
                disabled={generating}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Generate Payroll
              </Button>
            )}
          </Box>
        </Stack>
      </Box>

      {records.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            backgroundColor: cardBg,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant='h6'
            sx={{ fontWeight: 600, mb: 2, color: textColor }}
          >
            Summary
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {[
              {
                label: 'Total Records',
                value: records.length,
              },
              {
                label: 'Gross Payouts',
                value: formatCurrency(totals.gross),
              },
              {
                label: 'Total Deductions',
                value: formatCurrency(totals.deductions),
              },
              {
                label: 'Net Payouts',
                value: formatCurrency(totals.net),
              },
            ].map(card => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: effectiveDarkMode ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
                  border: effectiveDarkMode
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
                }}
              >
                <Typography
                  variant='caption'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#666' }}
                >
                  {card.label}
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 0,
          backgroundColor: cardBg,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : records.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Alert severity='info' sx={{ backgroundColor: 'transparent' }}>
              No payroll records found.
            </Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align='right'>Gross</TableCell>
                  <TableCell align='right'>Deductions</TableCell>
                  <TableCell align='right'>Net</TableCell>
                  <TableCell align='center'>Status</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map(record => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant='subtitle2' sx={{ color: textColor }}>
                        {record.employee?.user
                          ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
                          : record.employee_id}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#666' }}
                      >
                        {record.employee?.user?.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.month}/{record.year}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(record.grossSalary)}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(record.totalDeductions)}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(record.netSalary)}
                    </TableCell>
                    <TableCell align='center'>
                      <Typography
                        variant='caption'
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          textTransform: 'capitalize',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          backgroundColor:
                            record.status === 'paid'
                              ? theme.palette.success.light
                              : record.status === 'approved'
                                ? theme.palette.info.light
                                : theme.palette.warning.light,
                          color:
                            record.status === 'paid'
                              ? theme.palette.success.contrastText
                              : record.status === 'approved'
                                ? theme.palette.info.contrastText
                                : theme.palette.warning.contrastText,
                        }}
                      >
                        {record.status}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Stack
                        direction='row'
                        spacing={1}
                        justifyContent='center'
                      >
                        <Tooltip title='View breakdown'>
                          <IconButton
                            size='small'
                            onClick={() => openDetails(record)}
                          >
                            <VisibilityIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Update status'>
                          <span>
                            <IconButton
                              size='small'
                              onClick={() => openStatusDialog(record)}
                              disabled={updatingStatus}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={detailsOpen && !!selectedRecord}
        onClose={closeDetails}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6'>Payroll Breakdown</Typography>
          <Button onClick={closeDetails} color='inherit'>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent
          sx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
        >
          {selectedRecord && (
            <Stack spacing={3}>
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Employee Details
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  Name:{' '}
                  <strong>
                    {selectedRecord.employee?.user
                      ? `${selectedRecord.employee.user.first_name} ${selectedRecord.employee.user.last_name}`
                      : selectedRecord.employee_id}
                  </strong>
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  Email: {selectedRecord.employee?.user?.email || '—'}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  PeriodYear: {selectedRecord.month}/{selectedRecord.year}
                </Typography>
              </Box>

              <Divider />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                }}
              >
                {[
                  {
                    label: 'Gross Salary',
                    value: formatCurrency(selectedRecord.grossSalary),
                  },
                  {
                    label: 'Total Deductions',
                    value: formatCurrency(selectedRecord.totalDeductions),
                  },
                  {
                    label: 'Bonuses',
                    value: formatCurrency(selectedRecord.bonuses || 0),
                  },
                  {
                    label: 'Net Salary',
                    value: formatCurrency(selectedRecord.netSalary),
                  },
                ].map(card => (
                  <Paper
                    key={card.label}
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                    }}
                  >
                    <Typography variant='caption'>{card.label}</Typography>
                    <Typography variant='h6'>{card.value}</Typography>
                  </Paper>
                ))}
              </Box>

              {selectedRecord.salaryBreakdown?.allowances &&
                selectedRecord.salaryBreakdown.allowances.length > 0 && (
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Allowances
                    </Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align='right'>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRecord.salaryBreakdown.allowances.map(
                          (item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>{item.description || '—'}</TableCell>
                              <TableCell align='right'>
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                )}

              {selectedRecord.deductionsBreakdown && (
                <Box>
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Deductions
                  </Typography>
                  <Table size='small'>
                    <TableBody>
                      <TableRow>
                        <TableCell>Tax</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.deductionsBreakdown.tax || 0
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Insurance</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.deductionsBreakdown.insurance || 0
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Leave Deductions</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.deductionsBreakdown
                              .leaveDeductions || 0
                          )}
                        </TableCell>
                      </TableRow>
                      {selectedRecord.deductionsBreakdown.otherDeductions?.map(
                        (item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell align='right'>
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {selectedRecord.bonusesBreakdown && (
                <Box>
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Bonuses
                  </Typography>
                  <Table size='small'>
                    <TableBody>
                      <TableRow>
                        <TableCell>Performance Bonus</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.bonusesBreakdown.performanceBonus ||
                              0
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Bonus</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.bonusesBreakdown.overtimeBonus || 0
                          )}
                        </TableCell>
                      </TableRow>
                      {selectedRecord.bonusesBreakdown.otherBonuses?.map(
                        (item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell align='right'>
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              <Box sx={{ mt: 4 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Payroll History
                </Typography>
                {historyLoading ? (
                  <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : historyError ? (
                  <Alert severity='error'>{historyError}</Alert>
                ) : historyRecords.length === 0 ? (
                  <Alert severity='info'>No payroll history available.</Alert>
                ) : (
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align='right'>Gross</TableCell>
                        <TableCell align='right'>Net</TableCell>
                        <TableCell align='center'>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyRecords.map(record => {
                        const isCurrent = record.id === selectedRecord?.id;
                        return (
                          <TableRow key={record.id} selected={isCurrent}>
                            <TableCell>{`${record.month}/${record.year}`}</TableCell>
                            <TableCell align='right'>
                              {formatCurrency(record.grossSalary)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(record.netSalary)}
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={record.status}
                                size='small'
                                color={
                                  record.status === 'paid'
                                    ? 'success'
                                    : record.status === 'approved'
                                      ? 'info'
                                      : 'warning'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>

              {selectedRecord.remarks && (
                <Box>
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Remarks
                  </Typography>
                  <Typography variant='body2'>
                    {selectedRecord.remarks}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog
        open={statusDialogOpen && !!statusRecord}
        onClose={closeStatusDialog}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle>Update Payroll Status</DialogTitle>
        <DialogContent>
          {statusRecord && (
            <Stack spacing={2}>
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
              >
                {statusRecord.employee?.user
                  ? `${statusRecord.employee.user.first_name} ${statusRecord.employee.user.last_name}`
                  : statusRecord.employee_id}{' '}
                — {statusRecord.month}/{statusRecord.year}
              </Typography>
              <TextField
                select
                label='Status'
                value={statusValue}
                onChange={event =>
                  setStatusValue(event.target.value as PayrollStatus)
                }
              >
                {statusOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label='Remarks'
                multiline
                minRows={3}
                value={statusRemarks}
                onChange={event => setStatusRemarks(event.target.value)}
                placeholder='Optional remarks (e.g. payment method)'
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeStatusDialog}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant='contained'
            disabled={updatingStatus}
            startIcon={
              updatingStatus ? <CircularProgress size={16} /> : undefined
            }
            sx={{ textTransform: 'none' }}
          >
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant='body2'>
              Generate payroll for the selected month and year. You can
              optionally filter by a specific employee.
            </Typography>
            <TextField
              select
              label='Month'
              value={generateMonth}
              size='small'
              sx={{ minWidth: 160 }}
              onChange={event => setGenerateMonth(Number(event.target.value))}
            >
              {monthOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label='Year'
              type='number'
              size='small'
              sx={{ minWidth: 140 }}
              value={generateYear}
              onChange={event =>
                setGenerateYear(Number(event.target.value) || generateYear)
              }
            />
            <TextField
              select
              label='Employee'
              size='small'
              sx={{ minWidth: 220 }}
              value={generateEmployeeId}
              onChange={event => setGenerateEmployeeId(event.target.value)}
            >
              <MenuItem value=''>All employees</MenuItem>
              {employeesForGeneration.length === 0 ? (
                <MenuItem value='' disabled>
                  {employees.length === 0
                    ? 'No employees with salary configuration'
                    : 'All employees are already processed'}
                </MenuItem>
              ) : (
                employeesForGeneration.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))
              )}
            </TextField>
            {employeesForGeneration.length === 0 && employees.length > 0 && (
              <Alert severity='info' sx={{ m: 0 }}>
                All employees appear to have payroll generated for this period.
                Generating again will recalculate for every configured employee.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            variant='contained'
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : undefined}
            sx={{ textTransform: 'none' }}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollRecords;
