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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChanges && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px', sm: '30px' },
          padding: { xs: '20px 16px', sm: '32px 24px' },
          maxWidth: '600px',
          width: '100%',
          gap: 2,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      {/* ---------- TITLE ---------- */}
      <DialogTitle
        sx={{
          p: 0,
          position: 'relative',
          textAlign: isRtl ? 'right' : 'left',
        }}
      >
        <Typography
          fontWeight={500}
          fontSize={{ xs: '16px', sm: '28px' }}
          lineHeight={{ xs: '28px', sm: '36px' }}
          color='#2C2C2C'
        >
          {title}
        </Typography>

        <IconButton
          onClick={onClose}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{
            position: 'absolute',
            top: 0,
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            color: '#2C2C2C',
          }}
        >
          <CloseIcon fontSize={isSmallScreen ? 'small' : 'medium'} />
        </IconButton>
      </DialogTitle>

      {/* ---------- CONTENT ---------- */}
      <DialogContent
        sx={{
          p: 0,
          pt: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: '480px', 
            width: '100%',
            mx: 'auto',
          }}
        >
          <Box
            component='form'
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 4 },
              width: '100%',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            {fields.map(field => (
              <Box key={field.name} width='100%'>
                {field.component ||
                  (field.type === 'dropdown' && field.options ? (
                    <AppDropdown
                      label={field.label}
                      options={field.options}
                      value={field.value}
                      onChange={(e: SelectChangeEvent<string | number>) =>
                        field.onChange(e.target.value)
                      }
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
                      rows={
                        field.rows ||
                        (field.type === 'textarea' ? 3 : undefined)
                      }
                      error={!!field.error}
                      helperText={field.error}
                      required={field.required}
                    />
                  ))}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 0,
          pt: { xs: 2, sm: 4 },
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            border: '1px solid #BDBDBD',
            color: '#2C2C2C',
            px: 4,
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
            bgcolor: 'var(--primary-dark-color)',
            color: '#fff',
            px: 4,
            boxShadow: 'none',
            // '&:hover': {
            //   bgcolor: COLORS.PRIMARY,
            // },
            '&:disabled': {
              bgcolor: '#99c0e9',
            },
          }}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppFormModal;
