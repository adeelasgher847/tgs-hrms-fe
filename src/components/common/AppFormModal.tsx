import React, { type ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/appConstants';
import AppInputField from './AppInputField';
import AppDropdown from './AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'dropdown';
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  options?: Array<{ value: string | number; label: string }>;
  value: string | number;
  error?: string;
  onChange: (value: string | number) => void;
  component?: ReactNode;
}

interface AppFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  hasChanges?: boolean;
  isRtl?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const AppFormModal: React.FC<AppFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  hasChanges = true,
  isRtl = false,
  maxWidth = 'sm',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChanges && !isSubmitting) {
      onSubmit();
    }
  };

  const paperSx = {
    direction: isRtl ? 'rtl' : 'ltr',
    backgroundColor: '#FFFFFF',
    borderRadius: '30px',
  };

  const formContent = (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 4 },
        mt: { xs: 1, sm: 2 },
        direction: isRtl ? 'rtl' : 'ltr',
        width: '100%',
        mx: 'auto',
      }}
    >
      {fields.map((field, index) => (
        <Box
          key={field.name}
          sx={{
            width: '100%',
            ...(index === fields.length - 1 && {
              paddingBottom: '0',
              marginBottom: '0',
              '& > *': {
                overflow: 'visible',
              },
            }),
          }}
        >
          {field.component ||
            (field.type === 'dropdown' && field.options ? (
              <AppDropdown
                label={field.label}
                options={field.options}
                value={field.value}
                onChange={(e: SelectChangeEvent<string | number>) => {
                  field.onChange(e.target.value);
                }}
                placeholder={field.placeholder}
                error={!!field.error}
                helperText={field.error}
              />
            ) : (
              <AppInputField
                label={field.label}
                name={field.name}
                value={field.value as string}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                multiline={field.multiline || field.type === 'textarea'}
                rows={field.rows || (field.type === 'textarea' ? 3 : undefined)}
                error={!!field.error}
                helperText={field.error}
                required={field.required}
              />
            ))}
        </Box>
      ))}
    </Box>
  );

  const actionButtons = (
    <>
      <Button
        onClick={onClose}
        disabled={isSubmitting}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 400,
          fontSize: { xs: '14px', sm: 'var(--body-font-size)' },
          lineHeight: { xs: '20px', sm: 'var(--body-line-height)' },
          letterSpacing: 'var(--body-letter-spacing)',
          border: '1px solid #BDBDBD',
          color: '#2C2C2C',
          px: { xs: 2, sm: 4 },
          py: { xs: 0.75, sm: 1 },
          '&:hover': {
            borderColor: '#BDBDBD',
            backgroundColor: 'transparent',
          },
        }}
      >
        {cancelLabel}
      </Button>
      <Button
        type='submit'
        variant='contained'
        disabled={isSubmitting || !hasChanges}
        onClick={handleSubmit}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 400,
          fontSize: { xs: '14px', sm: 'var(--body-font-size)' },
          lineHeight: { xs: '20px', sm: 'var(--body-line-height)' },
          letterSpacing: 'var(--body-letter-spacing)',
          bgcolor: 'var(--primary-dark-color)',
          color: '#FFFFFF',
          px: { xs: 2, sm: 4 },
          py: { xs: 0.75, sm: 1 },
          boxShadow: 'none',
          '&:hover': {
            bgcolor: COLORS.PRIMARY,
            boxShadow: 'none',
          },
          '&:disabled': {
            bgcolor: '#99c0e9ff',
            border: 'none',
            color: '#FFFFFF',
          },
        }}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </>
  );

  // Mobile and Desktop - Use Dialog for both to ensure centering

  // Dialog for all screen sizes (mobile and desktop)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? false : maxWidth}
      fullWidth={false}
      PaperProps={{
        sx: {
          ...paperSx,
          borderRadius: { xs: '20px', sm: '30px' },
          padding: { xs: '20px 16px', sm: '32px 20px' },
          gap: { xs: '20px', sm: '32px' },
          width: { xs: '90%', sm: 'auto' },
          maxWidth: { xs: '90%', sm: '600px' },
          margin: 'auto',
          height: 'auto',
          maxHeight: { xs: 'auto', sm: '90vh' },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          alignSelf: 'center',
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        '& .MuiDialog-paper': {
          margin: { xs: '16px', sm: '32px' },
        },
      }}
    >
      <DialogTitle
        sx={{
          ...paperSx,
          position: 'relative',
          p: 0,
          pb: 0,
        }}
      >
        <Typography
          sx={{
            textAlign: isRtl ? 'right' : 'left',
            fontWeight: 500,
            fontSize: { xs: '20px', sm: '28px' },
            lineHeight: { xs: '28px', sm: '36px' },
            letterSpacing: '-2%',
            color: '#2C2C2C',
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{
            position: 'absolute',
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            top: 0,
            color: '#2C2C2C',
          }}
        >
          <CloseIcon fontSize={isSmallScreen ? 'small' : 'medium'} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...paperSx,
          p: 0,
          pt: { xs: 2, sm: 4 },
          pb: 2,
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          flex: '0 0 auto',
          minHeight: 'auto',
          height: 'auto',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '500px' },
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {formContent}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 0,
          pt: { xs: 2, sm: 4 },
          justifyContent: 'flex-end',
          gap: 1,
          flex: '0 0 auto',
          ...paperSx,
        }}
      >
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};

export default AppFormModal;
