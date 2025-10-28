import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface ModalProps {
  /**
   * Modal open state
   */
  open: boolean;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Modal actions (buttons, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Show close button
   */
  showCloseButton?: boolean;
  /**
   * Close handler
   */
  onClose?: () => void;
  /**
   * Modal size
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  /**
   * Modal variant
   */
  variant?: 'default' | 'centered' | 'fullscreen';
  /**
   * Show backdrop
   */
  showBackdrop?: boolean;
  /**
   * Close on backdrop click
   */
  closeOnBackdropClick?: boolean;
  /**
   * Close on escape key
   */
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  actions,
  showCloseButton = true,
  onClose,
  size = 'medium',
  variant = 'default',
  showBackdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { maxWidth: 'xs' };
      case 'medium':
        return { maxWidth: 'sm' };
      case 'large':
        return { maxWidth: 'md' };
      case 'fullscreen':
        return { maxWidth: false, fullWidth: true, fullScreen: true };
      default:
        return { maxWidth: 'sm' };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'centered':
        return {
          '& .MuiDialog-paper': {
            alignItems: 'center',
            justifyContent: 'center',
          },
        };
      case 'fullscreen':
        return {
          '& .MuiDialog-paper': {
            margin: 0,
            maxHeight: '100vh',
            maxWidth: '100vw',
          },
        };
      default:
        return {};
    }
  };

  return (
    <Dialog
      open={open}
      onClose={closeOnBackdropClick ? onClose : undefined}
      hideBackdrop={!showBackdrop}
      disableEscapeKeyDown={!closeOnEscape}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        ...getVariantStyles(),
      }}
      {...getSizeProps()}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-lg) var(--spacing-xl)',
            borderBottom: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family-primary)',
            }}
          >
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': {
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-hover)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent
        sx={{
          padding: 'var(--spacing-xl)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          '&:first-of-type': {
            paddingTop: title ? 'var(--spacing-xl)' : 'var(--spacing-xl)',
          },
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            padding: 'var(--spacing-lg) var(--spacing-xl)',
            borderTop: '1px solid var(--border-primary)',
            gap: 'var(--spacing-sm)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;