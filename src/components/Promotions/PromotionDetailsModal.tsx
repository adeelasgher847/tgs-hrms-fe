import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import {
  promotionsApiService,
  type Promotion,
  type ApprovePromotionDto,
} from '../../api/promotionsApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { isAdmin, isHRAdmin } from '../../utils/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  promotionId: string | null;
  onUpdated?: () => void;
}

const PromotionDetailsModal: React.FC<Props> = ({
  open,
  onClose,
  promotionId,
  onUpdated,
}) => {
  const { showError } = useErrorHandler();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  const canApprove = isAdmin() || isHRAdmin();
  const canAct = canApprove && promotion?.status === 'pending';

  useEffect(() => {
    if (!open || !promotionId) return;
    setLoading(true);
    promotionsApiService
      .getPromotionById(promotionId)
      .then(p => setPromotion(p))
      .catch(err => showError(err))
      .finally(() => setLoading(false));
  }, [open, promotionId]);

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!promotionId) return;
    try {
      setSubmitting(true);
      const payload: ApprovePromotionDto = {
        status,
        effectiveDate: promotion?.effectiveDate,
        remarks,
      };
      await promotionsApiService.approvePromotion(promotionId, payload);
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const fields: FormField[] = promotion
    ? [
        {
          name: 'newDesignation',
          label: 'New Designation',
          type: 'text',
          value: promotion.newDesignation || '',
          onChange: () => {},
        },
        {
          name: 'employee',
          label: 'Employee',
          type: 'text',
          value: promotion.employee?.name || promotion.employee_id || '',
          onChange: () => {},
        },
        {
          name: 'previousDesignation',
          label: 'Previous Designation',
          type: 'text',
          value: promotion.previousDesignation || '',
          onChange: () => {},
        },
        {
          name: 'effectiveDate',
          label: 'Effective Date',
          type: 'text',
          value: promotion.effectiveDate || '',
          onChange: () => {},
        },
        {
          name: 'status',
          label: 'Status',
          type: 'text',
          value: promotion.status || '',
          onChange: () => {},
        },
        {
          name: 'remarks',
          label: 'Remarks',
          type: 'textarea',
          value: remarks,
          onChange: v => setRemarks(String(v)),
          component: (
            <AppInputField
              label='Admin Remarks'
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          ),
        },
      ]
    : [];

  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      onSubmit={() => handleApprove('approved')}
      title='Promotion Details'
      fields={fields}
      submitLabel='Approve'
      cancelLabel='Close'
      isSubmitting={submitting}
      submitDisabled={submitting || !promotion}
      showSubmitButton={canAct}
      secondaryAction={canAct ? { label: 'Reject', onClick: () => handleApprove('rejected') } : undefined}
    />
  );
};

export default PromotionDetailsModal;
