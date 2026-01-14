import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { employeeKpiApiService, type EmployeeKPI, type UpdateEmployeeKPIDto } from '../../api/employeeKpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';

interface UpdateKPIProgressModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employeeKPI: EmployeeKPI;
}

interface UpdateKPIFormValues {
    achievedValue: number;
    remarks: string;
}

const schema = yup.object().shape({
    achievedValue: yup.number().typeError('Achieved value must be a number').required('Achieved value is required').min(0, 'Must be 0 or greater'),
    remarks: yup.string().required('Remarks are required'),
});

const UpdateKPIProgressModal: React.FC<UpdateKPIProgressModalProps> = ({ open, onClose, onSuccess, employeeKPI }) => {
    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<UpdateKPIFormValues>({
        resolver: yupResolver(schema),
        defaultValues: {
            achievedValue: employeeKPI.achievedValue || 0,
            remarks: employeeKPI.remarks || '',
        }
    });

    const { showError, showSuccess } = useErrorHandler();

    const onSubmit = async (data: UpdateKPIFormValues) => {
        try {
            const payload: UpdateEmployeeKPIDto = {
                achievedValue: data.achievedValue,
                remarks: data.remarks,
                // We keep other fields same or simplified update. The API endpoint updateEmployeeKPI supports partial updates.
            };

            await employeeKpiApiService.updateEmployeeKPI(employeeKPI.id, payload);
            showSuccess('KPI progress updated successfully');
            onSuccess();
            onClose();
        } catch (error) {
            showError(error);
        }
    };

    const fields: FormField[] = [
        {
            name: 'achievedValue',
            label: `Achieved Value (Target: ${employeeKPI.targetValue})`,
            type: 'text', // Workaround for now, relying on AppInputField to handle type='number' via spread
            value: watch('achievedValue'),
            onChange: (v) => setValue('achievedValue', Number(v), { shouldValidate: true }),
            error: errors.achievedValue?.message,
            component: (
                <Controller
                    name='achievedValue'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label={`Achieved Value (Target: ${employeeKPI.targetValue})`}
                            type='number'
                            error={!!errors.achievedValue}
                            helperText={errors.achievedValue?.message}
                        />
                    )}
                />
            )
        },
        {
            name: 'remarks',
            label: 'Remarks',
            type: 'textarea',
            value: watch('remarks'),
            onChange: (v) => setValue('remarks', String(v), { shouldValidate: true }),
            error: errors.remarks?.message,
            component: (
                <Controller
                    name='remarks'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='Remarks'
                            multiline
                            rows={3}
                            error={!!errors.remarks}
                            helperText={errors.remarks?.message}
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
            onSubmit={handleSubmit(onSubmit)}
            title={`${employeeKPI.kpi?.title}`}
            fields={fields}
            submitLabel="Update"
            cancelLabel="Cancel"
            isSubmitting={isSubmitting}
            maxWidth="sm"
        />
    );
};

export default UpdateKPIProgressModal;
