import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, IconButton, Stack } from '@mui/material';
import { promotionsApiService, type Promotion } from '../../api/promotionsApi';
import PromotionDetailsModal from './PromotionDetailsModal';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import PromotionRequestModal from './PromotionRequestModal';
import { isManager, isAdmin, isHRAdmin } from '../../utils/auth';
import { useUser } from '../../hooks/useUser';
import { IoEyeOutline } from 'react-icons/io5';
import { Icons } from '../../assets/icons';
import AppPageTitle from '../common/AppPageTitle';
import AppSearch from '../common/AppSearch';

const PromotionsList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
    null
  );
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const { showError } = useErrorHandler();
  const manager = isManager();
  const admin = isAdmin() || isHRAdmin();
  const { user } = useUser();
  const [search, setSearch] = useState('');

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params: { employeeId?: string; page: number; limit: number } = {
        page: 1,
        limit: 25,
      };

      // Employees should only see their own promotions. Managers and admins see tenant-wide list.
      if (!admin && !manager) {
        params.employeeId = user?.id;
      }

      const res = await promotionsApiService.getPromotions(params);
      setPromotions(res.items || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const filteredPromotions = promotions.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.newDesignation || '').toLowerCase().includes(q) ||
      (p.employee?.name || p.employee_id || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      <AppPageTitle>Promotions</AppPageTitle>
      <AppCard sx={{ mb: 3, p: 2 }}>
        <Box display='flex' gap={2} alignItems='center'>
          <Box flex={1}>
            <AppSearch value={search} onChange={e => setSearch(e.target.value)} placeholder='Search promotions by employee, designation or status' />
          </Box>
          {manager && (
            <AppButton
              text='Request Promotion'
              variantType='primary'
              onClick={() => setRequestOpen(true)}
            />
          )}
        </Box>
      </AppCard>

      {loading ? (
        <Box display='flex' justifyContent='center' p={6}>
          <CircularProgress />
        </Box>
      ) : filteredPromotions.length === 0 ? (
        <AppCard>
          <Typography color='text.secondary'>No promotions found.</Typography>
        </AppCard>
      ) : (
        <Grid container spacing={3}>
          {filteredPromotions.map(p => (
            <Grid size={{ xs: 12, md: 6 }} key={p.id}>
              <AppCard sx={{ cursor: 'default', position: 'relative' }}>
                <Box onClick={() => setSelectedPromotionId(p.id)} sx={{ cursor: 'pointer' }}>
                  <Typography variant='subtitle1' fontWeight={700}>
                    {p.newDesignation}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Employee: {p.employee?.name || p.employee_id}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Effective: {p.effectiveDate}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Status: {p.status}
                  </Typography>
                </Box>

                <Stack direction='row' spacing={1} sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <IconButton size='small' onClick={() => setSelectedPromotionId(p.id)} aria-label='View'>
                    <IoEyeOutline size={18} />
                  </IconButton>
                  {manager && p.status === 'pending' && (
                    <IconButton
                      size='small'
                      onClick={() => setEditingPromotion(p)}
                      aria-label='Edit'
                      sx={{ color: 'var(--primary-main-color)' }}
                    >
                      <Box component='img' src={Icons.edit} alt='Edit' sx={{ width: 18, height: 18 }} />
                    </IconButton>
                  )}
                  {admin && p.status === 'pending' && (
                    <IconButton
                      size='small'
                      onClick={() => setSelectedPromotionId(p.id)}
                      aria-label='Approve'
                      sx={{ color: 'green' }}
                    >
                      <Box component='img' src={Icons.check} alt='Approve' sx={{ width: 18, height: 18 }} />
                    </IconButton>
                  )}
                </Stack>
              </AppCard>
            </Grid>
          ))}
        </Grid>
      )}

      <PromotionRequestModal
        open={requestOpen || !!editingPromotion}
        onClose={() => {
          setRequestOpen(false);
          setEditingPromotion(null);
        }}
        onSuccess={() => {
          setRequestOpen(false);
          setEditingPromotion(null);
          fetchPromotions();
        }}
        preSelectedEmployeeId={editingPromotion?.employee?.id || undefined}
        initialData={editingPromotion ? {
          employeeId: editingPromotion.employee?.id || editingPromotion.employee_id,
          previousDesignation: editingPromotion.previousDesignation,
          newDesignation: editingPromotion.newDesignation,
          effectiveDate: editingPromotion.effectiveDate,
          remarks: editingPromotion.remarks || undefined,
        } : undefined}
      />
      <PromotionDetailsModal
        open={!!selectedPromotionId}
        promotionId={selectedPromotionId}
        onClose={() => setSelectedPromotionId(null)}
        onUpdated={fetchPromotions}
      />
    </Box>
  );
};

export default PromotionsList;
