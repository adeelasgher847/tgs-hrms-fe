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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Asset, MockUser } from '../../types/asset';
import { assetApi, type AssetSubcategory } from '../../api/assetApi';

interface AssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; category: string; subcategoryId?: string; purchaseDate: string; assignedTo?: string }) => void;
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
  loading = false,
  title,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [, setSelectedWarrantyDate] = useState<Date | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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

  // Fetch categories and subcategories from backend
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setLoadingData(true);
        const [categoriesData, subcategoriesData] = await Promise.all([
          assetApi.getAssetSubcategoriesByCategory(),
          assetApi.getAllAssetSubcategories()
        ]);
        
        
        // Extract unique categories
        setCategories(categoriesData);
        
        // Store all subcategories
        setSubcategories(subcategoriesData.items || subcategoriesData);
      } catch (error) {
        console.error('❌ Failed to fetch categories and subcategories:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      fetchCategoriesAndSubcategories();
    }
  }, [open]);

  // Get available subcategories for selected category
  const availableSubcategories = subcategories.filter(sub => sub.category === selectedCategory);

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

  const handleFormSubmit = (data: Record<string, unknown>) => {
    onSubmit({
      name: data.name as string,
      category: data.category as string,
      subcategoryId: data.subcategory as string,
      purchaseDate: selectedDate?.toISOString() || '',
      assignedTo: data.assignedTo as string,
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
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                <Typography variant="body2">{category}</Typography>
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
                                <MenuItem key={subcategory.id} value={subcategory.id}>
                                  <Box>
                                    <Typography variant="body2">{subcategory.name}</Typography>
                                    {subcategory.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {subcategory.description}
                                      </Typography>
                                    )}
                                  </Box>
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
