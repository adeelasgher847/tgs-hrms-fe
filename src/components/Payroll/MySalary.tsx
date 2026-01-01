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
  Chip,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useOutletContext } from 'react-router-dom';
import { payrollApi, type PayrollRecord } from '../../api/payrollApi';
import { useIsDarkMode } from '../../theme';
import { useUser } from '../../hooks/useUser';
import { IoEyeOutline } from 'react-icons/io5';
import { PAGINATION } from '../../constants/appConstants';
import AppFormModal from '../common/AppFormModal';
import AppPageTitle from '../common/AppPageTitle';
import AppTable from '../common/AppTable';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';

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
      // Ignore JSON parse errors, continue with string parsing
    }

    const trimmed = raw.replace(/^"|"$/g, '').trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
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
  const role = normalizeRole(getUserRole());
  const isManager =
    role === 'manager' || (role as string) === 'payroll manager';
  const shouldUseAppTable = isManager || role === 'employee';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;

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
    } catch {
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

      const historyResponse = await payrollApi.getPayrollHistory(
        employeeIdentifier,
        { page: currentPage, limit: itemsPerPage }
      );

      const historyRecords = historyResponse.items || [];

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

      const backendTotalPages = historyResponse.totalPages;
      const backendTotal = historyResponse.total;

      if (backendTotalPages !== undefined) {
        setTotalPages(backendTotalPages);
      } else if (backendTotal !== undefined) {
        setTotalPages(Math.ceil(backendTotal / itemsPerPage) || 1);
      } else {
        setTotalPages(
          historyRecords.length === itemsPerPage ? currentPage + 1 : currentPage
        );
      }

      if (backendTotal !== undefined) {
        setTotalRecords(backendTotal);
      } else {
        setTotalRecords(
          historyRecords.length === itemsPerPage
            ? currentPage * itemsPerPage
            : (currentPage - 1) * itemsPerPage + historyRecords.length
        );
      }

      setSelectedRecordId(null);
      setDetailRecord(null);
      setDetailError(null);
      setDetailLoading(false);
      setDialogOpen(false);
    } catch {
      setError('Failed to load salary information.');
      setHistory([]);
      setSelectedRecordId(null);
      setDetailRecord(null);
      setDetailError(null);
      setDetailLoading(false);
      setDialogOpen(false);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [user]);

  const handleSelectRecord = useCallback(
    async (record: PayrollRecord) => {
      if (!record?.id) {
        return;
      }
      setSelectedRecordId(record.id);
      setDialogOpen(true);
      await fetchPayslip(record.id);
    },
    [fetchPayslip]
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

    const tableContent = (
      <>
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
                        <IoEyeOutline size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </>
    );

    return shouldUseAppTable ? (
      <AppTable>{tableContent}</AppTable>
    ) : (
      <Table size='small'>{tableContent}</Table>
    );
  }, [
    history,
    selectedRecordId,
    detailLoading,
    handleSelectRecord,
    shouldUseAppTable,
  ]);

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
      <Stack spacing={3}>
        <Box>
          <AppPageTitle sx={{ mb: 0 }}>My Salary</AppPageTitle>
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

          {history.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mt: 3,
                pt: 2,
              }}
            >
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#666' }}
              >
                Showing page {currentPage} of {totalPages} ({totalRecords} total
                records)
              </Typography>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color='primary'
                  size='small'
                  showFirstButton
                  showLastButton
                />
              )}
            </Box>
          )}
        </Paper>
      </Stack>

      <AppFormModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {}}
        title='Payslip Details'
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        paperSx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
      >
        {breakdownContent}
      </AppFormModal>
    </Box>
  );
};

export default MySalary;
