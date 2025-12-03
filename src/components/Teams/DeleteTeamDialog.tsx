import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import type { Team } from '../../api/teamApi';

interface DeleteTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  team: Team | null;
  darkMode?: boolean;
  loading?: boolean;
  error?: string | null;
}

const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  open,
  onClose,
  onConfirm,
  team,
  loading = false,
  error = null,
}) => {
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Delete Team',
      message: 'Are you sure you want to delete this team?',
      warning:
        'This action cannot be undone. All team members will be removed from this team.',
      teamName: 'Team Name',
      manager: 'Manager',
      members: 'Members',
      cancel: 'Cancel',
      delete: 'Delete Team',
      loading: 'Deleting...',
      error: 'Failed to delete team',
    },
    ar: {
      title: 'حذف الفريق',
      message: 'هل أنت متأكد من حذف هذا الفريق؟',
      warning:
        'لا يمكن التراجع عن هذا الإجراء. سيتم إزالة جميع أعضاء الفريق من هذا الفريق.',
      teamName: 'اسم الفريق',
      manager: 'المدير',
      members: 'الأعضاء',
      cancel: 'إلغاء',
      delete: 'حذف الفريق',
      loading: 'جاري الحذف...',
      error: 'فشل في حذف الفريق',
    },
  };

  const lang = labels[language];

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      /* Error handled silently */
    }
  };

  if (!team) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme => theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{
          color: theme => theme.palette.text.primary,
          textAlign: language === 'ar' ? 'right' : 'left',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: theme => theme.palette.warning.main }} />
          {lang.title}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ direction: 'ltr' }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography
          variant='body1'
          sx={{ color: theme => theme.palette.text.primary, mb: 2 }}
        >
          {lang.message}
        </Typography>

        <Alert severity='warning' sx={{ mb: 2 }}>
          {lang.warning}
        </Alert>

        <Box
          sx={{
            backgroundColor: theme => theme.palette.action.hover,
            p: 2,
            borderRadius: 1,
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{ color: theme => theme.palette.text.secondary, mb: 1 }}
          >
            {lang.teamName}:{' '}
            <span style={{ color: 'inherit' }}>{team.name}</span>
          </Typography>

          <Typography
            variant='subtitle2'
            sx={{ color: theme => theme.palette.text.secondary, mb: 1 }}
          >
            {lang.manager}:{' '}
            <span style={{ color: 'inherit' }}>
              {team.manager?.first_name} {team.manager?.last_name}
            </span>
          </Typography>

          <Typography
            variant='subtitle2'
            sx={{ color: theme => theme.palette.text.secondary }}
          >
            {lang.members}:{' '}
            <span style={{ color: 'inherit' }}>
              {team.teamMembers?.length || 0}
            </span>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{
          p: 2,
          display: 'flex',
          direction: 'ltr',
          justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={loading} sx={{ order: 0 }}>
          {lang.cancel}
        </Button>
        <Button
          onClick={handleConfirm}
          variant='contained'
          color='error'
          disabled={loading}
          sx={{
            backgroundColor: theme => theme.palette.error.main,
            order: 1,
          }}
        >
          {loading ? lang.loading : lang.delete}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTeamDialog;
