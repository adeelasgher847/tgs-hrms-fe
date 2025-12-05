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
import {
  systemPerformanceApiService,
  type PromotionRecord,
  type PromotionStats,
} from '../../api/systemPerformanceApi';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { formatDate } from '../../utils/dateUtils';
import { PAGINATION } from '../../constants/appConstants';

interface PromotionsListProps {
  tenantId: string;
}

const PromotionsList: React.FC<PromotionsListProps> = ({ tenantId }) => {
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
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;

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
    } catch {
      // Ignore name lookup failures; table will fall back to IDs
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
    } catch {
      // Leave previous promotions state if fetch fails
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
      <Typography variant='h5' fontWeight={600} gutterBottom>
        Promotions Tracking
      </Typography>

      <Box display='flex' gap={1.5} mb={1} flexWrap='wrap' alignItems='center'>
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label='Status'
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <MenuItem value=''>
              <em>All</em>
            </MenuItem>
            <MenuItem value='pending'>Pending</MenuItem>
            <MenuItem value='approved'>Approved</MenuItem>
            <MenuItem value='rejected'>Rejected</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size='small'
          label='Start Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />

        <TextField
          size='small'
          label='End Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
        />

        <Button variant='contained' onClick={() => setCurrentPage(1)}>
          Apply Filters
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
            <Typography variant='h6' sx={{ mb: 1 }}>
              Stats:{' '}
            </Typography>
            <Box display='flex' gap={1}>
              <Chip label={`Approved: ${s.approvedCount}`} color='success' />
              <Chip label={`Pending: ${s.pendingCount}`} color='warning' />
              <Chip label={`Rejected: ${s.rejectedCount}`} color='error' />
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 2, overflow: 'auto', boxShadow: 'none' }}>
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
                <TableCell>Employee</TableCell>
                <TableCell>Previous Designation</TableCell>
                <TableCell>New Designation</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tenant</TableCell>
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
                    No promotions found.
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
            Showing page {currentPage} of {totalPages} ({totalRecords} total
            records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PromotionsList;
