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
}

const LeaveApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  action,
  allowComments = false,
  commentLabel = 'Comments',
}: LeaveApprovalDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const actionText = action === 'approved' ? 'Approve' : 'Reject';
  const actionLower = action === 'approved' ? 'approve' : 'reject';
  const showCommentField = allowComments || action === 'rejected';

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
