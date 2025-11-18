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
  CircularProgress,
} from '@mui/material';
import {
  systemPerformanceApiService,
  type PromotionRecord,
  type PromotionStats,
} from '../../api/systemPerformanceApi';

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

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      // Build dynamic filter params
      const params: {
        tenantId: string;
        status?: 'pending' | 'approved' | 'rejected';
        startDate?: string;
        endDate?: string;
      } = { tenantId }; // Always include tenantId

      if (
        filters.status &&
        ['pending', 'approved', 'rejected'].includes(filters.status)
      ) {
        params.status = filters.status as 'pending' | 'approved' | 'rejected';
      }
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { promotions, stats } =
        await systemPerformanceApiService.getPromotions(params);
      setPromotions(promotions);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters.status, filters.startDate, filters.endDate]);

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
    fetchPromotions();
  }, [fetchPromotions]);

  return (
    <Box>
      <Typography variant='h5' fontWeight={600} gutterBottom>
        Promotions Tracking
      </Typography>

      <Box display='flex' gap={2} mb={1} flexWrap='wrap'>
        <FormControl sx={{ minWidth: 200 }}>
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
          label='Start Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />

        <TextField
          label='End Date'
          type='date'
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
        />

        <Button variant='contained' onClick={fetchPromotions}>
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
              flexDirection:'column',
              boxShadow:'none'
            }}
          >
            <Typography variant='h6' sx={{mb:1}}>Stats: </Typography>
            <Box display='flex' gap={1}>
              <Chip label={`Approved: ${s.approvedCount}`} color='success' />
              <Chip label={`Pending: ${s.pendingCount}`} color='warning' />
              <Chip label={`Rejected: ${s.rejectedCount}`} color='error' />
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 2,overflowX:'scroll'}}>
        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{  }}>
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
                    <TableCell>{p.employee?.user_id}</TableCell>
                    <TableCell>{p.previousDesignation}</TableCell>
                    <TableCell>{p.newDesignation}</TableCell>
                    <TableCell>
                      {new Date(p.effectiveDate).toLocaleDateString()}
                    </TableCell>
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
    </Box>
  );
};

export default PromotionsList;
