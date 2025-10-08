import React from 'react';
import { Chip } from '@mui/material';
import type { AssetStatus, RequestStatus } from '../../types/asset';

interface StatusChipProps {
  status: AssetStatus | RequestStatus;
  type: 'asset' | 'request';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, type }) => {
  const getStatusConfig = () => {
    if (type === 'asset') {
      switch (status as AssetStatus) {
        case 'available':
          return { label: 'Available', color: 'success' as const, variant: 'filled' as const };
        case 'assigned':
          return { label: 'Assigned', color: 'info' as const, variant: 'filled' as const };
        case 'under_maintenance':
          return { label: 'Under Maintenance', color: 'warning' as const, variant: 'filled' as const };
        case 'retired':
          return { label: 'Retired', color: 'default' as const, variant: 'filled' as const };
        default:
          return { label: 'Unknown', color: 'default' as const, variant: 'filled' as const };
      }
    } else {
      switch (status as RequestStatus) {
        case 'pending':
          return { label: 'Pending', color: 'warning' as const, variant: 'filled' as const };
        case 'approved':
          return { label: 'Approved', color: 'success' as const, variant: 'filled' as const };
        case 'rejected':
          return { label: 'Rejected', color: 'error' as const, variant: 'filled' as const };
        case 'cancelled':
          return { label: 'Cancelled', color: 'default' as const, variant: 'filled' as const };
        default:
          return { label: 'Unknown', color: 'default' as const, variant: 'filled' as const };
      }
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant={config.variant}
      size="small"
      sx={{
        fontWeight: 500,
        minWidth: 'fit-content',
      }}
    />
  );
};

export default StatusChip;
