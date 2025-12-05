import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  designationTitle: string;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  designationTitle,
}: Props) {
  const { language } = useLanguage();
  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      // force LTR layout for this confirmation dialog while keeping localized text
      dir={'ltr'}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Typography variant='h6'>
            {getText('Confirm Delete', 'تأكيد الحذف')}
          </Typography>
          <IconButton
            onClick={onClose}
            size='small'
            sx={{
              position: 'absolute',
              // keep close button on the right (LTR) regardless of language
              right: 8,
              left: 'auto',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant='body1' sx={{ mb: 2, lineHeight: 1.6 }}>
            {getText(
              `Are you sure you want to delete "${designationTitle}"? This action cannot be undone.`,
              `هل أنت متأكد أنك تريد حذف "${designationTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        <Button onClick={onClose} color='inherit' variant='outlined'>
          {getText('Cancel', 'إلغاء')}
        </Button>
        <Button onClick={onConfirm} color='error' variant='contained'>
          {getText('Delete', 'حذف')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
