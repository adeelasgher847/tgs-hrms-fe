import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  TextField,
  MenuItem,
  Tooltip,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import BenefitCard from './BenefitCard';
import AssignEmployeeBenefit from './AssignEmployeeBenefit';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import benefitsApi from '../../api/benefitApi';
import type { EmployeeWithBenefits } from '../../api/employeeBenefitApi';

const ITEMS_PER_PAGE = 25; // Backend returns 25 records per page

const EmployeeBenefits: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithBenefits[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<unknown | null>(null);
  const [openBenefitDialog, setOpenBenefitDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [benefitLoading, setBenefitLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'active' | 'expired' | 'cancelled'
  >('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchEmployees = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const resp = await employeeBenefitApi.getEmployeesWithBenefits(pageNum);

      // Handle both array and paginated response
      const items = Array.isArray(resp) ? resp : resp.items || [];
      const paginationInfo = Array.isArray(resp)
        ? null
        : 'total' in resp && 'totalPages' in resp
          ? resp
          : null;

      const filtered = items.filter(
        emp => emp.benefits && emp.benefits.length > 0
      );
      setEmployees(filtered);

      // Backend returns 25 records per page (fixed page size)
      // If we get 25 records, there might be more pages
      // If we get less than 25, it's the last page
      const hasMorePages = items.length === ITEMS_PER_PAGE;
      const employeesWithBenefitsCount = filtered.length;

      // Use backend pagination info if available, otherwise estimate
      if (paginationInfo && paginationInfo.total && paginationInfo.totalPages) {
        setTotalPages(paginationInfo.totalPages);
        // Count only employees with benefits (non-empty benefits array)
        // If pagination info is available, use it; otherwise count filtered employees
        setTotalRecords(paginationInfo.total);
      } else {
        // Fallback: estimate based on current page and records received
        setTotalPages(hasMorePages ? pageNum + 1 : pageNum);
        // Count employees with benefits across all pages
        setTotalRecords(
          hasMorePages
            ? pageNum * ITEMS_PER_PAGE
            : (pageNum - 1) * ITEMS_PER_PAGE + employeesWithBenefitsCount
        );
      }
    } catch (error) {
      console.error('Error fetching employee benefits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(page);
  }, [page, fetchEmployees]);

  const handleBenefitClick = async (
    benefitId: string,
    employeeBenefitStatus: string,
    benefitAssignmentId: string
  ) => {
    try {
      setBenefitLoading(true);
      const benefitDetails = await benefitsApi.getBenefitById(benefitId);

      setSelectedBenefit({
        ...benefitDetails,
        employeeStatus: employeeBenefitStatus,
        benefitAssignmentId,
      });

      setOpenBenefitDialog(true);
    } catch (error) {
      console.error('Error fetching benefit details:', error);
    } finally {
      setBenefitLoading(false);
    }
  };

  const handleDeleteBenefitClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBenefit?.benefitAssignmentId) return;
    setOpenDeleteDialog(false);

    try {
      await employeeBenefitApi.cancelEmployeeBenefit(
        selectedBenefit.benefitAssignmentId
      );
      setSnackbarMessage('Benefit cancelled successfully!');
      setShowSnackbar(true);
      setOpenBenefitDialog(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error cancelling benefit:', error);
      setSnackbarMessage('Failed to cancel benefit.');
      setShowSnackbar(true);
    }
  };

  const filteredEmployees = employees
    .map(emp => ({
      ...emp,
      benefits:
        selectedStatus === 'all'
          ? emp.benefits
          : emp.benefits.filter(b => b.statusOfAssignment === selectedStatus),
    }))
    .filter(emp => emp.benefits.length > 0);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    try {
      if (!filteredEmployees.length) {
        alert('No data to download.');
        return;
      }

      const csvHeader = [
        'Employee Name',
        'Department',
        'Designation',
        'Benefit Name',
        'Benefit Status',
      ];

      const rows: string[] = [];

      filteredEmployees.forEach(emp => {
        if (emp.benefits?.length > 0) {
          emp.benefits.forEach(benefit => {
            rows.push(
              [
                csvEscape(emp.employeeName),
                csvEscape(emp.department),
                csvEscape(emp.designation),
                csvEscape(benefit.name),
                csvEscape(benefit.statusOfAssignment),
              ].join(',')
            );
          });
        } else {
          rows.push(
            [
              csvEscape(emp.employeeName),
              csvEscape(emp.department),
              csvEscape(emp.designation),
              'N/A',
              'No Benefits',
            ].join(',')
          );
        }
      });

      const csvContent = [csvHeader.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'Employee_Benefits.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error while downloading CSV:', error);
      alert('An error occurred while downloading the CSV.');
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={600} mb={1}>
          Employees Benefits
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <TextField
            select
            size='small'
            value={selectedStatus}
            onChange={e =>
              setSelectedStatus(
                e.target.value as 'all' | 'active' | 'expired' | 'cancelled'
              )
            }
            sx={{ minWidth: 200 }}
            SelectProps={{
              displayEmpty: true,
              renderValue: value =>
                value === 'all'
                  ? 'All Benefits'
                  : value.charAt(0).toUpperCase() + value.slice(1),
            }}
          >
            <MenuItem value='all'>All Benefits</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='expired'>Expired</MenuItem>
            <MenuItem value='cancelled'>Cancelled</MenuItem>
          </TextField>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
            >
              Assign Benefit
            </Button>

            <Tooltip title='Download Employee Benefits'>
              <IconButton
                color='primary'
                onClick={handleDownload}
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 0,
          borderColor: 'divider',
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    Assigned Benefits
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <TableRow key={emp.employeeId}>
                      <TableCell>{emp.employeeName}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.designation}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {emp.benefits.map(b => (
                            <Chip
                              key={b.benefitAssignmentId}
                              label={b.name}
                              color={
                                b.statusOfAssignment === 'active'
                                  ? 'success'
                                  : b.statusOfAssignment === 'expired'
                                    ? 'default'
                                    : 'warning'
                              }
                              variant='outlined'
                              size='small'
                              sx={{ cursor: 'pointer' }}
                              onClick={() =>
                                handleBenefitClick(
                                  b.id,
                                  b.statusOfAssignment,
                                  b.benefitAssignmentId
                                )
                              }
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      No employees with {selectedStatus} benefits
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' alignItems='center' py={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {filteredEmployees.length > 0 && (
        <Box display='flex' justifyContent='center' my={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {page} of {totalPages} ({totalRecords} total records)
          </Typography>
        </Box>
      )}

      <AssignEmployeeBenefit
        open={openForm}
        onClose={() => setOpenForm(false)}
        onAssigned={() => {
          fetchEmployees();
          setSnackbarMessage('Benefit assigned successfully!');
          setShowSnackbar(true);
        }}
      />

      <Dialog
        open={openBenefitDialog}
        onClose={() => setOpenBenefitDialog(false)}
      >
        {benefitLoading ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : selectedBenefit ? (
          <BenefitCard
            name={selectedBenefit.name}
            type={selectedBenefit.type}
            eligibilityCriteria={selectedBenefit.eligibilityCriteria}
            description={selectedBenefit.description}
            status={selectedBenefit.employeeStatus || selectedBenefit.status}
            createdAt={selectedBenefit.createdAt}
            onCancel={
              selectedBenefit.employeeStatus === 'active'
                ? handleDeleteBenefitClick
                : undefined
            }
          />
        ) : (
          <Typography sx={{ p: 2 }}>No benefit details available</Typography>
        )}
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Cancel Benefit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this benefit? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color='primary'>
            No
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={2500}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbarMessage.includes('Failed') ? 'error' : 'success'}
          variant='filled'
          onClose={() => setShowSnackbar(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeBenefits;
