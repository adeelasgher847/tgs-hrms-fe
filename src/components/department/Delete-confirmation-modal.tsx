import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useMediaQuery,
  Drawer,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { Department } from '../../types';
import { useOutletContext } from 'react-router-dom';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  department: Department | null;
  isRtl?: boolean;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({ open, onClose, onConfirm, department, isRtl = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#ccc' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  if (!department) return null;

  const title = isRtl ? 'تأكيد الحذف' : 'Confirm Delete';
  const message = isRtl
    ? `هل أنت متأكد من أنك تريد حذف قسم "${department.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
    : `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`;

  const content = (
    <Box sx={{ textAlign: 'center', direction: isRtl ? 'rtl' : 'ltr' }}>
      <WarningIcon
        sx={{
          fontSize: 64,
          color: 'warning.main',
          mb: 2,
        }}
      />
      <Typography
        variant='body1'
        sx={{
          mb: 2,
          textAlign: isRtl ? 'right' : 'left',
          lineHeight: 1.6,
          color: textColor,
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  const actionButtons = (
    <>
      <Button
        onClick={onClose}
        variant='outlined'
        sx={{
          color: textColor,
          borderColor: borderColor,
          mr: isRtl ? 0 : 1,
          ml: isRtl ? 1 : 0,
        }}
      >
        {isRtl ? 'إلغاء' : 'Cancel'}
      </Button>
      <Button onClick={onConfirm} variant='contained' color='error' autoFocus>
        {isRtl ? 'حذف' : 'Delete'}
      </Button>
    </>
  );

  // 🔹 Mobile drawer version
  if (isMobile) {
    return (
      <Drawer
        anchor='bottom'
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            direction: isRtl ? 'rtl' : 'ltr',
            backgroundColor: bgColor,
            color: textColor,
            borderTop: `1px solid ${borderColor}`,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6' sx={{ flexGrow: 1, color: textColor }}>
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size='small'
              sx={{ color: textColor }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {content}

          <Box
            sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'center' }}
          >
            {actionButtons}
          </Box>
        </Box>
      </Drawer>
    );
  }

  // 🔹 Desktop dialog version
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          direction: isRtl ? 'rtl' : 'ltr',
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1, color: textColor }}>
        {title}
      </DialogTitle>

      <DialogContent>{content}</DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};
