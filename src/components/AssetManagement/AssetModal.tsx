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
import { assetCategories } from '../../data/assetCategories.ts';

interface AssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateAssetRequest & { assignedTo?: string }) => void;
  asset?: Asset | null;
  users: MockUser[];
  loading?: boolean;
  title?: string;
}

const schema = yup.object({
  name: yup.string().required('Asset name is required'),
  category: yup.string().required('Category is required'),
  subcategory: yup.string().required('Subcategory is required'),
  purchaseDate: yup.date().required('Purchase date is required'),
  warrantyExpiry: yup.date().nullable(),
  assignedTo: yup.string().nullable(),
});

const AssetModal: React.FC<AssetModalProps> = ({
  open,
  onClose,
  onSubmit,
  asset,
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
      category: '',
      subcategory: '',
      purchaseDate: new Date(),
      warrantyExpiry: null,
      assignedTo: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedSubcategory = watch('subcategory');

  // Get available subcategories for selected category
  const availableSubcategories = assetCategories.find(cat => cat.name === selectedCategory)?.subcategories || [];

  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name,
        category: asset.category.name,
        purchaseDate: new Date(asset.purchaseDate),
        warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null,
        assignedTo: asset.assignedTo || '',
      });
      setSelectedDate(new Date(asset.purchaseDate));
      setSelectedWarrantyDate(asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null);
    } else {
      reset({
        name: '',
        category: '',
        subcategory: '',
        purchaseDate: new Date(),
        warrantyExpiry: null,
        assignedTo: '',
      });
      setSelectedDate(new Date());
      setSelectedWarrantyDate(null);
    }
  }, [asset, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      category: data.subcategory || data.category, // Use subcategory if available, otherwise use category
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
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            {...field}
                            label="Category"
                            disabled={loading}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue('subcategory', ''); // Reset subcategory when category changes
                            }}
                          >
                            {assetCategories.map((category) => (
                              <MenuItem key={category.id} value={category.name}>
                                <Box>
                                  <Typography variant="body2">{category.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {category.description}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                              {errors.category.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>

                {selectedCategory && availableSubcategories.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                      <Controller
                        name="subcategory"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.subcategory}>
                            <InputLabel>Subcategory</InputLabel>
                            <Select
                              {...field}
                              label="Subcategory"
                              disabled={loading || !selectedCategory}
                            >
                              {availableSubcategories.map((subcategory) => (
                                <MenuItem key={subcategory} value={subcategory}>
                                  {subcategory}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.subcategory && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                {errors.subcategory.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>
                )}

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
