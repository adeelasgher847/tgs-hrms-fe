import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';

interface BenefitCardProps {
  name: string;
  type: string;
  eligibility: string;
  description?: string;
  startDate?: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  name,
  type,
  eligibility,
  description,
  startDate,
}) => {
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
          Type:
        </Typography>
        <Chip
          label={type}
          color={type === 'Monetary' ? 'success' : 'primary'}
          size='small'
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'></Typography>
        <Typography variant='body2'>{eligibility}</Typography>
      </Box>

      {startDate && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Start Date:
          </Typography>
          <Typography variant='body2'>{startDate}</Typography>
        </Box>
      )}

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
    </Paper>
  );
};

export default BenefitCard;
