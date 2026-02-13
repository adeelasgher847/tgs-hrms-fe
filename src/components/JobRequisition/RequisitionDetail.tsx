import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import dayjs from 'dayjs';
import jobRequisitionApiService, {
  type JobRequisition,
  type ApprovalLog,
  type RequisitionStatus,
} from '../../api/jobRequisitionApi';
import AppButton from '../common/AppButton';
import { extractErrorMessage } from '../../utils/errorHandler';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

interface RequisitionDetailProps {
  requisition: JobRequisition;
  onClose: () => void;
  onRefresh: () => void;
}

const statusColorMap: Record<RequisitionStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  'Draft': 'default',
  'Pending approval': 'warning',
  'Approved': 'success',
  'Rejected': 'error',
};

const RequisitionDetail: React.FC<RequisitionDetailProps> = ({
  requisition,
  onRefresh,
}) => {
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [auditTrail, setAuditTrail] = useState<ApprovalLog[]>([]);
  
  // Use tanstack-query to fetch audit trail when appropriate
  const shouldFetchAudit =
    requisition.status === 'Pending approval' ||
    requisition.status === 'Approved' ||
    requisition.status === 'Rejected';


  const {
    data: auditData,
    isLoading: loadingAudit,
    refetch: refetchAudit,
  } = useQuery<ApprovalLog[], unknown, ApprovalLog[]>(
    {
      queryKey: ['requisition', requisition.id, 'auditTrail'],
      queryFn: async (): Promise<ApprovalLog[]> => {
        return jobRequisitionApiService.getAuditTrail(requisition.id);
      },
      enabled: !!requisition.id && shouldFetchAudit,
      onError: (error: unknown) => {
        console.error('Error loading audit trail:', extractErrorMessage(error));
      },
    } as UseQueryOptions<ApprovalLog[], unknown, ApprovalLog[]>
  );

  // keep local state synced for legacy usage if needed
  React.useEffect(() => {
    if (auditData) setAuditTrail(auditData as ApprovalLog[]);
  }, [auditData]);

  const canSubmitForApproval = requisition.status === 'Draft';
  const canApprove = requisition.status === 'Pending approval';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">{requisition.jobTitle}</Typography>
          <Chip
            label={requisition.status}
            color={statusColorMap[requisition.status]}
            variant="outlined"
          />
        </Stack>
        <Typography variant="body2" color="textSecondary">
          Created by {requisition.createdBy?.name} on{' '}
          {dayjs(requisition.createdAt).format('MMM DD, YYYY')}
        </Typography>
      </Box>

      {/* Basic Information */}
      <Paper sx={{ p: 2, mb: 2, '& .MuiBox-root': { borderBottom: 'none !important' } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Basic Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Department
            </Typography>
            <Typography variant="body2">{requisition.department?.name || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Reporting Manager
            </Typography>
            <Typography variant="body2">{requisition.reportingManager?.name || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Employment Type
            </Typography>
            <Typography variant="body2">{requisition.employmentType}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Work Location
            </Typography>
            <Typography variant="body2">{requisition.workLocation}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Number of Openings
            </Typography>
            <Typography variant="body2">{requisition.numberOfOpenings}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Budget Information */}
      <Paper sx={{ p: 2, mb: 2, '& .MuiBox-root': { borderBottom: 'none !important' } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Budget Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Budgeted Salary Range
            </Typography>
            <Typography variant="body2">
              ${requisition.budgetedSalaryMin?.toLocaleString()} - $
              {requisition.budgetedSalaryMax?.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Job Details */}
      <Paper sx={{ p: 2, mb: 2, '& .MuiBox-root': { borderBottom: 'none !important' } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Job Details
        </Typography>
          <Stack spacing={2}>
            <Box sx={{ pb: 0 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Job Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {requisition.jobDescription}
              </Typography>
            </Box>

            <Box sx={{ pb: 0 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Key Responsibilities
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {requisition.responsibilities}
              </Typography>
            </Box>

            <Box sx={{ pb: 0 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Required Skills
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {requisition.requiredSkills}
              </Typography>
            </Box>

            {requisition.requiredExperience && (
              <Box sx={{ pb: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                  Required Experience
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {requisition.requiredExperience}
                </Typography>
              </Box>
            )}

            {requisition.justificationForHire && (
              <Box sx={{ pb: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                  Justification for Hire
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {requisition.justificationForHire}
                </Typography>
              </Box>
            )}
          </Stack>
      </Paper>

      {/* Audit Trail */}
      {(requisition.status === 'Pending approval' || requisition.status === 'Approved' || requisition.status === 'Rejected') && (
        <Paper sx={{ p: 2, mb: 2, '& .MuiBox-root': { borderBottom: 'none !important' } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Approval Audit Trail
          </Typography>
          {loadingAudit ? (
            <Typography>Loading audit trail...</Typography>
          ) : auditTrail.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Approval Level</TableCell>
                  <TableCell>Approver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrail.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.level}</TableCell>
                    <TableCell>{log.approverName}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        size="small"
                        color={
                          log.status === 'Approved'
                            ? 'success'
                            : log.status === 'Rejected'
                              ? 'error'
                              : 'warning'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {log.approvedAt ? dayjs(log.approvedAt).format('MMM DD, YYYY HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {log.rejectionReason || log.comments || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No approval records yet
            </Typography>
          )}
        </Paper>
        )}

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        {canSubmitForApproval && (
          <AppButton
            onClick={() => setShowApprovalWorkflow(true)}
            variant="contained"
            color="primary"
          >
            Submit for Approval
          </AppButton>
        )}
        {canApprove && (
          <AppButton
            onClick={() => setShowApprovalWorkflow(true)}
            variant="contained"
            color="primary"
          >
            Review Approval
          </AppButton>
        )}
        {/* Close button removed to match create modal styling */}
      </Stack>
    </Box>
  );
};

export default RequisitionDetail;
