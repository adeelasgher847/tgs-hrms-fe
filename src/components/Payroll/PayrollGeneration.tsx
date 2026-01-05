import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import GenerateIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { payrollApi, type PayrollRecord } from '../../api/payrollApi';
import { snackbar } from '../../utils/snackbar';
import { useIsDarkMode } from '../../theme';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import AppFormModal from '../common/AppFormModal';
import AppPageTitle from '../common/AppPageTitle';

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

const PayrollGeneration: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { darkMode: outletDarkMode } = useOutletContext<{
    darkMode: boolean;
  }>();
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;

  const currentDate = dayjs();
  const [month, setMonth] = useState<number>(currentDate.month() + 1);
  const [year, setYear] = useState<number | ''>(currentDate.year());
  const [employeeId, setEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const totals = useMemo(() => {
    if (!records.length) {
      return {
        gross: 0,
        deductions: 0,
        bonuses: 0,
        net: 0,
      };
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

  const handleGenerate = useCallback(async () => {
    try {
      setLoading(true);
      const yearNum =
        typeof year === 'string' && year === ''
          ? dayjs().year()
          : year || dayjs().year();
      const response = await payrollApi.generatePayroll({
        month,
        year: yearNum,
        employee_id: employeeId.trim() || undefined,
      });
      setRecords(response);
      if (response.length) {
        snackbar.success('Payroll generated successfully');
      } else {
        snackbar.info(
          'No payroll records were generated for the selected period'
        );
      }
    } catch {
      snackbar.error('Failed to generate payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [month, year, employeeId]);

  const openDetails = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedRecord(null);
  };

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        color: textColor,
        '& .MuiButton-contained': {
          backgroundColor: 'var(--primary-dark-color)',
          '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
        },
        '& .MuiButton-outlined': {
          borderColor: 'var(--primary-dark-color)',
          color: 'var(--primary-dark-color)',
          '&:hover': {
            borderColor: 'var(--primary-dark-color)',
            backgroundColor: 'var(--primary-color)',
          },
        },
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
        <Box sx={{ width: '100%' }}>
          <AppPageTitle sx={{ mb: 0, color: textColor }}>
            Payroll Generation
          </AppPageTitle>
        </Box>
      </Box>

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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems='flex-start'
        >
          <AppDropdown
            label='Month'
            value={month}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setMonth(Number(event.target.value))
            }
            options={monthOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder='Month'
            containerSx={{ minWidth: 160 }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
              },
            }}
          />

          <TextField
            label='Year'
            type='number'
            inputProps={{ min: 0 }}
            size='small'
            sx={{ minWidth: 120 }}
            value={year === 0 ? '' : year}
            onChange={event => {
              const value = event.target.value;
              const numValue =
                value === '' ? '' : Math.max(0, Number(value) || 0);
              setYear(numValue);
            }}
          />

          <TextField
            label='Employee ID (optional)'
            placeholder='Enter employee id'
            size='small'
            sx={{ minWidth: 220 }}
            value={employeeId}
            onChange={event => setEmployeeId(event.target.value)}
            helperText='Leave blank to generate for all eligible employees'
          />

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant='contained'
            startIcon={
              loading ? <CircularProgress size={18} /> : <GenerateIcon />
            }
            onClick={handleGenerate}
            disabled={loading}
            sx={{
              minWidth: 180,
              textTransform: 'none',
              fontWeight: 600,
              alignSelf: { xs: 'stretch', md: 'center' },
            }}
          >
            {loading ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </Stack>
      </Paper>

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
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
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
                  Total Employees
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {records.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
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
                  Total Gross Salary
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {formatCurrency(totals.gross)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
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
                  Total Deductions
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {formatCurrency(totals.deductions)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
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
                  Total Net Salary
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {formatCurrency(totals.net)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
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
              Generate payroll to view employee payouts for the selected month.
            </Alert>
          </Box>
        ) : (
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align='right'>Gross Salary</TableCell>
                <TableCell align='right'>Total Deductions</TableCell>
                <TableCell align='right'>Bonuses</TableCell>
                <TableCell align='right'>Net Salary</TableCell>
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
                  <TableCell align='right'>
                    {formatCurrency(record.grossSalary)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(record.totalDeductions)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(record.bonuses || 0)}
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
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => openDetails(record)}
                      sx={{ textTransform: 'none' }}
                    >
                      View breakdown
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AppTable>
        )}
      </Paper>

      <AppFormModal
        open={detailsOpen && !!selectedRecord}
        onClose={closeDetails}
        onSubmit={() => {}}
        title='Payroll Breakdown'
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        paperSx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
      >
        <Box sx={{ pr: 1 }}>
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
                  Month/Year: {selectedRecord.month}/{selectedRecord.year}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  Working days: {selectedRecord.workingDays ?? '—'} | Present:{' '}
                  {selectedRecord.daysPresent ?? '—'} | Absent:{' '}
                  {selectedRecord.daysAbsent ?? '—'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Salary Components
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                      }}
                    >
                      <Typography variant='caption'>Gross Salary</Typography>
                      <Typography variant='h6'>
                        {formatCurrency(selectedRecord.grossSalary)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                      }}
                    >
                      <Typography variant='caption'>
                        Total Deductions
                      </Typography>
                      <Typography variant='h6'>
                        {formatCurrency(selectedRecord.totalDeductions)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                      }}
                    >
                      <Typography variant='caption'>Bonuses</Typography>
                      <Typography variant='h6'>
                        {formatCurrency(selectedRecord.bonuses || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                      }}
                    >
                      <Typography variant='caption'>Net Salary</Typography>
                      <Typography variant='h6'>
                        {formatCurrency(selectedRecord.netSalary)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
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
                    <AppTable>
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
                    </AppTable>
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
                  <AppTable>
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
                  </AppTable>
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
                  <AppTable>
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
                  </AppTable>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </AppFormModal>
    </Box>
  );
};

export default PayrollGeneration;
