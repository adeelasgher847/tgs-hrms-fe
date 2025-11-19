import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import DesignationModal from '../Desigantions/Designation-modal';
import DeleteConfirmationDialog from './Delete-confirmation-dialog';
import { useLanguage } from '../../hooks/useLanguage';
import {
  designationApiService,
  type FrontendDesignation,
} from '../../api/designationApi';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
// import { extractErrorMessage } from '../../utils/errorHandler';

export default function DesignationManager() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [designations, setDesignations] = useState<FrontendDesignation[]>([]);
  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<FrontendDesignation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] =
    useState<FrontendDesignation | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | 'all'
  >('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const itemsPerPage = 25;
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      const backendDepartments = await departmentApiService.getAllDepartments();
      const frontendDepartments = backendDepartments.map(department =>
        departmentApiService.convertBackendToFrontend(department)
      );
      setDepartments(frontendDepartments);
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'department' });
    } finally {
      setDepartmentsLoading(false);
    }
  }, [showError]);

  const fetchDesignations = useCallback(
    async (departmentId: string, page: number = 1) => {
      try {
        setLoading(true);
        const response =
          await designationApiService.getDesignationsByDepartment(
            departmentId,
            page
          );
        const frontendDesignations = response.items.map(designation =>
          designationApiService.convertBackendToFrontend(designation)
        );
        setDesignations(frontendDesignations);

        const hasMorePages = response.items.length === itemsPerPage;

        if (response.totalPages && response.total) {
          setCurrentPage(response.page);
          setTotalPages(response.totalPages);
          setTotalRecords(response.total);
        } else {
          setCurrentPage(response.page || page);
          setTotalPages(hasMorePages ? page + 1 : page);
          setTotalRecords(
            hasMorePages
              ? page * itemsPerPage
              : (page - 1) * itemsPerPage + response.items.length
          );
        }
      } catch (error: unknown) {
        showError(error, { operation: 'fetch', resource: 'designation' });
      } finally {
        setLoading(false);
      }
    },
    [showError, itemsPerPage]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (selectedDepartmentId !== 'all') {
      fetchDesignations(selectedDepartmentId, page);
    } else {
      fetchAllDesignations();
    }
  };

  const fetchAllDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const backendDesignations =
        await designationApiService.getAllDesignations();
      const frontendDesignations = backendDesignations.map(designation =>
        designationApiService.convertBackendToFrontend(designation)
      );
      setDesignations(frontendDesignations);
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'designation' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    setCurrentPage(1);
    if (selectedDepartmentId !== 'all') {
      fetchDesignations(selectedDepartmentId, 1);
    } else {
      fetchAllDesignations();
    }
  }, [selectedDepartmentId, fetchDesignations, fetchAllDesignations]);

  const handleSaveDesignation = async (data: {
    title: string;
    titleAr: string;
    departmentId: string;
  }) => {
    try {
      if (editingDesignation) {
        const designationDto = {
          title: data.title,
          departmentId: data.departmentId,
        };
        const updatedBackendDesignation =
          await designationApiService.updateDesignation(
            editingDesignation.id,
            designationDto
          );
        const updatedFrontendDesignation =
          designationApiService.convertBackendToFrontend(
            updatedBackendDesignation
          );
        const updatedDesignation: FrontendDesignation = {
          ...updatedFrontendDesignation,
          titleAr: data.titleAr || '',
        };
        setDesignations(prev =>
          prev.map(d =>
            d.id === editingDesignation.id ? updatedDesignation : d
          )
        );

        showSuccess('Designation updated successfully');
      } else {
        // Create new designation
        const designationDto = {
          title: data.title,
          departmentId: data.departmentId,
        };
        const newBackendDesignation =
          await designationApiService.createDesignation(designationDto);
        const newFrontendDesignation =
          designationApiService.convertBackendToFrontend(newBackendDesignation);
        const newDesignation: FrontendDesignation = {
          ...newFrontendDesignation,
          titleAr: data.titleAr || '',
        };
        setDesignations(prev => [...prev, newDesignation]);

        showSuccess('Designation created successfully');
      }
      setModalOpen(false);
      setEditingDesignation(null);
    } catch (error: unknown) {
      showError(error, { operation: 'create', resource: 'designation' });
    }
  };

  const handleDeleteDesignation = async () => {
    if (designationToDelete) {
      try {
        await designationApiService.deleteDesignation(designationToDelete.id);
        setDesignations(prev =>
          prev.filter(d => d.id !== designationToDelete.id)
        );
        showSuccess('Designation deleted successfully');
      } catch (error: unknown) {
        showError(error, { operation: 'delete', resource: 'designation' });
      }
    }
    setDeleteDialogOpen(false);
    setDesignationToDelete(null);
  };

  const filteredDesignations =
    selectedDepartmentId === 'all' ? designations : designations;

  const totalPagesForFiltered =
    selectedDepartmentId === 'all'
      ? Math.ceil(filteredDesignations.length / itemsPerPage)
      : totalPages;
  const paginatedData =
    selectedDepartmentId === 'all'
      ? filteredDesignations.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )
      : filteredDesignations;

  return (
    <Box dir={isRTL ? 'rtl' : 'ltr'}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 3,
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: { sx: 'block', sm: 'flex' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingDesignation(null);
              setModalOpen(true);
            }}
            sx={{
              minWidth: 200,
              fontWeight: 600,
              py: 1,
              backgroundColor: '#464b8a',
            }}
          >
            {getText('Create Designation', 'إنشاء مسمى وظيفي')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, boxShadow: 'none' }}>
        <FormControl fullWidth>
          <InputLabel id='dept-select'>
            {getText('Filter by Department', 'تصفية حسب القسم')}
          </InputLabel>
          <Select
            labelId='dept-select'
            value={selectedDepartmentId}
            label={getText('Filter by Department', 'تصفية حسب القسم')}
            onChange={e => {
              setSelectedDepartmentId(
                e.target.value === 'all' ? 'all' : e.target.value
              );
              setCurrentPage(1);
            }}
            disabled={departmentsLoading}
          >
            <MenuItem value='all'>
              {getText('All Departments', 'كل الأقسام')}
            </MenuItem>
            {departmentsLoading ? (
              <MenuItem disabled>
                {getText('Loading departments...', 'جاري تحميل الأقسام...')}
              </MenuItem>
            ) : (
              departments.map(d => (
                <MenuItem key={d.id} value={d.id}>
                  {getText(d.name, d.nameAr)}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Paper>

      <Paper variant='outlined' sx={{ bgcolor: 'unset', border: 'none' }}>
        <Box>
          <Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
            {filteredDesignations.length}{' '}
            {getText('designation(s)', 'مسمى وظيفي')}
          </Typography>

          <TableContainer
            component={Paper}
            variant='outlined'
            sx={{ border: 'none', borderRadius: '0px' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      ...(isRTL
                        ? { textAlign: 'right' }
                        : { textAlign: 'left' }),
                    }}
                  >
                    {getText('Designation Title', 'المسمى الوظيفي')}
                  </TableCell>
                  {selectedDepartmentId === 'all' && (
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        ...(isRTL
                          ? { textAlign: 'right' }
                          : { textAlign: 'left' }),
                      }}
                    >
                      {getText('Department', 'القسم')}
                    </TableCell>
                  )}
                  <TableCell
                    align='center'
                    sx={{
                      fontWeight: 'bold',
                      minWidth: 120,
                    }}
                  >
                    {getText('Actions', 'الإجراءات')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={selectedDepartmentId === 'all' ? 3 : 2}
                      align='center'
                      sx={{ color: 'text.secondary' }}
                    >
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        py={3}
                      >
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={selectedDepartmentId === 'all' ? 3 : 2}
                      align='center'
                      sx={{ color: 'text.secondary' }}
                    >
                      {selectedDepartmentId === 'all'
                        ? getText(
                            'No designations found',
                            'لا توجد مسميات وظيفية'
                          )
                        : getText(
                            'No designations found for this department',
                            'لا توجد مسميات وظيفية لهذا القسم'
                          )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map(designation => {
                    const department = departments.find(
                      d => d.id === designation.departmentId
                    );
                    const departmentName = department
                      ? getText(department.name, department.nameAr)
                      : 'Unknown Department';

                    return (
                      <TableRow key={designation.id} hover>
                        <TableCell
                          sx={{
                            ...(isRTL
                              ? { textAlign: 'right' }
                              : { textAlign: 'left' }),
                          }}
                        >
                          {getText(designation.title, designation.titleAr)}
                        </TableCell>
                        {selectedDepartmentId === 'all' && (
                          <TableCell
                            sx={{
                              ...(isRTL
                                ? { textAlign: 'right' }
                                : { textAlign: 'left' }),
                            }}
                          >
                            {departmentName}
                          </TableCell>
                        )}
                        <TableCell align='center'>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              justifyContent: 'center',
                            }}
                          >
                            <IconButton
                              color='primary'
                              size='small'
                              onClick={() => {
                                setEditingDesignation(designation);
                                setModalOpen(true);
                              }}
                              title={getText('Edit', 'تعديل')}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                            <IconButton
                              color='error'
                              size='small'
                              onClick={() => {
                                setDesignationToDelete(designation);
                                setDeleteDialogOpen(true);
                              }}
                              title={getText('Delete', 'حذف')}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPagesForFiltered > 1 && (
            <Box display='flex' justifyContent='center' mt={2}>
              <Pagination
                count={totalPagesForFiltered}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {paginatedData.length > 0 && (
            <Box display='flex' justifyContent='center' mt={1}>
              <Typography variant='body2' color='textSecondary'>
                {getText(
                  `Showing page ${currentPage} of ${totalPagesForFiltered} (${selectedDepartmentId === 'all' ? filteredDesignations.length : totalRecords} total records)`,
                  `عرض الصفحة ${currentPage} من ${totalPagesForFiltered} (${selectedDepartmentId === 'all' ? filteredDesignations.length : totalRecords} سجل إجمالي)`
                )}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <DesignationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDesignation}
        designation={editingDesignation}
        isRTL={isRTL}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDesignation}
        designationTitle={
          designationToDelete
            ? getText(designationToDelete.title, designationToDelete.titleAr)
            : ''
        }
        isRTL={isRTL}
      />

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
