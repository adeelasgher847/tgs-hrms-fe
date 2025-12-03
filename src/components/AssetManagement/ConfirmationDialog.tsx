import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error';
  loading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText,
  onConfirm,
  onCancel,
  severity = 'warning',
  loading = false,
}) => {
  const { language } = useLanguage();
  const defaultLabels = {
    en: { cancel: 'Cancel', processing: 'Processing...' },
    ar: { cancel: 'إلغاء', processing: 'جارٍ المعالجة...' },
  } as const;
  const localizedCancel =
    cancelText || defaultLabels[language as 'en' | 'ar'].cancel;
  const processingLabel = defaultLabels[language as 'en' | 'ar'].processing;
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Typography
          variant='h6'
          component='div'
          fontWeight={600}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          padding: '16px 24px',
          gap: 1,
          flexDirection: language === 'ar' ? 'row-reverse' : 'row',
        }}
      >
        <Button
          onClick={onCancel}
          variant='outlined'
          disabled={loading}
          sx={{ minWidth: 80 }}
        >
          {localizedCancel}
        </Button>
        <Button
          onClick={onConfirm}
          color={getSeverityColor()}
          variant='contained'
          disabled={loading}
          sx={{ minWidth: 80 }}
        >
          {loading ? processingLabel : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
