import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Fab,
  useMediaQuery,
  Paper,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import companyApi from '../api/companyApi';
import type { BackendCompany, CompanyDto } from '../api/companyApi';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import edit from '../assets/dashboardIcon/edit.svg';
import deleteIcon from '../assets/dashboardIcon/ui-delete.svg';

const labels = {
  en: {
    title: 'Tenants',
    create: 'Create Tenant',
    createFirst: 'Create First Tenant',
    noTenants: 'No Tenants Found',
    description: 'Get started by creating your first tenant',
    name: 'Tenant Name',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Confirm Delete?',
  },
  ar: {
    title: 'المستأجرون',
    create: 'إنشاء مستأجر',
    createFirst: 'إنشاء أول مستأجر',
    noTenants: 'لا يوجد مستأجرون',
    description: 'ابدأ بإنشاء أول مستأجر لإدارتهم',
    name: 'اسم المستأجر',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    confirmDelete: 'هل أنت متأكد أنك تريد حذف هذا المستأجر؟',
  },
};

export const TenantPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>() || {
    darkMode: false,
  };
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const lang = labels[language];

  const bgPaper = darkMode ? '#1b1b1b' : '#fff';
  const textPrimary = darkMode ? '#e0e0e0' : theme.palette.text.primary;
  const textSecond = darkMode ? '#9a9a9a' : theme.palette.text.secondary;
  const dividerCol = darkMode ? '#333' : '#ccc';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const cardBg = darkMode ? '#111' : '#fff';
  const cardText = darkMode ? '#ccc' : '#000';
  const cardBorder = darkMode ? '#333' : '#f0f0f0';

  const [companies, setCompanies] = useState<BackendCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<BackendCompany | null>(
    null
  );
  const [formName, setFormName] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const data = await companyApi.getAllCompanies();

        setCompanies(data);
      } catch {
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Create company
  const handleCreateCompany = async () => {
    if (!formName.trim()) return;
    const newCompany: CompanyDto = { name: formName };
    try {
      const created = await companyApi.createCompany(newCompany);
      setCompanies(prev => [created, ...prev]);

      setIsFormModalOpen(false);
      setFormName('');
      setSnackbar({
        open: true,
        message: 'Company created successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      const errorResponse = error as {
        response?: { data?: { message?: string } };
      };
      setSnackbar({
        open: true,
        message:
          errorResponse?.response?.data?.message || 'Failed to create company.',
        severity: 'error',
      });
    }
  };

  // Edit company
  const handleEditCompany = async () => {
    if (!selectedTenant || !formName.trim()) return;
    try {
      await companyApi.updateCompany(selectedTenant.id, {
        name: formName,
      });
      setCompanies(prev =>
        prev.map(c =>
          c.id === selectedTenant.id ? { ...c, name: formName } : c
        )
      );
      setSelectedTenant(null);
      setIsFormModalOpen(false);
      setFormName('');
      setSnackbar({
        open: true,
        message: 'Company successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      const errorResponse = error as {
        response?: { data?: { message?: string } };
      };
      setSnackbar({
        open: true,
        message:
          errorResponse?.response?.data?.message || 'Failed to update company.',
        severity: 'error',
      });
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    if (!selectedTenant) return;
    try {
      await companyApi.deleteCompany(selectedTenant.id);
      setCompanies(prev => prev.filter(c => c.id !== selectedTenant.id));
      setSelectedTenant(null);
      setIsDeleteModalOpen(false);
      setSnackbar({
        open: true,
        message: 'Company deleted successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      const errorResponse = error as {
        response?: { data?: { message?: string } };
      };
      setSnackbar({
        open: true,
        message:
          errorResponse?.response?.data?.message || 'Failed to delete company.',
        severity: 'error',
      });
    }
  };

  const openCreateModal = () => {
    setSelectedTenant(null);
    setFormName('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (company: BackendCompany) => {
    setSelectedTenant(company);
    setFormName(company.name);
    setIsFormModalOpen(true);
  };

  // Localized delete message including tenant name
  const deleteMessage = selectedTenant
    ? language === 'ar'
      ? `هل أنت متأكد أنك تريد حذف المستأجر "${selectedTenant.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete the tenant "${selectedTenant.name}"? This action cannot be undone.`
    : lang.confirmDelete;

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        color: textPrimary,
        boxSizing: 'border-box',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          backgroundColor: 'unset',
          color: textColor,
          boxShadow: 'none',
        }}
      >
        <Typography
          variant='h4'
          fontWeight={700}
          sx={{ py: 1.5, textAlign: isRtl ? 'right' : 'left' }}
        >
          {lang.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              sx={{
                borderRadius: '0.375rem',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: darkMode ? '#484c7f' : '#45407A',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: darkMode ? '#726df0' : '#5b56a0',
                  boxShadow: 'none',
                },
              }}
            >
              {lang.create}
            </Button>
          )}
        </Box>
      </Paper>
      <Divider sx={{ mb: 4, borderColor: dividerCol }} />
      {/* Content */}
      {isLoading ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: bgPaper,
            color: textPrimary,
            boxShadow: 'none',
          }}
        >
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            height={200}
          >
            <CircularProgress />
          </Box>
        </Paper>
      ) : companies.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: bgPaper,
            color: textPrimary,
            boxShadow: 'none',
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: textSecond, mb: 2 }} />
          <Typography variant='h6' color={textSecond} gutterBottom>
            {lang.noTenants}
          </Typography>
          <Typography variant='body2' color={textSecond} sx={{ mb: 3 }}>
            {lang.description}
          </Typography>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={openCreateModal}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {lang.createFirst}
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'flex-start',
          }}
        >
          {companies.map(c => (
            <Box
              key={c.id}
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
                  backgroundColor: cardBg,
                  color: cardText,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: 'unset',
                  direction: isRtl ? 'rtl' : 'ltr',
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
                        color: cardText,
                        textAlign: isRtl ? 'right' : 'left',
                      }}
                    >
                      {c.name}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions
                  sx={{ justifyContent: 'flex-start', px: 2, pb: 2 }}
                >
                  <Box display='flex' width={100}>
                    <IconButton
                      onClick={() => openEditModal(c)}
                      color='success'
                      size='small'
                      sx={{
                        border: `1px solid ${cardBorder}`,
                        borderTopLeftRadius: isRtl ? 0 : '5px',
                        borderBottomLeftRadius: isRtl ? 0 : '5px',
                        borderTopRightRadius: isRtl ? '5px' : 0,
                        borderBottomRightRadius: isRtl ? '5px' : 0,
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
                      onClick={() => {
                        setSelectedTenant(c);
                        setIsDeleteModalOpen(true);
                      }}
                      color='error'
                      size='small'
                      sx={{
                        border: `1px solid ${cardBorder}`,
                        borderTopLeftRadius: isRtl ? '5px' : 0,
                        borderBottomLeftRadius: isRtl ? '5px' : 0,
                        borderTopRightRadius: isRtl ? 0 : '5px',
                        borderBottomRightRadius: isRtl ? 0 : '5px',
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
        </Box>
      )}
      {/* FAB (mobile) */}
      {isMobile && (
        <Fab
          color='primary'
          onClick={openCreateModal}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: isRtl ? 'auto' : 24,
            left: isRtl ? 24 : 'auto',
            boxShadow: 'none',
          }}
        >
          <AddIcon />
        </Fab>
      )}
      {/* Form Modal */}
      {isFormModalOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            sx={{ p: 4, minWidth: 320, bgcolor: bgPaper, color: textPrimary }}
          >
            <Typography
              variant='h6'
              mb={2}
              sx={{ textAlign: isRtl ? 'right' : 'left' }}
            >
              {selectedTenant ? lang.edit : lang.create}
            </Typography>
            <input
              type='text'
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder={lang.name}
              style={{
                width: '100%',
                padding: 8,
                marginBottom: 16,
                fontSize: 16,
                background: bgPaper,
                color: textPrimary,
                border: `1px solid ${dividerCol}`,
                direction: isRtl ? 'rtl' : 'ltr',
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              }}
            >
              <Button
                onClick={() => {
                  setIsFormModalOpen(false);
                  setSelectedTenant(null);
                  setFormName('');
                }}
                sx={{ color: textPrimary }}
              >
                {lang.cancel}
              </Button>
              <Button
                variant='contained'
                onClick={
                  selectedTenant ? handleEditCompany : handleCreateCompany
                }
                disabled={!formName.trim()}
                sx={{
                  bgcolor: darkMode ? '#484c7f' : '#45407A',
                  '&:hover': { bgcolor: darkMode ? '#726df0' : '#5b56a0' },
                }}
              >
                {lang.save}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      {/* Delete Modal */}
      {isDeleteModalOpen && selectedTenant && (
        <Dialog
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTenant(null);
          }}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              direction: isRtl ? 'rtl' : 'ltr',
              backgroundColor: darkMode ? '#111' : '#fff',
              color: textPrimary,
              border: `1px solid ${dividerCol}`,
            },
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            {lang.confirmDelete}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center' }}>
              <WarningIcon
                sx={{ fontSize: 64, color: 'warning.main', mb: 2 }}
              />
              <Typography variant='body1' sx={{ mb: 2, lineHeight: 1.6 }}>
                {deleteMessage}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
            <Button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedTenant(null);
              }}
              variant='outlined'
              sx={{ color: textPrimary, borderColor: dividerCol }}
            >
              {lang.cancel}
            </Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleDeleteCompany}
            >
              {lang.delete}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
