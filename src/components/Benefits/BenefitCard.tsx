import React from 'react';
import { Box, Typography, Paper, Chip, Divider, Button } from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';

interface BenefitCardProps {
  name: string;
  type: string;
  eligibilityCriteria: string;
  description?: string;
  status: string;
  onCancel?: () => void;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  name,
  type,
  eligibilityCriteria,
  description,
  status,
  onCancel,
}) => {
  const { language } = useLanguage();

  const labels = {
    en: {
      typeLabel: 'Type:',
      statusLabel: 'Status:',
      eligibilityLabel: 'Eligibility:',
      descriptionLabel: 'Description:',
      cancel: 'Cancel Benefit',
    },
    ar: {
      typeLabel: 'النوع:',
      statusLabel: 'الحالة:',
      eligibilityLabel: 'معايير الأهلية:',
      descriptionLabel: 'الوصف:',
      cancel: 'إلغاء الميزة',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
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
      elevation={3}
      sx={{
        p: 2.5,
        minWidth: 320,
        maxWidth: 380,
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
          {L.typeLabel}
        </Typography>
        <Chip
          label={type}
          color={type === 'Monetary' ? 'success' : 'primary'}
          size='small'
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          {L.statusLabel}
        </Typography>
        <Chip label={status} color={getStatusColor()} size='small' />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          {L.eligibilityLabel}
        </Typography>
        <Typography variant='body2'>{eligibilityCriteria}</Typography>
      </Box>

      {description && (
        <Box sx={{ mt: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            {L.descriptionLabel}
          </Typography>
          <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
            {description}
          </Typography>
        </Box>
      )}

      {onCancel && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            color='error'
            size='small'
            onClick={onCancel}
          >
            {L.cancel}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default BenefitCard;
