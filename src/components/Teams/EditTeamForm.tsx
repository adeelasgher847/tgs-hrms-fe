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
import { useLanguage } from '../../hooks/useLanguage';
import type { UpdateTeamDto, Manager, Team } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';

interface EditTeamFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateTeamDto) => Promise<void>;
  team: Team | null;
  darkMode?: boolean;
}

const EditTeamForm: React.FC<EditTeamFormProps> = ({
  open,
  onClose,
  onSubmit,
  team,
  darkMode = false,
}) => {
  const [formData, setFormData] = useState<UpdateTeamDto>({
    name: '',
    description: '',
    manager_id: '',
  });
  const [originalFormData, setOriginalFormData] = useState<UpdateTeamDto>({
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
      title: 'Edit Team',
      name: 'Team Name',
      description: 'Description',
      manager: 'Manager',
      selectManager: 'Select a manager',
      update: 'Update Team',
      cancel: 'Cancel',
      loading: 'Updating team...',
      loadingManagers: 'Loading managers...',
      error: 'Failed to update team',
      nameRequired: 'Team name is required',
      managerRequired: 'Manager is required',
      noManagersAvailable: 'No managers available',
    },
    ar: {
      title: 'تعديل الفريق',
      name: 'اسم الفريق',
      description: 'الوصف',
      manager: 'المدير',
      selectManager: 'اختر مدير',
      update: 'تحديث الفريق',
      cancel: 'إلغاء',
      loading: 'جاري تحديث الفريق...',
      loadingManagers: 'جاري تحميل المديرين...',
      error: 'فشل في تحديث الفريق',
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

          // If we have a team, add the current manager to the list if not already present
          if (team && team.manager) {
            const currentManagerExists = managersData.some(
              m => m.id === team.manager_id
            );
            if (!currentManagerExists) {
              const currentManager: Manager = {
                id: team.manager_id,
                first_name: team.manager.first_name,
                last_name: team.manager.last_name,
                email: team.manager.email,
                role: 'Manager',
              };
              managersData.unshift(currentManager); // Add current manager at the top
            }
          }

          setManagers(managersData);
        } catch {
          setManagers([]);
        } finally {
          setLoadingManagers(false);
        }
      }
    };

    loadManagers();
  }, [open, team]);

  // Populate form when team data changes
  useEffect(() => {
    if (team && open) {
      const initialData = {
        name: team.name,
        description: team.description || '',
        manager_id: team.manager_id,
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    }
  }, [team, open]);

  // Check if form has changes
  const hasChanges = team
    ? formData.name !== originalFormData.name ||
      formData.description !== originalFormData.description ||
      formData.manager_id !== originalFormData.manager_id
    : false;

  const handleChange =
    (field: keyof UpdateTeamDto) =>
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

    if (!team) return;

    // Validation
    if (!formData.name?.trim()) {
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
      await onSubmit(team.id, formData);
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

  if (!team) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: (theme) => theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ color: (theme) => theme.palette.text.primary }}>
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
                  '& fieldset': { borderColor: (theme) => theme.palette.divider },
                  '&:hover fieldset': {
                    borderColor: (theme) => theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: (theme) => theme.palette.text.secondary },
                '& input': { color: (theme) => theme.palette.text.primary },
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
                  '& fieldset': { borderColor: (theme) => theme.palette.divider },
                  '&:hover fieldset': {
                    borderColor: (theme) => theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: (theme) => theme.palette.text.secondary },
                '& textarea': { color: (theme) => theme.palette.text.primary },
              }}
            />

            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: (theme) => theme.palette.text.secondary,
                  '&.Mui-focused': { color: (theme) => theme.palette.primary.main },
                  '&.MuiInputLabel-shrink': {
                    color: (theme) => theme.palette.text.secondary,
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
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) => theme.palette.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) => theme.palette.text.secondary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                  '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary },
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
                      {manager.id === team.manager_id && ' (Current)'}
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
            disabled={
              loading ||
              !hasChanges ||
              !formData.name?.trim() ||
              !formData.manager_id
            }
            sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? lang.loading : lang.update}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditTeamForm;
