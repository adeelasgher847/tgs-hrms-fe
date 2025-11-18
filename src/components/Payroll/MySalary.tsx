import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useOutletContext } from 'react-router-dom';
import { payrollApi, type PayrollRecord } from '../../api/payrollApi';
import { useIsDarkMode } from '../../theme';
import { useUser } from '../../hooks/useUser';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';

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

const resolveEmployeeId = (): string | null => {
  try {
    const raw = localStorage.getItem('employeeId');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') {
        const parsedTrimmed = parsed.trim();
        return parsedTrimmed.length > 0 ? parsedTrimmed : null;
      }
    } catch {
      // Ignore JSON parse errors, try string parsing instead
    }

    const trimmed = raw.replace(/^"|"$/g, '').trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (error) {
    console.warn('Unable to read employeeId from localStorage:', error);
    return null;
  }
};

const MySalary: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { darkMode: outletDarkMode } = useOutletContext<{
    darkMode: boolean;
  }>();
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const fetchPayslip = useCallback(async (recordId: string | null) => {
    if (!recordId) {
      setDetailRecord(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    try {
      setDetailRecord(null);
      setDetailLoading(true);
      setDetailError(null);
      const data = await payrollApi.getPayrollPayslip(recordId);
      setDetailRecord(data);
    } catch (err) {
      console.error('Failed to load payslip details:', err);
      setDetailRecord(null);
      setDetailError('Failed to load payslip details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    const employeeIdentifier = resolveEmployeeId();
    if (!employeeIdentifier) {
      setError('EmployeeId not found');
      setLoading(false);
      setSelectedRecordId(null);
      setHistory([]);
      setDetailRecord(null);
      setDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const historyRecords =
        await payrollApi.getPayrollHistory(employeeIdentifier);

      const sortedHistory = historyRecords.slice().sort(
        (a, b) =>
          dayjs()
            .year(b.year)
            .month((b.month ?? 1) - 1)
            .date(1)
            .valueOf() -
          dayjs()
            .year(a.year)
            .month((a.month ?? 1) - 1)
            .date(1)
            .valueOf()
      );

      setHistory(sortedHistory);
      setSelectedRecordId(null);
      setDetailRecord(null);
      setDetailError(null);
      setDetailLoading(false);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to load salary data:', err);
      setError('Failed to load salary information.');
      setHistory([]);
      setSelectedRecordId(null);
      setDetailRecord(null);
      setDetailError(null);
      setDetailLoading(false);
      setDialogOpen(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRecord = useCallback(
    async (record: PayrollRecord) => {
      if (!record?.id || record.id === selectedRecordId) {
        return;
      }
      setSelectedRecordId(record.id);
      setDialogOpen(true);
      await fetchPayslip(record.id);
    },
    [selectedRecordId, fetchPayslip]
  );

  const summaryCards = useMemo(() => {
    if (!detailRecord) return [] as Array<{ label: string; value: string }>;
    return [
      {
        label: 'Gross Salary',
        value: formatCurrency(detailRecord.grossSalary),
      },
      {
        label: 'Total Deductions',
        value: formatCurrency(detailRecord.totalDeductions),
      },
      {
        label: 'Bonuses',
        value: formatCurrency(detailRecord.bonuses || 0),
      },
      {
        label: 'Net Salary',
        value: formatCurrency(detailRecord.netSalary),
      },
    ];
  }, [detailRecord]);

  const breakdownContent = useMemo(() => {
    if (detailLoading) {
      return (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (detailError) {
      return <Alert severity='error'>{detailError}</Alert>;
    }

    if (!detailRecord) {
      return (
        <Alert severity='info'>
          Select a payslip from your history to view its details.
        </Alert>
      );
    }

    return (
      <Stack spacing={3}>
        <Box>
          <Typography
            variant='body2'
            sx={{ color: effectiveDarkMode ? '#8f8f8f' : '#555' }}
          >
            Period: {detailRecord.month}/{detailRecord.year} – Status{' '}
            <Chip
              label={detailRecord.status}
              size='small'
              color={
                detailRecord.status === 'paid'
                  ? 'success'
                  : detailRecord.status === 'approved'
                    ? 'info'
                    : 'warning'
              }
              sx={{ ml: 1 }}
            />
          </Typography>
        </Box>

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
          {summaryCards.map(card => (
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
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {detailRecord.salaryBreakdown?.allowances &&
          detailRecord.salaryBreakdown.allowances.length > 0 && (
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
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
                  {detailRecord.salaryBreakdown.allowances.map(
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

        {detailRecord.deductionsBreakdown && (
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
              Deductions
            </Typography>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell>Tax</TableCell>
                  <TableCell align='right'>
                    {formatCurrency(detailRecord.deductionsBreakdown.tax || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Insurance</TableCell>
                  <TableCell align='right'>
                    {formatCurrency(
                      detailRecord.deductionsBreakdown.insurance || 0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Leave Deductions</TableCell>
                  <TableCell align='right'>
                    {formatCurrency(
                      detailRecord.deductionsBreakdown.leaveDeductions || 0
                    )}
                  </TableCell>
                </TableRow>
                {detailRecord.deductionsBreakdown.otherDeductions?.map(
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

        {detailRecord.remarks && (
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
              Remarks
            </Typography>
            <Typography variant='body2'>{detailRecord.remarks}</Typography>
          </Box>
        )}
      </Stack>
    );
  }, [
    detailLoading,
    detailError,
    detailRecord,
    summaryCards,
    effectiveDarkMode,
    theme.palette.divider,
  ]);

  const historyTable = useMemo(() => {
    if (!history.length) {
      return <Alert severity='info'>No payroll history available yet.</Alert>;
    }

    return (
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell align='right'>Gross</TableCell>
            <TableCell align='right'>Net</TableCell>
            <TableCell align='center'>Status</TableCell>
            <TableCell align='center'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map(record => {
            const isCurrent = record.id === selectedRecordId;
            return (
              <TableRow key={record.id} selected={isCurrent} hover>
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
                <TableCell align='center'>
                  <Tooltip title='View payslip'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => handleSelectRecord(record)}
                        disabled={
                          detailLoading && record.id !== selectedRecordId
                        }
                      >
                        <VisibilityIcon fontSize='small' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }, [history, selectedRecordId, detailLoading, handleSelectRecord]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity='warning'>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: effectiveDarkMode
          ? '#121212'
          : theme.palette.background.default,
        minHeight: '100vh',
        color: effectiveDarkMode ? '#fff' : '#000',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            My Salary
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 1,
            backgroundColor: effectiveDarkMode ? '#1a1a1a' : '#fff',
          }}
        >
          {historyTable}
        </Paper>
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Payslip Details</DialogTitle>
        <DialogContent dividers>{breakdownContent}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MySalary;
