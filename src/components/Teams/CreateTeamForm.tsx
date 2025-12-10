import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import type { CreateTeamDto, Manager } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';
import AppButton from '../Common/AppButton';
import { COLORS } from '../../constants/appConstants';

interface CreateTeamFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamDto) => Promise<void>;
  darkMode?: boolean;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    description: '',
    manager_id: '',
  });
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form has changes (for create, check if any field has content)
  const hasChanges =
    formData.name.trim() !== '' ||
    (formData.description?.trim() ?? '') !== '' ||
    formData.manager_id !== '';
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Create New Team',
      name: 'Team Name',
      description: 'Description',
      manager: 'Manager',
      selectManager: 'Select a manager',
      create: 'Create Team',
      cancel: 'Cancel',
      loading: 'Creating team...',
      loadingManagers: 'Loading managers...',
      error: 'Failed to create team',
      nameRequired: 'Team name is required',
      managerRequired: 'Manager is required',
      noManagersAvailable: 'No managers available',
    },
    ar: {
      title: 'إنشاء فريق جديد',
      name: 'اسم الفريق',
      description: 'الوصف',
      manager: 'المدير',
      selectManager: 'اختر مدير',
      create: 'إنشاء الفريق',
      cancel: 'إلغاء',
      loading: 'جاري إنشاء الفريق...',
      loadingManagers: 'جاري تحميل المديرين...',
      error: 'فشل في إنشاء الفريق',
      nameRequired: 'اسم الفريق مطلوب',
      managerRequired: 'المدير مطلوب',
      noManagersAvailable: 'لا يوجد مديرين متاحين',
    },
  };

  const lang = labels[language];

  // Load managers from API
  useEffect(() => {
    const loadManagers = async () => {
      if (open) {
        try {
          setLoadingManagers(true);

          const managersData = await teamApiService.getAvailableManagers();

          setManagers(managersData);
        } catch {
          setManagers([]);
        } finally {
          setLoadingManagers(false);
        }
      }
    };

    loadManagers();
  }, [open]);

  const handleChange =
    (field: keyof CreateTeamDto) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | { target: { value: unknown } }
    ) => {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value as string,
      }));
      setError(null);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError(lang.nameRequired);
      return;
    }

    if (!formData.manager_id) {
      setError(lang.managerRequired);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      handleClose();
    } catch {
      setError(lang.error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      manager_id: '',
    });
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme => theme.palette.background.paper,
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: theme => theme.palette.text.primary }}>
        {lang.title}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={lang.name}
              value={formData.name}
              onChange={handleChange('name')}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: theme => theme.palette.divider },
                  '&:hover fieldset': {
                    borderColor: theme => theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme => theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme => theme.palette.text.secondary,
                },
                '& input': { color: theme => theme.palette.text.primary },
              }}
            />

            <TextField
              fullWidth
              label={lang.description}
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: theme => theme.palette.divider },
                  '&:hover fieldset': {
                    borderColor: theme => theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme => theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme => theme.palette.text.secondary,
                },
                '& textarea': { color: theme => theme.palette.text.primary },
              }}
            />

            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: theme => theme.palette.text.secondary,
                  '&.Mui-focused': {
                    color: theme => theme.palette.primary.main,
                  },
                  '&.MuiInputLabel-shrink': {
                    color: theme => theme.palette.text.secondary,
                  },
                }}
              >
                {lang.manager}
              </InputLabel>
              <Select
                value={formData.manager_id || ''}
                onChange={handleChange('manager_id')}
                required
                label={lang.manager}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme => theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme => theme.palette.text.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme => theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => theme.palette.text.secondary,
                  },
                  '& .MuiSelect-select': {
                    color: theme => theme.palette.text.primary,
                  },
                }}
              >
                <MenuItem value='' disabled>
                  {lang.selectManager}
                </MenuItem>
                {loadingManagers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : managers.length === 0 ? (
                  <MenuItem disabled>{lang.noManagersAvailable}</MenuItem>
                ) : (
                  managers.map(manager => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.first_name} {manager.last_name} ({manager.email})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <DialogActions sx={{ padding: 0 }}>
              <AppButton
                variant='outlined'
                text={lang.cancel}
                onClick={handleClose}
                disabled={loading}
              />
              <AppButton
                type='submit'
                variant='contained'
                text={loading ? lang.loading : lang.create}
                disabled={
                  loading ||
                  !hasChanges ||
                  !formData.name.trim() ||
                  !formData.manager_id
                }
                sx={{ backgroundColor: COLORS.PRIMARY }}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              />
            </DialogActions>
          </Box>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default CreateTeamForm;
