import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
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

interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

const SystemAdminAssets: React.FC = () => {
  const [assets, setAssets] = useState<SystemAsset[]>([]);
  const [summary, setSummary] = useState<SystemAssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map()
  );
  const [subcategoryMap, setSubcategoryMap] = useState<Map<string, string>>(
    new Map()
  );
  const [viewMoreDialogOpen, setViewMoreDialogOpen] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');

  const fetchCategories = async () => {
    try {
      const data = await assetApi.getAllAssetCategories();
      const categoriesList = Array.isArray(data) ? data : [];
      setCategories(categoriesList);

      // Create category map
      const map = new Map<string, string>();
      categoriesList.forEach((cat: AssetCategory) => {
        map.set(cat.id, cat.name);
      });
      setCategoryMap(map);
    } catch (error: unknown) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      // Fetch all subcategories
      const data = await assetApi.getAllAssetSubcategories();
      const subcategoriesList = Array.isArray(data)
        ? data
        : data?.items && Array.isArray(data.items)
          ? data.items
          : [];
      setSubcategories(subcategoriesList);

      // Create subcategory map
      const map = new Map<string, string>();
      subcategoriesList.forEach((subcat: AssetSubcategory) => {
        map.set(subcat.id, subcat.name);
      });
      setSubcategoryMap(map);
    } catch (error: unknown) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await assetApi.getSystemAssetsSummary();
      setSummary(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error fetching asset summary:', error);
      setSummary([]);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const filters: {
        category?: string;
        tenantId?: string;
        assigned?: 'assigned' | 'unassigned';
      } = {};

      // Convert category name to category ID for filtering
      if (categoryFilter) {
        // Find category ID from category name
        const category = categories.find(cat => cat.name === categoryFilter);
        if (category) {
          filters.category = category.id;
        }
      }
      if (tenantFilter) filters.tenantId = tenantFilter;
      if (assignedFilter) {
        filters.assigned = assignedFilter as 'assigned' | 'unassigned';
      }

      const data = await assetApi.getSystemAssets(filters);
      setAssets(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error fetching system assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [categoryFilter, tenantFilter, assignedFilter]);

  const categoryNames = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach(asset => {
      const categoryId = (asset as any).category_id;
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

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => {
        const categoryId = (asset as any).category_id;
        const categoryName = categoryId
          ? categoryMap.get(categoryId) || ''
          : '';
        const subcategoryId = (asset as any).subcategory_id;
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
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
        <Typography variant='h4' fontWeight={600}>
          Assets Overview
        </Typography>
      </Box>

      {summary.length > 0 && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
              <Button
                variant='outlined'
                onClick={() => setViewMoreDialogOpen(true)}
              >
                View More ({summary.length - 6} more)
              </Button>
            </Box>
          )}
        </>
      )}

      {/* View More Dialog */}
      <Dialog
        open={viewMoreDialogOpen}
        onClose={() => setViewMoreDialogOpen(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>All Tenants</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {summary.map(tenantSummary => (
              <Grid item xs={12} sm={6} md={4} key={tenantSummary.tenantId}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%',
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
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewMoreDialogOpen(false)}>Close</Button>
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
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Search assets...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  label='Category'
                >
                  <MenuItem value=''>All Categories</MenuItem>
                  {categoryNames.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tenant</InputLabel>
                <Select
                  value={tenantFilter}
                  onChange={e => setTenantFilter(e.target.value)}
                  label='Tenant'
                >
                  <MenuItem value=''>All Tenants</MenuItem>
                  {tenants.map(tenant => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Assignment</InputLabel>
                <Select
                  value={assignedFilter}
                  onChange={e => setAssignedFilter(e.target.value)}
                  label='Assignment'
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='assigned'>Assigned</MenuItem>
                  <MenuItem value='unassigned'>Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant='outlined'
                startIcon={<FilterIcon />}
                onClick={handleClearFilters}
                sx={{ p: 0.9 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
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
                      <Typography variant='body2' fontWeight={500}>
                        {asset.name}
                      </Typography>
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
                        <Chip
                          label={
                            (asset as any).category_id &&
                            categoryMap.has((asset as any).category_id)
                              ? categoryMap.get((asset as any).category_id)
                              : 'N/A'
                          }
                          size='small'
                        />
                        {(asset as any).subcategory_id &&
                          subcategoryMap.has((asset as any).subcategory_id) && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ ml: 1, display: 'block', mt: 0.5 }}
                            >
                              {subcategoryMap.get(
                                (asset as any).subcategory_id
                              )}
                            </Typography>
                          )}
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
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
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
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default SystemAdminAssets;
