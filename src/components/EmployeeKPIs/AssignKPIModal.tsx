import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { employeeKpiApiService, type CreateEmployeeKPIDto } from '../../api/employeeKpiApi';
import { teamApiService, type TeamMember } from '../../api/teamApi';
import { kpiApiService, type KPI } from '../../api/kpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';

interface AssignKPIModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    // If provided, we pre-select this employee (e.g. assigning to specific team member)
    preSelectedEmployeeId?: string;
    // Determine if we show all employees or just team members
    // For now, let's assume if preSelectedEmployeeId is missing, we load team members or all depending on role?
    // The request said "use getMyTeamMembers()".
}

// Form values interface
interface KPIAssignmentFormValues {
    employeeId: string;
    kpiId: string;
    targetValue: number;
    reviewCycle: string;
}

const schema = yup.object().shape({
    employeeId: yup.string().required('Employee is required'),
    kpiId: yup.string().required('KPI is required'),
    targetValue: yup.number().typeError('Target value must be a number').required('Target value is required').min(1, 'Must be greater than 0'),
    reviewCycle: yup.string().required('Review Cycle is required'),
});

const AssignKPIModal: React.FC<AssignKPIModalProps> = ({ open, onClose, onSuccess, preSelectedEmployeeId }) => {
    const { control, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<KPIAssignmentFormValues>({
        resolver: yupResolver(schema),
        defaultValues: {
            employeeId: preSelectedEmployeeId || '',
            kpiId: '',
            targetValue: 0,
            reviewCycle: '',
        }
    });

    useEffect(() => {
        if (open) {
            reset({
                employeeId: preSelectedEmployeeId || '',
                kpiId: '',
                targetValue: 0,
                reviewCycle: '',
            });
        }
    }, [open, preSelectedEmployeeId, reset]);

    const [employees, setEmployees] = useState<TeamMember[]>([]);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const { showError, showSuccess } = useErrorHandler();

    // Get current user for reviewedBy
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (open) {
            const loadData = async () => {
                setLoadingData(true);
                try {
                    // Load Employees (My Team Members)
                    // If Admin, might want all employees? But Requirement says "for manager... use getMyTeamMembers()"
                    // For Admin assigning, maybe we need getAllTeamMembers?
                    // Let's assume Manager context for now based on requirement.
                    // If I am admin, I might want to assign to anyone.
                    // Let's try to load based on role or fallback.
                    let employeeList: TeamMember[] = [];

                    // Simple check: if we have preSelectedEmployeeId, maybe we don't need to fetch list if we have name?
                    // But we need list for dropdown.

                    if (user.role?.name === 'System Admin') {
                        // System Admin usually manages Tenants, might not assign employee KPIs directly?
                        // Skip for now.
                    } else if (['Admin', 'HR Admin'].includes(user.role?.name)) {
                        // Admin might want all employees
                        const res = await teamApiService.getAllTeamMembers(1); // Page 1? Might need "All" endpoint or search
                        employeeList = res.items;
                    } else {
                        // Manager
                        const res = await teamApiService.getMyTeamMembers(1, 100); // larger limit
                        employeeList = res.items;
                    }
                    setEmployees(employeeList || []);

                    // Load KPIs
                    const kpiRes = await kpiApiService.getKPIs(1); // Page 1? Need all?
                    // Ideally we need an endpoint for "All Active KPIs" for dropdown
                    // Assuming getKPIs returns array directly based on implementation in kpiApi.ts (it returned items directly in `getKPIs` if I recall correctly, checking kpiApi.ts...)
                    // Actually `getKPIs` in `kpiApi.ts` returned `Promise<KPI[]>`.
                    setKpis(kpiRes || []);

                } catch (error) {
                    showError(error);
                } finally {
                    setLoadingData(false);
                }
            };
            loadData();
        }
    }, [open]);

    const onSubmit = async (data: KPIAssignmentFormValues) => {
        try {
            const payload: CreateEmployeeKPIDto = {
                employeeId: data.employeeId,
                kpiId: data.kpiId,
                targetValue: data.targetValue,
                achievedValue: 0, // Initial
                reviewCycle: data.reviewCycle,
                reviewedBy: user.id, // Current user
                remarks: 'Assigned', // Initial remark
            };

            await employeeKpiApiService.assignKPI(payload);
            showSuccess('KPI assigned successfully');
            onSuccess();
            onClose();
        } catch (error) {
            showError(error);
        }
    };

    // Cycle options - maybe dynamic? Hardcoded for now.
    const cycles = ['Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025', 'Q1-2026', 'Q2-2026'];

    const fields: FormField[] = [
        ...(!preSelectedEmployeeId ? [{
            name: 'employeeId',
            label: 'Employee',
            type: 'dropdown' as const,
            value: watch('employeeId'),
            options: employees.map(e => ({
                value: e.id,
                label: `${e.user?.first_name} ${e.user?.last_name}`
            })),
            onChange: (v: any) => setValue('employeeId', String(v), { shouldValidate: true }),
            error: errors.employeeId?.message,
            component: (
                <Controller
                    name='employeeId'
                    control={control}
                    render={({ field }) => (
                        <AppDropdown
                            label='Employee'
                            options={employees.map(e => ({
                                value: e.id,
                                label: `${e.user?.first_name} ${e.user?.last_name}`
                            }))}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            showLabel
                        />
                    )}
                />
            )
        }] : []),
        {
            name: 'kpiId',
            label: 'KPI',
            type: 'dropdown' as const,
            value: watch('kpiId'),
            options: kpis.map(k => ({ value: k.id, label: k.title })),
            onChange: (v) => setValue('kpiId', String(v), { shouldValidate: true }),
            error: errors.kpiId?.message,
            component: (
                <Controller
                    name='kpiId'
                    control={control}
                    render={({ field }) => (
                        <AppDropdown
                            label='KPI'
                            options={kpis.map(k => ({
                                value: k.id,
                                label: `${k.title} (Weight: ${k.weight})`
                            }))}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            showLabel
                        />
                    )}
                />
            )
        },
        {
            name: 'targetValue',
            label: 'Target Value',
            type: 'text' as const,
            value: watch('targetValue'),
            onChange: (v) => setValue('targetValue', Number(v), { shouldValidate: true }),
            error: errors.targetValue?.message,
            component: (
                <Controller
                    name='targetValue'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='Target Value'
                            type='number'
                            error={!!errors.targetValue}
                            helperText={errors.targetValue?.message}
                        />
                    )}
                />
            )
        },
        {
            name: 'reviewCycle',
            label: 'Review Cycle',
            type: 'dropdown' as const,
            value: watch('reviewCycle'),
            options: cycles.map(c => ({ value: c, label: c })),
            onChange: (v) => setValue('reviewCycle', String(v), { shouldValidate: true }),
            error: errors.reviewCycle?.message,
            component: (
                <Controller
                    name='reviewCycle'
                    control={control}
                    render={({ field }) => (
                        <AppDropdown
                            label='Review Cycle'
                            options={cycles.map(c => ({ value: c, label: c }))}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            showLabel
                        />
                    )}
                />
            )
        }
    ];

    return (
        <AppFormModal
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onSubmit as any)}
            title="Assign KPI"
            fields={fields}
            submitLabel="Assign"
            cancelLabel="Cancel"
            isSubmitting={isSubmitting}
            maxWidth="sm"
        />
    );
};

export default AssignKPIModal;
