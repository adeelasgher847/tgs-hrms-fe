import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import PerformanceKpiGrid from './KPIPerformanceOverview';
import PerformanceTrendChart from './PerformanceTrend';
import PromotionsList from './PromotionsTable';
import { systemEmployeeApiService } from '../../api/systemEmployeeApi';
import type { Tenant } from '../../types';

const PerformanceDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>(
    'success'
  );

  const fetchTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const data = await systemEmployeeApiService.getAllTenants(true);
      setTenants(data);

      if (data.length > 0) {
        if (!selectedTenant || !data.find(t => t.id === selectedTenant)) {
          const testifyTenant = data.find(t => t.name === 'Testify Solutions');
          if (testifyTenant) {
            setSelectedTenant(testifyTenant.id);
          } else {
            setSelectedTenant(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setToastSeverity('error');
      setToastMessage('Failed to fetch tenants.');
      setShowToast(true);
    } finally {
      setLoadingTenants(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return (
    <Box>
      <Typography variant='h4' fontWeight={600} mb={2}>
        Performance Dashboard
      </Typography>

      <Box display='flex' gap={2} mb={3} flexWrap='wrap'>
        <FormControl size='small' sx={{ minWidth: 160, maxWidth: 220 }}>
          <Select
            value={selectedTenant || ''}
            onChange={e => setSelectedTenant(e.target.value)}
            disabled={loadingTenants || tenants.length === 0}
          >
            {loadingTenants ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : tenants.length === 0 ? (
              <MenuItem disabled>No tenants available</MenuItem>
            ) : (
              tenants.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {selectedTenant && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <PerformanceKpiGrid tenantId={selectedTenant} />
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <PerformanceTrendChart tenantId={selectedTenant} />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <PromotionsList tenantId={selectedTenant} />
          </Paper>
        </>
      )}

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={toastSeverity}
          variant='filled'
          onClose={() => setShowToast(false)}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PerformanceDashboard;
