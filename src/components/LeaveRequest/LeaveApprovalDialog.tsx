import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from '@mui/material';

interface LeaveApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  action: 'approved' | 'rejected';
  allowComments?: boolean; // For managers, always show comment field
  commentLabel?: string; // Custom label for comment field
  showRemarksField?: boolean; // Whether to show remarks field (false for admin/HR admin rejections)
}

const LeaveApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  action,
  allowComments = false,
  commentLabel = 'Comments',
  showRemarksField = true, // Default to true for backward compatibility
}: LeaveApprovalDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const actionText = action === 'approved' ? 'Approve' : 'Reject';
  const actionLower = action === 'approved' ? 'approve' : 'reject';
  // Show comment field if: allowComments is true OR (action is rejected AND showRemarksField is true)
  const showCommentField = allowComments || (action === 'rejected' && showRemarksField);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: 'center' }}>
        Confirm {actionText}
      </DialogTitle>
      <DialogContent>
        <Typography align='center' sx={{ mb: 2 }}>
          Are you sure you want to {actionLower} this leave request?
        </Typography>
        {showCommentField && (
          <TextField
            label={action === 'rejected' ? 'Rejection Reason' : commentLabel}
            value={reason}
            onChange={e => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            required={action === 'rejected'}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          onClick={() => onConfirm(showCommentField ? reason : undefined)}
          variant='contained'
          color={action === 'approved' ? 'success' : 'error'}
          disabled={showCommentField && action === 'rejected' && !reason.trim()}
        >
          Yes
        </Button>
        <Button onClick={onClose} variant='outlined' color='inherit'>
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveApprovalDialog;
