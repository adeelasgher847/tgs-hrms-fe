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
import { useLanguage } from '../../hooks/useLanguage';

interface LeaveApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  action: 'approved' | 'rejected';
}

const LeaveApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  action,
}: LeaveApprovalDialogProps) => {
  const [reason, setReason] = useState('');

  const { language } = useLanguage();
  const labels = {
    en: {
      approve: 'Approve',
      reject: 'Reject',
      confirmQuestion: (actionLabel: string) =>
        `Are you sure you want to ${actionLabel.toLowerCase()} this leave request?`,
      rejectionReason: 'Rejection Reason',
      yes: 'Yes',
      no: 'No',
    },
    ar: {
      approve: 'الموافقة',
      reject: 'رفض',
      confirmQuestion: (actionLabel: string) =>
        `هل أنت متأكد أنك تريد ${actionLabel} هذا الطلب؟`,
      rejectionReason: 'سبب الرفض',
      yes: 'نعم',
      no: 'لا',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const actionText = action === 'approved' ? L.approve : L.reject;

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: 'center' }}>
        {`Confirm ${actionText}`}
      </DialogTitle>
      <DialogContent>
        <Typography align='center' sx={{ mb: 2 }}>
          {L.confirmQuestion(actionText)}
        </Typography>
        {action === 'rejected' && (
          <TextField
            label={L.rejectionReason}
            value={reason}
            onChange={e => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            required
          />
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          onClick={() => onConfirm(action === 'rejected' ? reason : undefined)}
          variant='contained'
          color={action === 'approved' ? 'success' : 'error'}
        >
          {L.yes}
        </Button>
        <Button onClick={onClose} variant='outlined' color='inherit'>
          {L.no}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveApprovalDialog;
