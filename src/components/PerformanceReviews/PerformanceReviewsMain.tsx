import React from 'react';
import { Box, Typography } from '@mui/material';
import { isManager, isAdmin, isHRAdmin } from '../../utils/auth';
import MyPerformanceReviews from './MyPerformanceReviews';
import TeamPerformanceReviews from './TeamPerformanceReviews';

const PerformanceReviewsMain: React.FC = () => {
  const isMgr = isManager();
  const isAdm = isAdmin();
  const isHRAdm = isHRAdmin();

  return (
    <Box>
      <Box mb={2}>
        <Typography
          variant='h4'
          fontWeight={600}
          fontSize={{ xs: '32px', lg: '48px' }}
        >
          Performance Reviews
        </Typography>
      </Box>

      {/* Admin, HR Admin and Manager see team/all reviews, others see their own */}
      {isMgr || isAdm || isHRAdm ? (
        <TeamPerformanceReviews />
      ) : (
        <MyPerformanceReviews />
      )}
    </Box>
  );
};

export default PerformanceReviewsMain;
