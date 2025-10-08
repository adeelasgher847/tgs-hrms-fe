import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Asset, AssetCategory, UpdateAssetRequest, MockUser } from '../../types/asset';

interface AssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateAssetRequest & { assignedTo?: string }) => void;
  asset?: Asset | null;
  categories: AssetCategory[];
  users: MockUser[];
  loading?: boolean;
  title?: string;
}

const schema = yup.object({
  name: yup.string().required('Asset name is required'),
  categoryId: yup.string().required('Category is required'),
  serialNumber: yup.string().required('Serial number is required'),
  purchaseDate: yup.date().required('Purchase date is required'),
  warrantyExpiry: yup.date().nullable(),
  location: yup.string().required('Location is required'),
  description: yup.string(),
  assignedTo: yup.string().nullable(),
});

const AssetModal: React.FC<AssetModalProps> = ({
  open,
  onClose,
  onSubmit,
  asset,
  categories,
  users,
  loading = false,
  title,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedWarrantyDate, setSelectedWarrantyDate] = useState<Date | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      categoryId: '',
      serialNumber: '',
      purchaseDate: new Date(),
      warrantyExpiry: null,
      location: '',
      description: '',
      assignedTo: '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name,
        categoryId: asset.category.id,
        serialNumber: asset.serialNumber,
        purchaseDate: new Date(asset.purchaseDate),
        warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null,
        location: asset.location,
        description: asset.description || '',
        assignedTo: asset.assignedTo || '',
      });
      setSelectedDate(new Date(asset.purchaseDate));
      setSelectedWarrantyDate(asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null);
    } else {
      reset({
        name: '',
        categoryId: '',
        serialNumber: '',
        purchaseDate: new Date(),
        warrantyExpiry: null,
        location: '',
        description: '',
        assignedTo: '',
      });
      setSelectedDate(new Date());
      setSelectedWarrantyDate(null);
    }
  }, [asset, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      purchaseDate: selectedDate?.toISOString() || '',
      warrantyExpiry: selectedWarrantyDate?.toISOString() || undefined,
    });
  };

  const handleClose = () => {
    reset();
    setSelectedDate(new Date());
    setSelectedWarrantyDate(null);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {title || (asset ? 'Edit Asset' : 'Add New Asset')}
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Asset Name"
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          disabled={loading}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.categoryId}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            {...field}
                            label="Category"
                            disabled={loading}
                          >
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name="serialNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Serial Number"
                          error={!!errors.serialNumber}
                          helperText={errors.serialNumber?.message}
                          disabled={loading}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location"
                          error={!!errors.location}
                          helperText={errors.location?.message}
                          disabled={loading}
                        />
                      )}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <DatePicker
                      label="Purchase Date"
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setValue('purchaseDate', date || new Date());
                      }}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.purchaseDate,
                          helperText: errors.purchaseDate?.message,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <DatePicker
                      label="Warranty Expiry (Optional)"
                      value={selectedWarrantyDate}
                      onChange={(date) => {
                        setSelectedWarrantyDate(date);
                        setValue('warrantyExpiry', date || null);
                      }}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Controller
                    name="assignedTo"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={users}
                        getOptionLabel={(option) => option.name}
                        value={users.find(user => user.id === field.value) || null}
                        onChange={(_, value) => field.onChange(value?.id || '')}
                        disabled={loading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assign to User (Optional)"
                            placeholder="Select a user"
                          />
                        )}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        disabled={loading}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              {loading ? 'Saving...' : (asset ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AssetModal;
