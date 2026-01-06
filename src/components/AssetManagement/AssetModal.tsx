import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Asset, MockUser } from '../../types/asset';
import { assetApi, type AssetSubcategory } from '../../api/assetApi';
import AppButton from '../common/AppButton';
import { Close as CloseIcon } from '@mui/icons-material';
import AppInputField from '../common/AppInputField';

interface AssetCategory {
  id: string;
  name: string;
  description?: string;
}

interface AssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    categoryId: string;
    subcategoryId?: string;
    purchaseDate: string;
    assignedTo?: string;
  }) => void;
  asset?: Asset | null;
  users: MockUser[];
  loading?: boolean;
  title?: string;
}

const schema = yup.object({
  name: yup.string().required('Asset name is required'),
  category: yup.string().required('Category is required'),
  subcategory: yup.string().nullable(), // Make subcategory optional
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
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [, setSelectedWarrantyDate] = useState<Date | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  type ExtendedAsset = Asset & {
    category_id?: string;
    subcategory_id?: string;
    purchase_date?: string;
    categoryName?: string;
  };

  const isCategoryObject = (
    category: AssetSubcategory['category']
  ): category is { id?: string; name?: string } =>
    typeof category === 'object' && category !== null;

  const resolveAssetCategoryId = (assetDetails: ExtendedAsset): string =>
    assetDetails.category?.id ||
    assetDetails.category_id ||
    assetDetails.category?.name ||
    '';

  const resolveAssetSubcategoryId = (assetDetails: ExtendedAsset): string =>
    assetDetails.subcategoryId || assetDetails.subcategory_id || '';

  const resolveAssetPurchaseDate = (assetDetails: ExtendedAsset): string =>
    assetDetails.purchaseDate ||
    assetDetails.purchase_date ||
    new Date().toISOString();

  const toDateValue = (value: unknown): Date => {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      category: '',
      subcategory: '',
      purchaseDate: new Date(),
      warrantyExpiry: null,
      assignedTo: '',
    },
  });

  const selectedCategoryId = watch('category');

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingData(true);
        const response = await assetApi.getAllAssetCategories();

        // Handle different response structures
        let categoriesData: AssetCategory[] = [];
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          categoriesData = response.items;
        } else if (response.categories && Array.isArray(response.categories)) {
          categoriesData = response.categories;
        }

        setCategories(categoriesData);
      } catch {
        // Leave categories empty on failure; dropdown will show no options
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Fetch subcategories when category is selected
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }

      try {
        setLoadingData(true);
        const response =
          await assetApi.getAssetSubcategoriesByCategoryId(selectedCategoryId);

        // Handle different response structures
        let subcategoriesData: AssetSubcategory[] = [];
        if (Array.isArray(response)) {
          subcategoriesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          subcategoriesData = response.data;
        } else if (
          response &&
          response.items &&
          Array.isArray(response.items)
        ) {
          subcategoriesData = response.items;
        } else if (
          response &&
          response.subcategories &&
          Array.isArray(response.subcategories)
        ) {
          subcategoriesData = response.subcategories;
        }

        // Filter subcategories by selected category ID (client-side filtering as backup)
        // This ensures only subcategories for the selected category are shown
        const selectedCategory = categories.find(
          cat => cat.id === selectedCategoryId
        );

        const filteredSubcategories = subcategoriesData.filter(sub => {
          // Check if subcategory.category matches the selected category ID
          if (sub.category === selectedCategoryId) {
            return true;
          }
          // Also check if it matches the category name (in case API returns names)
          if (selectedCategory && sub.category === selectedCategory.name) {
            return true;
          }
          // Also check if category is an object with id property
          if (isCategoryObject(sub.category)) {
            return sub.category.id === selectedCategoryId;
          }
          return false;
        });

        // Always use filtered subcategories to ensure only selected category's subcategories are shown
        setSubcategories(filteredSubcategories);
      } catch {
        setSubcategories([]);
      } finally {
        setLoadingData(false);
      }
    };

    if (open && selectedCategoryId) {
      fetchSubcategories();
    } else if (!selectedCategoryId) {
      setSubcategories([]);
    }
  }, [open, selectedCategoryId, categories]);

  useEffect(() => {
    // Only reset form when modal opens
    if (!open) return;

    if (asset) {
      // Handle both old and new API response structures
      const extendedAsset = asset as ExtendedAsset;
      const categoryId = resolveAssetCategoryId(extendedAsset);
      const subcategoryId = resolveAssetSubcategoryId(extendedAsset);
      const purchaseDate = resolveAssetPurchaseDate(extendedAsset);

      reset({
        name: asset.name,
        category: categoryId,
        subcategory: subcategoryId,
        purchaseDate: new Date(purchaseDate),
        warrantyExpiry: asset.warrantyExpiry
          ? new Date(asset.warrantyExpiry)
          : null,
        assignedTo: asset.assignedTo || '',
      });
      setSelectedDate(new Date(purchaseDate));
      setSelectedWarrantyDate(
        asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset]);

  const handleFormSubmit = (data: Record<string, unknown>) => {
    // Format date as YYYY-MM-DD
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Get subcategoryId - only include if it's not empty
    const subcategoryId =
      data.subcategory && (data.subcategory as string).trim() !== ''
        ? (data.subcategory as string)
        : undefined;

    onSubmit({
      name: data.name as string,
      categoryId: data.category as string, // category field contains the category ID
      subcategoryId: subcategoryId,
      purchaseDate: formatDate(selectedDate),
      assignedTo: data.assignedTo as string,
    });
  };

  // Disable submit when loading or form invalid. For edit mode, require form to be dirty.
  const submitDisabled = loading || !isValid || (asset ? !isDirty : false);

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
        fullScreen={false}
        fullWidth={!isLargeScreen}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: '90%',
              md: '600px',
              lg: '527px',
            },
            maxWidth: {
              xs: '100%',
              sm: '90%',
              md: '600px',
              lg: '527px',
            },
            borderRadius: { xs: '20px', sm: '30px' },
            padding: {
              xs: '20px 16px',
              sm: '24px 20px',
              lg: '32px 20px',
            },
            backgroundColor: '#FFFFFF',
            margin: { xs: '16px', lg: 'auto' },
            maxHeight: '90vh',
          },
        }}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: '16px', lg: 'auto' },
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ p: 0, pb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant='h6'>
              {title || (asset ? 'Edit Asset' : 'Add New Asset')}
            </Typography>
            <IconButton
              onClick={handleClose}
              size='small'
              aria-label='Close asset modal'
            >
              <CloseIcon aria-hidden='true' />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent sx={{ p: 0, pt: 0, pb: { xs: 2, sm: 3, lg: '32px' } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 2, sm: 3, lg: '32px' },
                pt: { xs: 1, lg: 0 },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name='name'
                      control={control}
                      render={({ field }) => (
                        <AppInputField
                          {...field}
                          fullWidth
                          label='Asset Name'
                          placeholder='Asset name'
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          disabled={loading}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Controller
                      name='category'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            {...field}
                            label='Category'
                            disabled={loading || loadingData}
                            onChange={e => {
                              field.onChange(e);
                              setValue('subcategory', ''); // Reset subcategory when category changes
                            }}
                          >
                            {categories.map(category => (
                              <MenuItem key={category.id} value={category.id}>
                                <Typography variant='body2'>
                                  {category.name}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <Typography
                              variant='caption'
                              color='error'
                              sx={{ mt: 0.5, ml: 2 }}
                            >
                              {errors.category.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>

                {selectedCategoryId && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                      <Controller
                        name='subcategory'
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.subcategory}>
                            <InputLabel>Subcategory</InputLabel>
                            <Select
                              {...field}
                              label='Subcategory'
                              disabled={
                                loading || loadingData || !selectedCategoryId
                              }
                            >
                              {loadingData ? (
                                <MenuItem disabled value=''>
                                  <Typography variant='body2'>
                                    Loading subcategories...
                                  </Typography>
                                </MenuItem>
                              ) : subcategories.length === 0 ? (
                                <MenuItem disabled value=''>
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                  >
                                    No subcategories available
                                  </Typography>
                                </MenuItem>
                              ) : (
                                subcategories.map(subcategory => (
                                  <MenuItem
                                    key={subcategory.id}
                                    value={subcategory.id}
                                  >
                                    <Box>
                                      <Typography variant='body2'>
                                        {subcategory.name}
                                      </Typography>
                                      {subcategory.description && (
                                        <Typography
                                          variant='caption'
                                          color='text.secondary'
                                        >
                                          {subcategory.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                            {errors.subcategory && (
                              <Typography
                                variant='caption'
                                color='error'
                                sx={{ mt: 0.5, ml: 2 }}
                              >
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
                      label='Purchase Date'
                      value={selectedDate}
                      onChange={date => {
                        if (date) {
                          const dateValue = toDateValue(date);
                          setSelectedDate(dateValue);
                          setValue('purchaseDate', dateValue);
                        } else {
                          setSelectedDate(null);
                          setValue('purchaseDate', new Date());
                        }
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

          <DialogActions sx={{ p: 0, pt: 0, px: 2, pb: 2 }}>
            <AppButton
              onClick={handleClose}
              variant='outlined'
              variantType='secondary'
              disabled={loading}
              sx={{
                color: '#000000',
                borderColor: '#000000',
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              type='submit'
              variant='contained'
              variantType='primary'
              disabled={submitDisabled}
              sx={{ bgcolor: 'var(--primary-dark-color)', color: '#FFFFFF' }}
            >
              {loading ? 'Saving...' : asset ? 'Update' : 'Create'}
            </AppButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AssetModal;
