import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import AppButton from './AppButton';
import { COLORS } from '../../constants/appConstants';
import { useOutletContext } from 'react-router-dom';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isRTL?: boolean;
  loading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isRTL = false,
  loading = false,
}) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const bgColor = darkMode ? COLORS.DARK_CARD_BG : COLORS.LIGHT_CARD_BG;
  const textColor = darkMode ? COLORS.DARK_TEXT : COLORS.LIGHT_TEXT;
  const borderColor = darkMode ? COLORS.DARK_BORDER : COLORS.LIGHT_BORDER;

  const dialogTitle = title || (isRTL ? 'تأكيد الحذف' : 'Confirm Delete');
  const dialogMessage = itemName
    ? message.replace('{itemName}', itemName)
    : message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          direction: isRTL ? 'rtl' : 'ltr',
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1, color: textColor }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Typography variant='h6'>{dialogTitle}</Typography>
          <IconButton
            onClick={onClose}
            size='small'
            aria-label={
              isRTL ? 'إغلاق مربع حوار التأكيد' : 'Close confirmation dialog'
            }
            sx={{
              position: 'absolute',
              right: isRTL ? 'auto' : 8,
              left: isRTL ? 8 : 'auto',
              color: textColor,
            }}
          >
            <CloseIcon aria-hidden='true' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <WarningIcon
            sx={{ fontSize: 64, color: COLORS.WARNING, mb: 2 }}
            aria-hidden='true'
          />
          <Typography
            variant='body1'
            sx={{ mb: 2, lineHeight: 1.6, color: textColor }}
          >
            {dialogMessage}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        <AppButton
          onClick={onClose}
          variantType='secondary'
          text={isRTL ? 'إلغاء' : cancelText}
          disabled={loading}
          sx={{ minWidth: 80 }}
        />
        <AppButton
          onClick={onConfirm}
          variantType='danger'
          text={
            loading
              ? isRTL
                ? 'جاري المعالجة...'
                : 'Processing...'
              : isRTL
                ? 'حذف'
                : confirmText
          }
          disabled={loading}
          sx={{ minWidth: 80 }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
