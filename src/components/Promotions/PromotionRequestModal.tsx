import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import { promotionsApiService } from '../../api/promotionsApi';
import type { CreatePromotionDto } from '../../api/promotionsApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import employeeApiService from '../../api/employeeApi';
import AppDropdown from '../common/AppDropdown';
import { teamApiService } from '../../api/teamApi';
import { designationApiService } from '../../api/designationApi';
import { isManager } from '../../utils/auth';
import type { BackendDesignation } from '../../api/designationApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedEmployeeId?: string | undefined;
  initialData?: Partial<{
    employeeId: string;
    previousDesignation: string;
    newDesignation: string;
    effectiveDate: string;
    remarks?: string;
  }>;
}

const PromotionRequestModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  preSelectedEmployeeId,
  initialData,
}) => {
  const { showError } = useErrorHandler();
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState(preSelectedEmployeeId || '');
  const [previousDesignation, setPreviousDesignation] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);

  useEffect(() => {
    if (!open) return;

    // initialize from initialData when provided
    if (initialData) {
      setEmployeeId(initialData.employeeId || preSelectedEmployeeId || '');
      setPreviousDesignation(initialData.previousDesignation || '');
      setNewDesignation(initialData.newDesignation || '');
      setEffectiveDate(initialData.effectiveDate || '');
      setRemarks(initialData.remarks || '');
    } else {
      setEmployeeId(preSelectedEmployeeId || '');
      setPreviousDesignation('');
      setNewDesignation('');
      setEffectiveDate('');
      setRemarks('');
    }

    const fetchData = async () => {
      try {
        // fetch designations for newDesignation dropdown
        const des = await designationApiService.getAllDesignations();
        setDesignations(des || []);

        if (isManager()) {
          // request a larger page size to include more members (matches other components)
          const members = await teamApiService.getMyTeamMembers(1, 100);

          const items = members.items || [];
          setEmployees(items);

          // If a pre-selected id was passed (might be a user id or team member id),
          // map it to the team member `id` used by our dropdown options.
          const incomingId = initialData?.employeeId || preSelectedEmployeeId || '';
          if (incomingId) {
            const matched = items.find(
              m =>
                String(m.employeeId) === String(incomingId) ||
                String(m.id) === String(incomingId) ||
                String(m.user?.id) === String(incomingId)
            );
            if (matched)
              setEmployeeId(
                String(matched.employeeId || matched.id || matched.user?.id || '')
              );
          }
        } else {
          const all =
            await employeeApiService.getAllEmployeesWithoutPagination();
          setEmployees(all || []);
        }
      } catch (e) {
        // Surface the error so developer can see why members failed to load
        try {
          showError(e);
        } catch {
          // ignore showError failures
        }
        setEmployees([]);
      }
    };

    void fetchData();
  }, [open]);

  useEffect(() => {
    if (!employeeId) return;
    const sel = employees.find(
      e =>
        String(e.employeeId) === String(employeeId) ||
        String(e.id) === String(employeeId) ||
        String(e.user?.id) === String(employeeId)
    );
    const prev =
      sel?.designation?.title ||
      sel?.designation ||
      sel?.user?.designation?.title ||
      sel?.name ||
      '';
    setPreviousDesignation(prev || '');
  }, [employeeId, employees]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload: CreatePromotionDto = {
        employeeId,
        previousDesignation,
        newDesignation,
        effectiveDate,
        remarks,
      };
      await promotionsApiService.createPromotion(payload);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const fields: FormField[] = [
    {
      name: 'employee',
      label: 'Employee',
      type: 'dropdown',
      required: true,
      options: employees.map(e => ({
        value: String(e.employeeId || e.id || e.user?.id || ''),
        label:
          `${e.user?.first_name || ''} ${e.user?.last_name || ''}`.trim() ||
          e.user?.email ||
          e.name ||
          '',
      })),
      value: employeeId,
      onChange: v => setEmployeeId(String(v)),
    },
    {
      name: 'previousDesignation',
      label: 'Previous Designation',
      type: 'text',
      value: previousDesignation,
      onChange: v => setPreviousDesignation(String(v)),
      component: (
        <AppInputField
          label='Previous Designation'
          value={previousDesignation}
          onChange={e => setPreviousDesignation(e.target.value)}
          fullWidth
        />
      ),
    },
    {
      name: 'newDesignation',
      label: 'New Designation',
      type: 'dropdown',
      required: true,
      options: designations.map(d => ({ value: d.title, label: d.title })),
      value: newDesignation,
      onChange: v => setNewDesignation(String(v)),
    },
    {
      name: 'effectiveDate',
      label: 'Effective Date',
      type: 'text',
      required: true,
      value: effectiveDate,
      onChange: v => setEffectiveDate(String(v)),
      component: (
        <AppInputField
          label='Effective Date'
          value={effectiveDate}
          onChange={e => setEffectiveDate(e.target.value)}
          fullWidth
          type='date'
          InputLabelProps={{ shrink: true }}
        />
      ),
    },
    {
      name: 'remarks',
      label: 'Remarks',
      type: 'textarea',
      value: remarks,
      onChange: v => setRemarks(String(v)),
      component: (
        <AppInputField
          label='Remarks'
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
      ),
    },
  ];

  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Request Promotion'
      fields={fields}
      submitLabel='Submit'
      cancelLabel='Cancel'
      isSubmitting={submitting}
      submitDisabled={submitting || !employeeId || !newDesignation || !effectiveDate}
    />
  );
};

export default PromotionRequestModal;
