import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Business as BusinessIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  assetApi,
  type SystemAsset,
  type SystemAssetSummary,
  type AssetSubcategory,
} from '../../api/assetApi';
import StatusChip from './StatusChip';
import { formatDate } from '../../utils/dateUtils';
import { PAGINATION } from '../../constants/appConstants';
import { ASSET_TABLE_CONFIG } from '../../theme/themeConfig';
import AppTable from '../common/AppTable';

function truncateText(text: string, limit: number) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}
import AppDropdown from '../common/AppDropdown';
import AppSearch from '../common/AppSearch';
import AppButton from '../common/AppButton';
import AppPageTitle from '../common/AppPageTitle';

interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

interface ExtendedSystemAsset
  extends Omit<SystemAsset, 'category_id' | 'subcategory_id'> {
  category_id?: string;
  subcategory_id?: string | undefined;
}

const SystemAdminAssets: React.FC = () => {
  const [assets, setAssets] = useState<SystemAsset[]>([]);
  const [summary, setSummary] = useState<SystemAssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map()
  );
  const [subcategoryMap, setSubcategoryMap] = useState<Map<string, string>>(
    new Map()
  );
  const [viewMoreDialogOpen, setViewMoreDialogOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
  const theme = useTheme();
  const fetchCategories = async () => {
    try {
      const data = await assetApi.getAllAssetCategories();
      const categoriesList = Array.isArray(data) ? data : [];
      setCategories(categoriesList);

      const map = new Map<string, string>();
      categoriesList.forEach((cat: AssetCategory) => {
        map.set(cat.id, cat.name);
      });
      setCategoryMap(map);
    } catch {
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const data = await assetApi.getAllAssetSubcategories();
      const subcategoriesList = Array.isArray(data)
        ? data
        : data?.items && Array.isArray(data.items)
          ? data.items
          : [];

      const map = new Map<string, string>();
      subcategoriesList.forEach((subcat: AssetSubcategory) => {
        map.set(subcat.id, subcat.name);
      });
      setSubcategoryMap(map);
    } catch {
      // Ignore; subcategory filter will just be empty
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await assetApi.getSystemAssetsSummary();
      setSummary(Array.isArray(data) ? data : []);
    } catch {
      setSummary([]);
    }
  };

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        category?: string;
        tenantId?: string;
        assigned?: 'assigned' | 'unassigned';
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (categoryFilter) {
        const category = categories.find(cat => cat.name === categoryFilter);
        if (category) {
          filters.category = category.id;
        }
      }
      if (tenantFilter) filters.tenantId = tenantFilter;
      if (assignedFilter) {
        filters.assigned = assignedFilter as 'assigned' | 'unassigned';
      }

      const response = await assetApi.getSystemAssets(filters);
      setAssets(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch {
      setAssets([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [
    categoryFilter,
    tenantFilter,
    assignedFilter,
    categories,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, tenantFilter, assignedFilter]);

  const categoryNames = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach(asset => {
      const extendedAsset = asset as ExtendedSystemAsset;
      const categoryId = extendedAsset.category_id;
      if (categoryId && categoryMap.has(categoryId)) {
        cats.add(categoryMap.get(categoryId)!);
      }
    });
    return Array.from(cats).sort();
  }, [assets, categoryMap]);

  const tenants = useMemo(() => {
    const tenantMap = new Map<string, string>();
    assets.forEach(asset => {
      if (asset.tenant_id && asset.tenant) {
        tenantMap.set(asset.tenant_id, asset.tenant.name);
      }
    });
    summary.forEach(s => {
      tenantMap.set(s.tenantId, s.tenantName);
    });
    return Array.from(tenantMap.entries()).map(([id, name]) => ({ id, name }));
  }, [assets, summary]);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => {
        const extendedAsset = asset as ExtendedSystemAsset;
        const categoryId = extendedAsset.category_id;
        const categoryName = categoryId
          ? categoryMap.get(categoryId) || ''
          : '';
        const subcategoryId = extendedAsset.subcategory_id;
        const subcategoryName = subcategoryId
          ? subcategoryMap.get(subcategoryId) || ''
          : '';

        return (
          asset.name.toLowerCase().includes(search) ||
          categoryName.toLowerCase().includes(search) ||
          subcategoryName.toLowerCase().includes(search) ||
          asset.tenant?.name.toLowerCase().includes(search) ||
          (asset.assignedToUser &&
            `${asset.assignedToUser.first_name} ${asset.assignedToUser.last_name}`
              .toLowerCase()
              .includes(search))
        );
      });
    }

    return filtered;
  }, [assets, searchTerm, categoryMap, subcategoryMap]);

  const handleClearFilters = () => {
    setCategoryFilter('');
    setTenantFilter('');
    setAssignedFilter('');
    setSearchTerm('');
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Stack alignItems='center' py={4}>
          <CircularProgress />
          <Typography variant='body2' sx={{ mt: 2 }}>
            Loading assets...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <AppPageTitle>Assets Overview</AppPageTitle>
      </Box>

      {summary.length > 0 && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 3,
              mb: 3,
            }}
          >
            {summary.slice(0, 6).map(tenantSummary => (
              <Card
                key={tenantSummary.tenantId}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      flexGrow: '1',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      <BusinessIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant='h6'
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tenantSummary.tenantName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {tenantSummary.tenantId.slice(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Total
                      </Typography>
                      <Typography variant='body2' fontWeight={600}>
                        {tenantSummary.totalAssets}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Assigned
                      </Typography>
                      <Chip
                        label={tenantSummary.assignedCount}
                        size='small'
                        color='primary'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Available
                      </Typography>
                      <Chip
                        label={tenantSummary.availableCount}
                        size='small'
                        color='success'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Maintenance
                      </Typography>
                      <Chip
                        label={tenantSummary.maintenanceCount}
                        size='small'
                        color='warning'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Retired
                      </Typography>
                      <Chip
                        label={tenantSummary.retiredCount}
                        size='small'
                        color='default'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Lost
                      </Typography>
                      <Chip
                        label={tenantSummary.lostCount}
                        size='small'
                        color='error'
                        sx={{ height: 22 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
          {summary.length > 6 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <AppButton
                variant='outlined'
                variantType='secondary'
                onClick={() => setViewMoreDialogOpen(true)}
                sx={{
                  color: 'var(--primary-dark-color)',
                  borderColor: 'var(--primary-dark-color)',
                  '&:hover': {
                    borderColor: 'var(--primary-dark-color)',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                View More ({summary.length - 6} more)
              </AppButton>
            </Box>
          )}
        </>
      )}

      {/* View More Dialog */}
      <Dialog
        open={viewMoreDialogOpen}
        onClose={() => setViewMoreDialogOpen(false)}
        maxWidth='xl'
        fullWidth
      >
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          All Tenants
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 3,
              mt: 1,
              '@media (max-width: 600px)': {
                gridTemplateColumns: '1fr',
              },
            }}
          >
            {summary.map(tenantSummary => (
              <Card
                key={tenantSummary.tenantId}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  minHeight: '280px',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      flexGrow: '1',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      <BusinessIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant='h6'
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tenantSummary.tenantName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {tenantSummary.tenantId.slice(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Total
                      </Typography>
                      <Typography variant='body2' fontWeight={600}>
                        {tenantSummary.totalAssets}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Assigned
                      </Typography>
                      <Chip
                        label={tenantSummary.assignedCount}
                        size='small'
                        color='primary'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Available
                      </Typography>
                      <Chip
                        label={tenantSummary.availableCount}
                        size='small'
                        color='success'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Maintenance
                      </Typography>
                      <Chip
                        label={tenantSummary.maintenanceCount}
                        size='small'
                        color='warning'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Retired
                      </Typography>
                      <Chip
                        label={tenantSummary.retiredCount}
                        size='small'
                        color='default'
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Lost
                      </Typography>
                      <Chip
                        label={tenantSummary.lostCount}
                        size='small'
                        color='error'
                        sx={{ height: 22 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <AppButton
            variant='outlined'
            variantType='secondary'
            onClick={() => setViewMoreDialogOpen(false)}
          >
            Close
          </AppButton>
        </DialogActions>
      </Dialog>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: 0,
                order: { xs: 1, sm: 'initial' },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <AppSearch
                placeholder='Search assets...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ borderRadius: 2 }}
              />
            </Box>
            <Box
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: 0,
                order: { xs: 2, sm: 'initial' },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <AppDropdown
                label='Category'
                showLabel={false}
                containerSx={{ minWidth: 0, width: '100%' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(String(e.target.value || ''))}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categoryNames.map(cat => ({ value: cat, label: cat })),
                ]}
              />
            </Box>
            <Box
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: 0,
                order: { xs: 3, sm: 'initial' },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <AppDropdown
                label='Tenant'
                showLabel={false}
                containerSx={{ minWidth: 0, width: '100%' }}
                value={tenantFilter}
                onChange={e => setTenantFilter(String(e.target.value || ''))}
                options={[
                  { value: 'all', label: 'All Tenants' },
                  ...tenants.map(tenant => ({
                    value: tenant.id,
                    label: tenant.name,
                  })),
                ]}
              />
            </Box>
            <Box
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: 0,
                order: { xs: 4, sm: 'initial' },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <AppDropdown
                label='Assigned Status'
                showLabel={false}
                containerSx={{ minWidth: 0, width: '100%' }}
                value={assignedFilter}
                onChange={e => setAssignedFilter(String(e.target.value || ''))}
                options={[
                  { value: 'all', label: 'All Assets' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'unassigned', label: 'Unassigned' },
                ]}
              />
            </Box>
            <AppButton
              variant='outlined'
              variantType='secondary'
              startIcon={<FilterIcon />}
              onClick={handleClearFilters}
              sx={{
                p: 0.9,
                width: { xs: '100%', sm: 'auto' },
                color: 'var(--primary-dark-color)',
                borderColor: 'var(--primary-dark-color)',
                '&:hover': {
                  borderColor: 'var(--primary-dark-color)',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Clear Filters
            </AppButton>
          </Box>
        </CardContent>
      </Card>

      <AppTable>
        <TableHead>
          <TableRow>
            <TableCell>Asset Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell
              sx={{
                display: { xs: 'none', md: 'table-cell' },
              }}
            >
              Tenant
            </TableCell>
            <TableCell
              sx={{
                display: { xs: 'none', lg: 'table-cell' },
              }}
            >
              Assigned To
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell
              sx={{
                display: { xs: 'none', sm: 'table-cell' },
              }}
            >
              Date
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                align='center'
                sx={{
                  borderBottom: 'none',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 4,
                  }}
                >
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          ) : filteredAssets.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                align='center'
                sx={{
                  borderBottom: 'none',
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  No assets found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredAssets.map(asset => (
              <TableRow key={asset.id} hover>
                <TableCell>
                  <Tooltip title={asset.name} placement='top'>
                    <Typography
                      variant='body2'
                      fontWeight={500}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                      }}
                    >
                      {truncateText(
                        asset.name,
                        ASSET_TABLE_CONFIG.NAME_LIMIT
                      )}
                    </Typography>
                  </Tooltip>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{
                      display: { xs: 'block', md: 'none' },
                    }}
                  >
                    {asset.tenant?.name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    {(() => {
                      const extendedAsset = asset as ExtendedSystemAsset;
                      const categoryId = extendedAsset.category_id;
                      const subcategoryId = extendedAsset.subcategory_id;
                      return (
                        <>
                          <Chip
                            label={
                              categoryId && categoryMap.has(categoryId)
                                ? categoryMap.get(categoryId)
                                : 'N/A'
                            }
                            size='small'
                          />
                          {subcategoryId &&
                            subcategoryMap.has(subcategoryId) && (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ ml: 1, display: 'block', mt: 0.5 }}
                              >
                                {subcategoryMap.get(subcategoryId)}
                              </Typography>
                            )}
                        </>
                      );
                    })()}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: 'none', md: 'table-cell' },
                  }}
                >
                  <Typography variant='body2'>
                    {asset.tenant?.name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: 'none', lg: 'table-cell' },
                  }}
                >
                  {asset.assignedToUser ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {asset.assignedToUser.first_name}{' '}
                          {asset.assignedToUser.last_name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {asset.assignedToUser.email}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip
                    status={
                      asset.status as
                      | 'available'
                      | 'assigned'
                      | 'under_maintenance'
                      | 'retired'
                    }
                    type='asset'
                  />
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: 'none', sm: 'table-cell' },
                  }}
                >
                  <Typography variant='body2'>
                    {formatDate(asset.purchase_date)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AppTable>
      {!loading && totalPages > 1 && (
        <Box display='flex' justifyContent='center' p={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      {!loading && filteredAssets.length > 0 && (
        <Box display='flex' justifyContent='center' pb={2}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {totalPages} ({filteredAssets.length}{' '}
            records on this page)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SystemAdminAssets;
