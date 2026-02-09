import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import jobRequisitionApiService, {
  type JobRequisition,
} from '../../api/jobRequisitionApi';
import AppButton from '../common/AppButton';
import { extractErrorMessage } from '../../utils/errorHandler';
import { snackbar } from '../../utils/snackbar';

interface ApprovalWorkflowProps {
  open: boolean;
  requisition: JobRequisition;
  onClose: () => void;
  onSubmit: () => void;
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  open,
  requisition,
  onClose,
  onSubmit,
}) => {
  const [action, setAction] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = requisition.status === 'Draft';
  const canApprove = requisition.status === 'Pending approval';

  const handleSubmitForApproval = async () => {
    setLoading(true);
    try {
      await jobRequisitionApiService.submitForApproval(requisition.id);
      snackbar.success('Job requisition submitted for approval');
      handleReset();
      onSubmit();
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      snackbar.error(typeof errorMsg === 'string' ? errorMsg : 'Error submitting requisition');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await jobRequisitionApiService.approveRequisition(requisition.id, {
        status: 'Approved',
        comments: comments || undefined,
      });
      snackbar.success('Job requisition approved');
      handleReset();
      onSubmit();
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      snackbar.error(typeof errorMsg === 'string' ? errorMsg : 'Error approving requisition');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      snackbar.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await jobRequisitionApiService.rejectRequisition(requisition.id, {
        status: 'Rejected',
        rejectionReason: rejectionReason || undefined,
        comments: comments || undefined,
      });
      snackbar.success('Job requisition rejected');
      handleReset();
      onSubmit();
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      snackbar.error(typeof errorMsg === 'string' ? errorMsg : 'Error rejecting requisition');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAction(null);
    setComments('');
    setRejectionReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="sm" fullWidth>
      <DialogTitle>
        {canSubmit && 'Submit Job Requisition for Approval'}
        {canApprove && 'Review Job Requisition'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {!action ? (
          // Action selection
          <Stack spacing={2}>
            <Alert severity="info">
              {canSubmit && 'Submit this job requisition for approval workflow.'}
              {canApprove && 'Approve or reject this job requisition.'}
            </Alert>

            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Approval Flow: Department Head → Finance → HR
              </Typography>
              <Typography variant="caption" color="textSecondary">
                The requisition will be routed automatically to each approval level.
              </Typography>
            </Box>

            {canSubmit && (
              <AppButton
                fullWidth
                onClick={() => setAction('submit')}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                Submit for Approval
              </AppButton>
            )}

            {canApprove && (
              <Stack spacing={1}>
                <AppButton
                  fullWidth
                  onClick={() => setAction('approve')}
                  variant="contained"
                  color="success"
                  disabled={loading}
                >
                  Approve
                </AppButton>
                <AppButton
                  fullWidth
                  onClick={() => setAction('reject')}
                  variant="contained"
                  color="error"
                  disabled={loading}
                >
                  Reject
                </AppButton>
              </Stack>
            )}
          </Stack>
        ) : action === 'submit' ? (
          // Submit confirmation
          <Stack spacing={2}>
            <Alert severity="info">
              This requisition will be submitted for multi-level approval. Are you sure?
            </Alert>
            <TextField
              fullWidth
              label="Comments (Optional)"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments for approvers..."
              disabled={loading}
            />
          </Stack>
        ) : action === 'approve' ? (
          // Approve form
          <Stack spacing={2}>
            <Alert severity="success">Approve this job requisition?</Alert>
            <TextField
              fullWidth
              label="Approval Comments (Optional)"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add approval comments..."
              disabled={loading}
            />
          </Stack>
        ) : (
          // Reject form
          <Stack spacing={2}>
            <Alert severity="error">
              Rejecting this requisition will send it back for revision.
            </Alert>
            <TextField
              fullWidth
              label="Rejection Reason"
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why you are rejecting this requisition..."
              required
              error={!rejectionReason.trim() && action === 'reject'}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Additional Comments (Optional)"
              multiline
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional comments..."
              disabled={loading}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <AppButton
          onClick={handleReset}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </AppButton>
        {action === 'submit' && (
          <AppButton
            onClick={handleSubmitForApproval}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </AppButton>
        )}
        {action === 'approve' && (
          <AppButton
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve'}
          </AppButton>
        )}
        {action === 'reject' && (
          <AppButton
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim() || loading}
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </AppButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalWorkflow;
