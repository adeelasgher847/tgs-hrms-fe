import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';
// import { CreateKPIDto, UpdateKPIDto } from '../../api/kpiApi';

export interface KPIFormValues {
    title: string;
    description: string;
    weight: number;
    category: string;
    status: 'active' | 'inactive';
}

interface KPIFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: KPIFormValues) => void;
    kpi?: KPIFormValues | null;
}

const schema = yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string().required('Description is required'),
    weight: yup
        .number()
        .typeError('Weight must be a number')
        .required('Weight is required')
        .min(0, 'Weight must be positive')
        .max(100, 'Weight cannot exceed 100'),
    category: yup.string().required('Category is required'),
    status: yup
        .string()
        .oneOf(['active', 'inactive'] as const)
        .required('Status is required'),
});

const statusOptions: KPIFormValues['status'][] = ['active', 'inactive'];

const KPIFormModal: React.FC<KPIFormModalProps> = ({
    open,
    onClose,
    onSubmit,
    kpi,
}) => {
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<KPIFormValues>({
        resolver: yupResolver(schema),
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            weight: 0,
            category: '',
            status: 'active',
        },
    });

    const initialValues = useMemo((): KPIFormValues => {
        return kpi
            ? {
                title: kpi.title || '',
                description: kpi.description || '',
                weight: kpi.weight || 0,
                category: kpi.category || '',
                status:
                    (kpi.status?.toLowerCase() as KPIFormValues['status']) || 'active',
            }
            : {
                title: '',
                description: '',
                weight: 0,
                category: '',
                status: 'active',
            };
    }, [kpi]);

    useEffect(() => {
        reset(initialValues);
    }, [initialValues, reset]);

    const watchedValues = watch();

    const isChanged = useMemo(() => {
        return (
            watchedValues.title !== initialValues.title ||
            watchedValues.description !== initialValues.description ||
            watchedValues.weight !== initialValues.weight ||
            watchedValues.category !== initialValues.category ||
            watchedValues.status !== initialValues.status
        );
    }, [watchedValues, initialValues]);

    const submitWrapper = () => {
        void handleSubmit(onSubmit)();
    };

    const fields: FormField[] = [
        {
            name: 'title',
            label: 'KPI Title',
            type: 'text',
            value: watchedValues.title,
            onChange: v => setValue('title', String(v), { shouldValidate: true }),
            error: errors.title?.message,
            component: (
                <Controller
                    name='title'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='KPI Title'
                            placeholder='Ex: Employee Engagement'
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                    )}
                />
            ),
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            value: watchedValues.description,
            onChange: v => setValue('description', String(v), { shouldValidate: true }),
            error: errors.description?.message,
            component: (
                <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='Description'
                            placeholder='Describe the KPI...'
                            multiline
                            rows={3}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                        />
                    )}
                />
            ),
        },
        {
            name: 'weight',
            label: 'Weight',
            type: 'text',
            value: watchedValues.weight,
            onChange: v => setValue('weight', Number(v), { shouldValidate: true }),
            error: errors.weight?.message,
            component: (
                <Controller
                    name='weight'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='Weight'
                            type='number'
                            placeholder='20'
                            error={!!errors.weight}
                            helperText={errors.weight?.message}
                        />
                    )}
                />
            ),
        },
        {
            name: 'category',
            label: 'Category',
            type: 'text',
            value: watchedValues.category,
            onChange: v => setValue('category', String(v), { shouldValidate: true }),
            error: errors.category?.message,
            component: (
                <Controller
                    name='category'
                    control={control}
                    render={({ field }) => (
                        <AppInputField
                            {...field}
                            label='Category'
                            placeholder='Ex: Support Department'
                            error={!!errors.category}
                            helperText={errors.category?.message}
                        />
                    )}
                />
            ),
        },
        {
            name: 'status',
            label: 'Status',
            type: 'dropdown',
            value: watchedValues.status,
            onChange: v => setValue('status', String(v) as KPIFormValues['status'], { shouldValidate: true }),
            error: errors.status?.message,
            component: (
                <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                        <AppDropdown
                            label='Status'
                            options={statusOptions.map(o => ({
                                value: o,
                                label: o.charAt(0).toUpperCase() + o.slice(1),
                            }))}
                            value={field.value}
                            onChange={e => field.onChange(e.target.value)}
                            showLabel
                        />
                    )}
                />
            ),
        },
    ];

    return (
        <AppFormModal
            open={open}
            onClose={onClose}
            onSubmit={submitWrapper}
            title={kpi ? 'Edit KPI' : 'Create KPI'}
            fields={fields}
            submitLabel={kpi ? 'Update' : 'Create'}
            cancelLabel='Cancel'
            isSubmitting={isSubmitting}
            hasChanges={isChanged}
            submitDisabled={!isValid || isSubmitting || !isChanged}
            maxWidth='sm'
        />
    );
};

export default KPIFormModal;
