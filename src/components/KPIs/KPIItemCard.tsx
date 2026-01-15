import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  useTheme,
  IconButton,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import type { EmployeeKPI } from '../../api/employeeKpiApi';
import { Icons } from '../../assets/icons';

interface KPIItemCardProps {
  kpi: EmployeeKPI;
  onUpdate?: (id: string) => void | Promise<void>;
}

const KPIItemCard: React.FC<KPIItemCardProps> = ({ kpi, onUpdate }) => {
  const theme = useTheme();

  const achievedPercent =
    kpi.targetValue > 0
      ? Math.min((kpi.achievedValue / kpi.targetValue) * 100, 100)
      : 0;

  const stars = Math.round(kpi.score || 0);
  const filledStars = Array(stars).fill('★').join('');
  const emptyStars = Array(5 - stars)
    .fill('☆')
    .join('');

  // Status & Color Logic
  let statusColor:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' = 'warning';
  if (kpi.kpi?.status === 'active') statusColor = 'success';
  else if (kpi.kpi?.status === 'inactive') statusColor = 'default';

  const progressBarColor =
    achievedPercent >= 90
      ? 'success.main'
      : achievedPercent >= 60
        ? 'warning.main'
        : 'error.main';

  return (
    <Paper
      variant='outlined'
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderColor: 'divider',
        transition: 'transform 0.2s, box-shadow 0.2s',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        gap={1}
      >
        <Box>
          <Typography
            variant='h6'
            fontWeight={700}
            color='text.primary'
            lineHeight={1.3}
          >
            {kpi.kpi?.title || 'Untitled KPI'}
          </Typography>
          <Typography variant='body2' color='text.secondary' mt={0.5}>
            {kpi.kpi?.description}
          </Typography>
        </Box>
        {onUpdate && (
          <IconButton
            size='small'
            onClick={() => onUpdate(kpi.id)}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <Box
              component='img'
              src={Icons.edit}
              sx={{
                width: 16,
                height: 16,
                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
              }}
            />
          </IconButton>
        )}
      </Box>

      <Box mb={2}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='end'
          mb={1}
        >
          <Typography variant='body2' fontWeight={600} color='text.secondary'>
            Progress
          </Typography>
          <Typography variant='body2' fontWeight={600} color='text.primary'>
            {achievedPercent.toFixed(0)}%
          </Typography>
        </Box>

        <Box
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'action.hover',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${achievedPercent}%`,
              height: '100%',
              backgroundColor: progressBarColor,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 5,
            }}
          />
        </Box>
        <Box display='flex' justifyContent='space-between' mt={1}>
          <Typography variant='caption' color='text.secondary'>
            Target:{' '}
            <Box component='span' fontWeight='bold' color='text.primary'>
              {kpi.targetValue}
            </Box>
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Achieved:{' '}
            <Box component='span' fontWeight='bold' color='text.primary'>
              {kpi.achievedValue}
            </Box>
          </Typography>
        </Box>
      </Box>

      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap mb={2}>
        <Chip
          label={kpi.reviewCycle || 'No Cycle'}
          size='small'
          sx={{
            borderRadius: '6px',
            fontWeight: 600,
            bgcolor:
              theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
            color:
              theme.palette.mode === 'dark'
                ? 'primary.contrastText'
                : 'primary.dark',
          }}
        />
        <Chip
          label={kpi.kpi?.category || 'General'}
          size='small'
          sx={{
            borderRadius: '6px',
            fontWeight: 600,
            bgcolor: theme.palette.mode === 'dark' ? 'info.dark' : 'info.light',
            color:
              theme.palette.mode === 'dark' ? 'info.contrastText' : 'info.dark',
          }}
        />
        {kpi.kpi?.status && (
          <Chip
            label={kpi.kpi?.status}
            size='small'
            color={statusColor}
            sx={{
              borderRadius: '6px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          />
        )}
      </Stack>

      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        pt={2}
        borderTop='1px solid'
        borderColor='divider'
      >
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          Score:
          <Box
            component='span'
            sx={{ color: 'warning.main', fontSize: '1.1rem', letterSpacing: 1 }}
          >
            {filledStars}
          </Box>
          <Box
            component='span'
            sx={{
              color: 'action.disabled',
              fontSize: '1.1rem',
              letterSpacing: 1,
            }}
          >
            {emptyStars}
          </Box>
        </Typography>

        {kpi.score > 0 && (
          <Typography variant='h6' fontWeight='800' color='primary.main'>
            {kpi.score.toFixed(1)}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default KPIItemCard;
