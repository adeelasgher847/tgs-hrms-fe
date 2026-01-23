import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import AppButton from '../common/AppButton';

interface BenefitCardProps {
  name: string;
  type: string;
  eligibilityCriteria: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  onCancel?: () => void;
  onReimburse?: () => void;
  children?: React.ReactNode;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  name,
  type,
  eligibilityCriteria,
  description,
  status,
  startDate,
  endDate,
  onCancel,
  onReimburse,
  children,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'default';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minWidth: 320,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Typography variant='h6' fontWeight={600}>
        {name}
      </Typography>

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          Type:
        </Typography>
        <Chip
          label={type}
          color={type === 'Monetary' ? 'success' : undefined}
          size='small'
          sx={
            type === 'Monetary'
              ? undefined
              : {
                backgroundColor: 'var(--primary-dark-color)',
                color: '#FFFFFF',
                '& .MuiChip-label': { fontWeight: 500 },
              }
          }
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          Status:
        </Typography>
        <Chip label={status} color={getStatusColor()} size='small' />
      </Box>

      {startDate && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Start Date:
          </Typography>
          <Typography variant='body2'>{startDate}</Typography>
        </Box>
      )}

      {endDate && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            End Date:
          </Typography>
          <Typography variant='body2'>{endDate}</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          Eligibility:
        </Typography>
        <Typography variant='body2'>{eligibilityCriteria}</Typography>
      </Box>

      {description && (
        <Box sx={{ mt: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Description:
          </Typography>
          <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
            {description}
          </Typography>
        </Box>
      )}

      {onReimburse && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <AppButton
            variant='contained'
            variantType='primary'
            size='small'
            text='Request Reimbursement'
            onClick={onReimburse}
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          />
          {onCancel && (
            <AppButton
              variant='contained'
              color='error'
              size='small'
              text='Cancel Benefit'
              onClick={onCancel}
            />
          )}
        </Box>
      )}

      {!onReimburse && onCancel && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <AppButton
            variant='contained'
            color='error'
            size='small'
            text='Cancel Benefit'
            onClick={onCancel}
          />
        </Box>
      )}

      {children && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box>{children}</Box>
        </>
      )}
    </Paper>
  );
};

export default BenefitCard;
