import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Divider,
  useTheme,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  employeeKpiApiService,
  type EmployeeKPI,
  type TeamKPISummary,
} from '../../api/employeeKpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import KPIItemCard from '../KPIs/KPIItemCard';
import AppButton from '../common/AppButton';

interface EmployeeKPIDetailsModalProps {
  open: boolean;
  onClose: () => void;
  summary: TeamKPISummary | null;
  onUpdateKPI?: (kpiId: string) => void | Promise<void>;
}

const EmployeeKPIDetailsModal: React.FC<EmployeeKPIDetailsModalProps> = ({
  open,
  onClose,
  summary,
  onUpdateKPI,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<EmployeeKPI[]>([]);
  const { showError } = useErrorHandler();

  const fetchKPIs = useCallback(async () => {
    if (!summary) return;
    setLoading(true);
    try {
      const params: any = { employeeId: summary.employeeId };
      if (summary.cycle !== 'All Time') {
        params.cycle = summary.cycle;
      }
      const data = await employeeKpiApiService.getEmployeeKPIs(params);
      setKpis(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [summary, showError]);

  useEffect(() => {
    if (open && summary) {
      fetchKPIs();
    }
  }, [open, summary, fetchKPIs]);

  if (!summary) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            {summary.employeeName.charAt(0)}
          </Avatar>
          <Box>
            <Typography
              variant='h6'
              fontWeight='700'
              color={theme.palette.text.primary}
            >
              Performance Details
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {summary.employeeName} • {summary.cycle}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size='small'
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          p: 4,
          bgcolor: 'action.hover',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome/Safari/Edge
          },
        }}
      >
        {loading ? (
          <Box display='flex' justifyContent='center' py={10}>
            <CircularProgress />
          </Box>
        ) : kpis.length === 0 ? (
          <Box textAlign='center' py={10}>
            <Typography color='text.secondary'>
              No detailed KPIs found for this cycle.
            </Typography>
          </Box>
        ) : (
          <Box display='flex' flexDirection='column' gap={4}>
            {Object.entries(
              kpis.reduce((acc: Record<string, EmployeeKPI[]>, k) => {
                const cycle = k.reviewCycle || 'Unknown Cycle';
                if (!acc[cycle]) acc[cycle] = [];
                acc[cycle].push(k);
                return acc;
              }, {})
            )
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([cycle, cycleKpis]) => (
                <Box key={cycle}>
                  <Typography
                    variant='subtitle1'
                    fontWeight='700'
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'primary.main',
                      '&::after': {
                        content: '""',
                        flex: 1,
                        height: '1px',
                        bgcolor: 'divider',
                      },
                    }}
                  >
                    {cycle}
                  </Typography>
                  <Box
                    display='grid'
                    gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
                    gap={3}
                  >
                    {cycleKpis.map(kpi => (
                      <KPIItemCard
                        key={kpi.id}
                        kpi={kpi}
                        onUpdate={
                          onUpdateKPI
                            ? async (kpiId: string) => {
                                try {
                                  // Close the details modal first
                                  onClose();
                                  // Delay opening update modal to allow details modal to finish closing
                                  await new Promise(resolve =>
                                    setTimeout(resolve, 300)
                                  );
                                  await onUpdateKPI(kpiId);
                                } catch (err) {
                                  // swallow errors; user will see UI feedback via showError in caller
                                }
                              }
                            : undefined
                        }
                      />
                    ))}
                  </Box>
                </Box>
              ))}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5 }}>
        <AppButton text='Close' onClick={onClose} variantType='secondary' />
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeKPIDetailsModal;
