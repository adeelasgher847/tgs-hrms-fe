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
  CircularProgress,
} from '@mui/material';
import PerformanceKpiGrid from './KPIPerformanceOverview';
import PerformanceTrendChart from './PerformanceTrend';
import PromotionsList from './PromotionsTable';
import { systemEmployeeApiService } from '../../api/systemEmployeeApi';
import type { Tenant } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

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
      // Filter to only show active tenants
      const activeTenants = data.filter(t => t.status === 'active');
      setTenants(activeTenants);

      if (activeTenants.length > 0) {
        if (
          !selectedTenant ||
          !activeTenants.find(t => t.id === selectedTenant)
        ) {
          const testifyTenant = activeTenants.find(
            t => t.name === 'Testify Solutions'
          );
          if (testifyTenant) {
            setSelectedTenant(testifyTenant.id);
          } else {
            setSelectedTenant(activeTenants[0].id);
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

  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'Performance Dashboard',
      loading: 'Loading...',
      noTenants: 'No tenants available',
      failedFetch: 'Failed to fetch tenants.',
    },
    ar: {
      pageTitle: 'لوحة أداء',
      loading: 'جارٍ التحميل...',
      noTenants: 'لا توجد مستأجرين متاحين',
      failedFetch: 'فشل في جلب المستأجرين.',
    },
  } as const;

  const L = labels[language] || labels.en;

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
        sx={{ gap: 2 }}
      >
        {language === 'ar' ? (
          <>
            <Box>
              <FormControl
                size='small'
                sx={{ minWidth: 160, maxWidth: 220 }}
                dir='ltr'
              >
                <Select
                  value={selectedTenant || ''}
                  onChange={e => setSelectedTenant(e.target.value)}
                  disabled={loadingTenants || tenants.length === 0}
                >
                  {loadingTenants ? (
                    <MenuItem disabled>{L.loading}</MenuItem>
                  ) : tenants.length === 0 ? (
                    <MenuItem disabled>{L.noTenants}</MenuItem>
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

            <Typography
              variant='h4'
              fontWeight={600}
              mb={2}
              dir='rtl'
              sx={{ textAlign: 'right' }}
            >
              {L.pageTitle}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant='h4'
              fontWeight={600}
              mb={2}
              dir='ltr'
              sx={{ textAlign: 'left' }}
            >
              {L.pageTitle}
            </Typography>

            <Box>
              <FormControl size='small' sx={{ minWidth: 160, maxWidth: 220 }}>
                <Select
                  value={selectedTenant || ''}
                  onChange={e => setSelectedTenant(e.target.value)}
                  disabled={loadingTenants || tenants.length === 0}
                >
                  {loadingTenants ? (
                    <MenuItem disabled>{L.loading}</MenuItem>
                  ) : tenants.length === 0 ? (
                    <MenuItem disabled>{L.noTenants}</MenuItem>
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
          </>
        )}
      </Box>

      {loadingTenants || !selectedTenant ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{mb: 3, boxShadow:'none' ,backgroundColor:'unset'}}>
            <PerformanceKpiGrid tenantId={selectedTenant} />
          </Paper>

          <Paper sx={{ mb: 3, boxShadow: 'none' }}>
            <PerformanceTrendChart tenantId={selectedTenant} />
          </Paper>

          <Paper sx={{ p: 2, boxShadow: 'none' }}>
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
