import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import {
  systemPerformanceApiService,
  type PromotionRecord,
  type PromotionStats,
} from '../../api/systemPerformanceApi';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { formatDate } from '../../utils/dateUtils';

interface PromotionsListProps {
  tenantId: string;
}

const PromotionsList: React.FC<PromotionsListProps> = ({ tenantId }) => {
  const { language } = useLanguage();
  const labels = {
    en: {
      title: 'Promotions Tracking',
      statusLabel: 'Status',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      startDate: 'Start Date',
      endDate: 'End Date',
      applyFilters: 'Apply Filters',
      statsTitle: 'Stats:',
      approvedPrefix: 'Approved',
      pendingPrefix: 'Pending',
      rejectedPrefix: 'Rejected',
      employeeCol: 'Employee',
      prevDesignationCol: 'Previous Designation',
      newDesignationCol: 'New Designation',
      effectiveDateCol: 'Effective Date',
      statusCol: 'Status',
      tenantCol: 'Tenant',
      noRecords: 'No promotions found.',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      title: 'تتبع الترقيات',
      statusLabel: 'الحالة',
      all: 'الكل',
      pending: 'قيد الانتظار',
      approved: 'موافقة',
      rejected: 'مرفوضة',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      applyFilters: 'تطبيق المرشحات',
      statsTitle: 'الإحصائيات:',
      approvedPrefix: 'الموافق عليها',
      pendingPrefix: 'قيد الانتظار',
      rejectedPrefix: 'المرفوضة',
      employeeCol: 'الموظف',
      prevDesignationCol: 'المسمى الوظيفي السابق',
      newDesignationCol: 'المسمى الوظيفي الجديد',
      effectiveDateCol: 'تاريخ السريان',
      statusCol: 'الحالة',
      tenantCol: 'المستأجر',
      noRecords: 'لم يتم العثور على ترقيات.',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const L = labels[language] || labels.en;
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [stats, setStats] = useState<PromotionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>(
    {}
  );
  const itemsPerPage = 25;

  const fetchEmployeeNames = useCallback(async (employeeIds: string[]) => {
    if (employeeIds.length === 0) return;

    try {
      const response = await systemEmployeeApiService.getSystemEmployees({
        page: null,
      });

      const employeesData = Array.isArray(response)
        ? response
        : 'items' in response
          ? response.items
          : [];

      const namesMap: Record<string, string> = {};

      employeesData.forEach((emp: { id: string; name?: string }) => {
        if (emp.id && employeeIds.includes(emp.id)) {
          const name = emp.name || '';
          if (name) {
            namesMap[emp.id] = name;
          }
        }
      });

      setEmployeeNames(prev => ({ ...prev, ...namesMap }));
    } catch (error) {
      console.error('Failed to fetch employee names:', error);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        tenantId: string;
        status?: 'pending' | 'approved' | 'rejected';
        startDate?: string;
        endDate?: string;
        page?: number;
      } = { tenantId, page: currentPage };

      if (
        filters.status &&
        ['pending', 'approved', 'rejected'].includes(filters.status)
      ) {
        params.status = filters.status as 'pending' | 'approved' | 'rejected';
      }
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await systemPerformanceApiService.getPromotions(params);
      const promotionsArray = Array.isArray(response.promotions)
        ? response.promotions
        : [];
      setPromotions(promotionsArray);
      setStats(Array.isArray(response.stats) ? response.stats : []);

      const employeeIds = [
        ...new Set(promotionsArray.map(p => p.employee_id).filter(Boolean)),
      ];
      if (employeeIds.length > 0) {
        await fetchEmployeeNames(employeeIds);
      }

      if (response.totalPages !== undefined && response.total !== undefined) {
        setTotalPages(response.totalPages);
        setTotalRecords(response.total);
      } else {
        const hasMorePages = promotionsArray.length === itemsPerPage;
        setTotalPages(hasMorePages ? currentPage + 1 : currentPage);
        setTotalRecords(
          hasMorePages
            ? currentPage * itemsPerPage
            : (currentPage - 1) * itemsPerPage + promotionsArray.length
        );
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [
    tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    currentPage,
    itemsPerPage,
    fetchEmployeeNames,
  ]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const getEmployeeName = (employeeId: string): string => {
    return employeeNames[employeeId] || employeeId || 'N/A';
  };

  return (
    <Box>
      <Typography
        variant='h5'
        fontWeight={600}
        gutterBottom
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
      >
        {L.title}
      </Typography>

      <Box display='flex' gap={1.5} mb={1} flexWrap='wrap' alignItems='center'>
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>{L.statusLabel}</InputLabel>
          <Select
            value={filters.status}
            label={L.statusLabel}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <MenuItem value=''>
              <em>{L.all}</em>
            </MenuItem>
            <MenuItem value='pending'>{L.pending}</MenuItem>
            <MenuItem value='approved'>{L.approved}</MenuItem>
            <MenuItem value='rejected'>{L.rejected}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size='small'
          label={L.startDate}
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />

        <TextField
          size='small'
          label={L.endDate}
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
        />

        <Button variant='contained' onClick={() => setCurrentPage(1)}>
          {L.applyFilters}
        </Button>
      </Box>

      <Box display='flex' gap={2} mb={2} flexWrap='wrap'>
        {stats.map(s => (
          <Paper
            key={s.tenantId}
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              boxShadow: 'none',
            }}
          >
            <Typography
              variant='h6'
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              sx={{ mb: 1, textAlign: language === 'ar' ? 'right' : 'left' }}
            >
              {L.statsTitle}
            </Typography>
            <Box display='flex' gap={1}>
              <Chip
                label={`${L.approvedPrefix}: ${s.approvedCount}`}
                color='success'
              />
              <Chip
                label={`${L.pendingPrefix}: ${s.pendingCount}`}
                color='warning'
              />
              <Chip
                label={`${L.rejectedPrefix}: ${s.rejectedCount}`}
                color='error'
              />
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 2,overflow: 'auto', boxShadow: 'none' }}>
        {loading ? (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='200px'
          >
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{}}>
            <TableHead>
              <TableRow>
                <TableCell>{L.employeeCol}</TableCell>
                <TableCell>{L.prevDesignationCol}</TableCell>
                <TableCell>{L.newDesignationCol}</TableCell>
                <TableCell>{L.effectiveDateCol}</TableCell>
                <TableCell>{L.statusCol}</TableCell>
                <TableCell>{L.tenantCol}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.length > 0 ? (
                promotions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{getEmployeeName(p.employee_id)}</TableCell>
                    <TableCell>{p.previousDesignation}</TableCell>
                    <TableCell>{p.newDesignation}</TableCell>
                    <TableCell>{formatDate(p.effectiveDate)}</TableCell>
                    <TableCell>
                      <Chip label={p.status} color={statusColor(p.status)} />
                    </TableCell>
                    <TableCell>{p.tenant?.name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    {L.noRecords}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Pagination */}
      {(() => {
        // Get current page record count
        const currentPageRowsCount = promotions.length;
        
        // Pagination buttons logic:
        // - On first page: Only show if current page has full limit (to indicate more pages exist)
        // - On other pages (including last page): Always show if there are multiple pages
        // This allows navigation between pages even from the last page
        const shouldShowPagination =
          totalPages > 1 &&
          (currentPage === 1
            ? currentPageRowsCount === itemsPerPage // First page: only show if full limit
            : true); // Other pages: always show if totalPages > 1
        
        return shouldShowPagination ? (
          <Box display='flex' justifyContent='center' mt={3}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        ) : null;
      })()}

      {/* Pagination Info */}
      {promotions.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {L.showingInfo(currentPage, totalPages, totalRecords)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PromotionsList;
