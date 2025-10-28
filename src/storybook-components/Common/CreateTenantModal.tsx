import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { useTheme } from '../theme';

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tenantName: string) => void;
  editTenant?: {
    id: string;
    name: string;
  } | null;
  loading?: boolean;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  open,
  onClose,
  onSubmit,
  editTenant = null,
  loading = false,
}) => {
  const { theme } = useTheme();
  const [formName, setFormName] = useState('');

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (editTenant) {
        setFormName(editTenant.name);
      } else {
        setFormName('');
      }
    }
  }, [open, editTenant]);

  const handleSubmit = () => {
    if (formName.trim()) {
      onSubmit(formName.trim());
    }
  };

  const handleClose = () => {
    setFormName('');
    onClose();
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{ 
          p: 4, 
          minWidth: 320, 
          backgroundColor: 'var(--bg-card)', 
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <Typography
          variant='h6'
          mb={2}
          sx={{ 
            textAlign: 'left',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {editTenant ? 'Edit Tenant' : 'Create Tenant'}
        </Typography>
        
        <input
          type='text'
          value={formName}
          onChange={e => setFormName(e.target.value)}
          placeholder='Tenant Name'
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-lg)',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            direction: 'ltr',
            boxSizing: 'border-box',
          }}
        />
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ 
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family-primary)',
              '&:hover': {
                backgroundColor: 'var(--bg-hover)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={!formName.trim() || loading}
            sx={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--primary-text)',
              fontFamily: 'var(--font-family-primary)',
              '&:hover': { 
                backgroundColor: 'var(--primary-dark)',
              },
              '&:disabled': {
                backgroundColor: 'var(--text-muted)',
                color: 'var(--text-secondary)',
              },
            }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateTenantModal;
