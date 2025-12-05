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
  Pagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useOutletContext } from 'react-router-dom';
import { payrollApi, type PayrollRecord } from '../../api/payrollApi';
import { useIsDarkMode } from '../../theme';
import { useUser } from '../../hooks/useUser';
import { useLanguage } from '../../hooks/useLanguage';
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
      // Ignore JSON parse errors, continue with string parsing
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
  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'My Salary',
      noHistory: 'No payroll history available yet.',
      selectPayslip: 'Select a payslip from your history to view its details.',
      grossSalary: 'Gross Salary',
      totalDeductions: 'Total Deductions',
      bonuses: 'Bonuses',
      netSalary: 'Net Salary',
      allowancesHeading: 'Allowances',
      deductionsHeading: 'Deductions',
      remarksHeading: 'Remarks',
      allowancesTable: {
        type: 'Type',
        description: 'Description',
        amount: 'Amount',
      },
      period: 'Period',
      gross: 'Gross',
      net: 'Net',
      status: 'Status',
      actions: 'Actions',
      viewPayslip: 'View payslip',
      showingPage: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
      payslipDetailsTitle: 'Payslip Details',
      close: 'Close',
    },
    ar: {
      pageTitle: 'الراتب الخاص بي',
      noHistory: 'لا يوجد تاريخ رواتب حتى الآن.',
      selectPayslip: 'اختر قسيمة راتب من سجلك لعرض تفاصيلها.',
      grossSalary: 'الراتب الإجمالي',
      totalDeductions: 'إجمالي الخصومات',
      bonuses: 'المكافآت',
      netSalary: 'صافي الراتب',
      allowancesHeading: 'البدلات',
      deductionsHeading: 'الخصومات',
      remarksHeading: 'ملاحظات',
      allowancesTable: {
        type: 'النوع',
        description: 'الوصف',
        amount: 'المبلغ',
      },
      period: 'الفترة',
      gross: 'إجمالي',
      net: 'صافي',
      status: 'الحالة',
      actions: 'إجراءات',
      viewPayslip: 'عرض قسيمة الراتب',
      showingPage: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} إجمالي السجلات)`,
      payslipDetailsTitle: 'تفاصيل قسيمة الراتب',
      close: 'إغلاق',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;

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
  const itemsPerPage = 25;

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

      console.log('MySalary pagination state:', {
        currentPage,
        totalPages:
          backendTotalPages !== undefined
            ? backendTotalPages
            : backendTotal !== undefined
              ? Math.ceil(backendTotal / itemsPerPage) || 1
              : historyRecords.length === itemsPerPage
                ? currentPage + 1
                : currentPage,
        totalRecords:
          backendTotal !== undefined
            ? backendTotal
            : historyRecords.length === itemsPerPage
              ? currentPage * itemsPerPage
              : (currentPage - 1) * itemsPerPage + historyRecords.length,
        historyLength: historyRecords.length,
      });

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
        label: L.grossSalary,
        value: formatCurrency(detailRecord.grossSalary),
      },
      {
        label: L.totalDeductions,
        value: formatCurrency(detailRecord.totalDeductions),
      },
      {
        label: L.bonuses,
        value: formatCurrency(detailRecord.bonuses || 0),
      },
      {
        label: L.netSalary,
        value: formatCurrency(detailRecord.netSalary),
      },
    ];
  }, [detailRecord, L]);

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
      return <Alert severity='info'>{L.selectPayslip}</Alert>;
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
                {L.allowancesHeading}
              </Typography>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{L.allowancesTable.type}</TableCell>
                    <TableCell>{L.allowancesTable.description}</TableCell>
                    <TableCell align='right'>
                      {L.allowancesTable.amount}
                    </TableCell>
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
              {L.deductionsHeading}
            </Typography>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell>{L.tax || 'Tax'}</TableCell>
                  <TableCell align='right'>
                    {formatCurrency(detailRecord.deductionsBreakdown.tax || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{L.insurance || 'Insurance'}</TableCell>
                  <TableCell align='right'>
                    {formatCurrency(
                      detailRecord.deductionsBreakdown.insurance || 0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {L.leaveDeductions || 'Leave Deductions'}
                  </TableCell>
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
              {L.remarksHeading}
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
    L,
  ]);

  const historyTable = useMemo(() => {
    if (!history.length) {
      return <Alert severity='info'>{L.noHistory}</Alert>;
    }

    return (
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>{L.period}</TableCell>
            <TableCell align='right'>{L.gross}</TableCell>
            <TableCell align='right'>{L.net}</TableCell>
            <TableCell align='center'>{L.status}</TableCell>
            <TableCell align='center'>{L.actions}</TableCell>
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
                  <Tooltip title={L.viewPayslip}>
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
  }, [history, selectedRecordId, detailLoading, handleSelectRecord, L]);

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
        <Box
          sx={{
            display: 'flex',
            justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography
            variant='h4'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              fontWeight: 600,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.pageTitle}
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
                {L.showingPage(currentPage, totalPages, totalRecords)}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>{L.payslipDetailsTitle}</DialogTitle>
        <DialogContent dividers>{breakdownContent}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{L.close}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MySalary;
