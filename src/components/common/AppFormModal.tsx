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
  Drawer,
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
        gap: 4,
        mt: 2,
        direction: isRtl ? 'rtl' : 'ltr',
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
          fontSize: 'var(--body-font-size)',
          lineHeight: 'var(--body-line-height)',
          letterSpacing: 'var(--body-letter-spacing)',
          border: '1px solid #BDBDBD',
          color: '#2C2C2C',
          px: 4,
          py: 1,
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
          fontSize: 'var(--body-font-size)',
          lineHeight: 'var(--body-line-height)',
          letterSpacing: 'var(--body-letter-spacing)',
          bgcolor: 'var(--primary-dark-color)',
          color: '#FFFFFF',
          px: 4,
          py: 1,
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

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer
        anchor={isRtl ? 'right' : 'left'}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 400,
            ...paperSx,
          },
        }}
      >
        <Box
          sx={{
            p: 4,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography
              sx={{
                flexGrow: 1,
                fontWeight: 500,
                fontSize: '28px',
                lineHeight: '36px',
                letterSpacing: '-2%',
                color: '#2C2C2C',
              }}
            >
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size='small'
              aria-label='Close dialog'
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {formContent}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 4,
              justifyContent: 'flex-end',
            }}
          >
            {actionButtons}
          </Box>
        </Box>
      </Drawer>
    );
  }

  // Desktop dialog
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          ...paperSx,
          borderRadius: '30px',
          padding: '32px 20px',
          gap: '32px',
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
            fontSize: '28px',
            lineHeight: '36px',
            letterSpacing: '-2%',
            color: '#2C2C2C',
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            top: 0,
            color: '#2C2C2C',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...paperSx,
          p: 0,
          pt: 4,
          pb: 2,
          maxHeight: '70vh',
          overflowY: 'auto',
          overflowX: 'visible',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {formContent}
      </DialogContent>

      <DialogActions
        sx={{
          p: 0,
          pt: 4,
          justifyContent: 'flex-end',
          gap: 1,
          ...paperSx,
        }}
      >
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};

export default AppFormModal;
