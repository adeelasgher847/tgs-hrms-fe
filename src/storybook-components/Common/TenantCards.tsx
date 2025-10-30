import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTheme } from '../theme';
import edit from './edit.svg';
import deleteIcon from './ui-delete.svg';
import DeleteTenantModal from './DeleteTenantModal';

// Mock tenant data
const mockTenants = [
  { id: '1', name: 'Acme Corporation' },
  { id: '2', name: 'Tech Solutions Inc' },
  { id: '3', name: 'Global Industries' },
  { id: '4', name: 'Digital Innovations' },
];

interface TenantCardsProps {
  tenants?: typeof mockTenants;
  loading?: boolean;
  onCreateTenant?: () => void;
  onEditTenant?: (tenant: any) => void;
  onDeleteTenant?: (tenant: any) => void;
}

const TenantCards: React.FC<TenantCardsProps> = ({
  tenants = mockTenants,
  loading = false,
  onCreateTenant,
  onEditTenant,
  onDeleteTenant,
}) => {
  const { theme } = useTheme();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const handleEdit = (tenant: any) => {
    onEditTenant?.(tenant);
  };

  const handleDelete = (tenant: any) => {
    // Do not open modal; keep icon only with no action
    if (onDeleteTenant) {
      onDeleteTenant(tenant);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTenant) {
      onDeleteTenant?.(selectedTenant);
    }
    setDeleteModalOpen(false);
    setSelectedTenant(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSelectedTenant(null);
  };

  const handleCreate = () => {
    onCreateTenant?.();
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          boxShadow: 'none',
          border: '1px solid var(--border-primary)',
        }}
      >
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={200}
        >
          <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        </Box>
      </Paper>
    );
  }

  if (tenants.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          boxShadow: 'none',
          border: '1px solid var(--border-primary)',
        }}
      >
        <BusinessIcon sx={{ fontSize: 64, color: 'var(--text-secondary)', mb: 2 }} />
        <Typography 
          variant='h6' 
          color='var(--text-secondary)' 
          gutterBottom
          fontFamily='var(--font-family-primary)'
        >
          No Tenants Found
        </Typography>
        <Typography 
          variant='body2' 
          color='var(--text-secondary)' 
          sx={{ mb: 3 }}
          fontFamily='var(--font-family-primary)'
        >
          Get started by creating your first tenant
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ 
            boxShadow: 'none', 
            '&:hover': { boxShadow: 'none' },
            backgroundColor: 'var(--primary-color)',
            color: 'var(--primary-text)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: 'var(--primary-dark)',
            },
          }}
        >
          Create First Tenant
        </Button>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'flex-start',
      }}
    >
        {tenants.map(tenant => (
          <Box
            key={tenant.id}
            sx={{
              width: {
                xs: '100%',
                sm: 'calc(50% - 12px)',
                md: 'calc(50% - 12px)',
              },
            }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                px: 2,
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'unset',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant='h6'
                    component='h2'
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontFamily: 'var(--font-family-primary)',
                    }}
                  >
                    {tenant.name}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions
                sx={{ justifyContent: 'flex-start', px: 2, pb: 2 }}
              >
                <Box display='flex' width={100}>
                  <IconButton
                    onClick={() => handleEdit(tenant)}
                    color='success'
                    size='small'
                    sx={{
                      border: '1px solid var(--border-primary)',
                      borderTopLeftRadius: '5px',
                      borderBottomLeftRadius: '5px',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      '&:hover': {
                        backgroundColor: 'orange',
                        color: 'white',
                      },
                    }}
                  >
                    <img
                      src={edit}
                      alt='Edit'
                      style={{
                        width: 15,
                        height: 15,
                        filter:
                          'invert(48%) sepia(59%) saturate(528%) hue-rotate(85deg) brightness(90%) contrast(91%)',
                      }}
                    />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(tenant)}
                    color='error'
                    size='small'
                    sx={{
                      border: '1px solid var(--border-primary)',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderTopRightRadius: '5px',
                      borderBottomRightRadius: '5px',
                      '&:hover': {
                        backgroundColor: 'orange',
                        color: 'white',
                      },
                    }}
                  >
                    <img
                      src={deleteIcon}
                      alt='Delete'
                      style={{
                        width: 15,
                        height: 15,
                        filter:
                          'invert(28%) sepia(97%) saturate(1404%) hue-rotate(329deg) brightness(95%) contrast(96%)',
                      }}
                    />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Box>
        ))}
      
      {/* Delete Modal */}
      <DeleteTenantModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        tenantName={selectedTenant?.name}
        loading={false}
      />
    </Box>
  );
};

export default TenantCards;
