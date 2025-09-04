import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import type { CreateTeamDto, Manager } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';

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
  darkMode = false,
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
          console.log('🔍 Loading managers from API...');
          const managersData = await teamApiService.getAvailableManagers();
          console.log('✅ Managers loaded:', managersData);
          setManagers(managersData);
        } catch (error) {
          console.error('Error loading managers:', error);
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
    } catch (err) {
      console.error('Error creating team:', err);
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
          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
        },
      }}
    >
      <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
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
                  '& fieldset': { borderColor: darkMode ? '#555' : '#ccc' },
                  '&:hover fieldset': {
                    borderColor: darkMode ? '#888' : '#999',
                  },
                  '&.Mui-focused fieldset': { borderColor: '#484c7f' },
                },
                '& .MuiInputLabel-root': { color: darkMode ? '#ccc' : '#666' },
                '& input': { color: darkMode ? '#fff' : '#000' },
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
                  '& fieldset': { borderColor: darkMode ? '#555' : '#ccc' },
                  '&:hover fieldset': {
                    borderColor: darkMode ? '#888' : '#999',
                  },
                  '&.Mui-focused fieldset': { borderColor: '#484c7f' },
                },
                '& .MuiInputLabel-root': { color: darkMode ? '#ccc' : '#666' },
                '& textarea': { color: darkMode ? '#fff' : '#000' },
              }}
            />

            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: darkMode ? '#ccc' : '#666',
                  '&.Mui-focused': { color: '#484c7f' },
                  '&.MuiInputLabel-shrink': {
                    color: darkMode ? '#ccc' : '#666',
                  },
                }}
              >
                {lang.manager}
              </InputLabel>
              <Select
                value={formData.manager_id}
                onChange={handleChange('manager_id')}
                required
                label={lang.manager}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: darkMode ? '#555' : '#ccc' },
                    '&:hover fieldset': {
                      borderColor: darkMode ? '#888' : '#999',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#484c7f' },
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? '#ccc' : '#666',
                  },
                  '& .MuiSelect-select': { color: darkMode ? '#fff' : '#000' },
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
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            {lang.cancel}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={loading || !formData.name.trim() || !formData.manager_id}
            sx={{ backgroundColor: '#484c7f' }}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? lang.loading : lang.create}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTeamForm;
