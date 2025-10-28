import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useTheme } from '../theme';

interface DeleteTenantModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tenantName?: string;
  loading?: boolean;
}

const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  open,
  onClose,
  onConfirm,
  tenantName = 'Acme Corporation',
  loading = false,
}) => {
  const { theme } = useTheme();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          textAlign: 'center', 
          pb: 1,
          fontFamily: 'var(--font-family-primary)',
          fontWeight: 'var(--font-weight-semibold)',
        }}
      >
        Confirm Delete?
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <WarningIcon
            sx={{ 
              fontSize: 64, 
              color: 'var(--chart-color-6)', 
              mb: 2 
            }}
          />
          <Typography 
            variant='body1' 
            sx={{ 
              mb: 2, 
              lineHeight: 1.6,
              fontFamily: 'var(--font-family-primary)',
              color: 'var(--text-primary)',
            }}
          >
            Are you sure you want to delete the tenant "{tenantName}"? This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
          disabled={loading}
          sx={{ 
            color: 'var(--text-primary)', 
            borderColor: 'var(--border-primary)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              borderColor: 'var(--primary-color)',
              backgroundColor: 'var(--bg-hover)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={handleConfirm}
          disabled={loading}
          sx={{
            backgroundColor: 'var(--chart-color-6)',
            color: 'var(--text-light)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: '#b91c1c',
            },
            '&:disabled': {
              backgroundColor: 'var(--text-muted)',
              color: 'var(--text-secondary)',
            },
          }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTenantModal;
