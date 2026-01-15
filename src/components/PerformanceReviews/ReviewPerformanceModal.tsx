import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Box,
  Typography,
  MenuItem,
} from '@mui/material';
import AppButton from '../common/AppButton';
import { performanceReviewApiService } from '../../api/performanceReviewApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface ReviewPerformanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeId: string;
  employeeName: string;
}

const ReviewPerformanceModal: React.FC<ReviewPerformanceModalProps> = ({
  open,
  onClose,
  onSuccess,
  employeeId,
  employeeName,
}) => {
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState('Q4-2025');
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const { showError } = useErrorHandler();

  const cycles = ['Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025'];

  const handleSubmit = async () => {
    if (!overallScore) {
      showError('Please provide a rating');
      return;
    }

    if (!recommendation.trim()) {
      showError('Please provide a recommendation');
      return;
    }

    setLoading(true);
    try {
      await performanceReviewApiService.createPerformanceReview({
        employeeId,
        cycle,
        overallScore,
        recommendation,
      });

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      showError('Failed to submit performance review');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCycle('Q4-2025');
    setOverallScore(null);
    setRecommendation('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: '1.25rem' }}>
        Review Performance - {employeeName}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField
            select
            label='Review Cycle'
            value={cycle}
            onChange={e => setCycle(e.target.value)}
            fullWidth
            size='small'
          >
            {cycles.map(c => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography component='legend' sx={{ mb: 1, fontWeight: 500 }}>
              Overall Score
            </Typography>
            <Rating
              value={overallScore}
              onChange={(_, newValue) => setOverallScore(newValue)}
              size='large'
              max={5}
            />
          </Box>

          <TextField
            label='Recommendation'
            multiline
            rows={4}
            value={recommendation}
            onChange={e => setRecommendation(e.target.value)}
            fullWidth
            placeholder='Enter your recommendation for this employee...'
            variant='outlined'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <AppButton text='Cancel' onClick={handleClose} variant='outlined' />
        <AppButton text='Submit' onClick={handleSubmit} loading={loading} />
      </DialogActions>
    </Dialog>
  );
};

export default ReviewPerformanceModal;
