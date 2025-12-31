import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
  Chip,
  Dialog,
  Pagination,
  CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import BenefitCard from '../Benefits/BenefitCard';
import { formatDate } from '../../utils/dateUtils';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import AppTable from '../common/AppTable';
import AppPageTitle from '../common/AppPageTitle';
import { IoEyeOutline } from 'react-icons/io5';

const ITEMS_PER_PAGE = 10;

interface BenefitRow {
  benefitAssignmentId?: string;
  id?: string;
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string | null;
  statusOfAssignment?: string;
  status?: string;
  eligibilityCriteria?: string;
  description?: string;
}

const BenefitDetails: React.FC = () => {
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitRow | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const role = normalizeRole(getUserRole());
  const isManager =
    role === 'manager' || (role as string) === 'payroll manager';
  const shouldUseAppTable = isManager || role === 'employee';

  interface BenefitCardPropsWithDates {
    name: string;
    type: string;
    eligibilityCriteria: string;
    description?: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }

  const BenefitCardUnsafe =
    BenefitCard as unknown as React.ComponentType<BenefitCardPropsWithDates>;

  useEffect(() => {
    const fetchBenefits = async () => {
      setLoading(true);
      try {
        const employeeId = localStorage.getItem('employeeId');
        if (!employeeId) {
          setLoading(false);
          return;
        }

        const response = await employeeBenefitApi.getEmployeeBenefits(page);

        const employeeData = (response as Array<Record<string, unknown>>).find(
          emp => (emp as Record<string, unknown>)['employeeId'] === employeeId
        );

        if (employeeData && Array.isArray(employeeData['benefits'])) {
          setBenefits(employeeData['benefits'] as unknown as BenefitRow[]);
        } else {
          setBenefits([]);
        }
      } catch {
        setBenefits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, [page]);

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (benefits.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvHeader = [
      'Benefit Name',
      'Type',
      'Start Date',
      'End Date',
      'Status',
    ];
    const rows = benefits.map((row: BenefitRow) =>
      [
        csvEscape(row.name),
        csvEscape(row.type),
        csvEscape(formatDate(row.startDate || '')),
        csvEscape(formatDate((row.endDate as string) || '')),
        csvEscape(row.statusOfAssignment || row.status),
      ].join(',')
    );
    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `MyBenefits_Page${page}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalRecords = benefits.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  const paginatedBenefits = benefits.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const tableContent = (
    <>
      <TableHead>
        <TableRow>
          <TableCell>
            <b>Benefit Name</b>
          </TableCell>
          <TableCell>
            <b>Type</b>
          </TableCell>
          <TableCell>
            <b>Start Date</b>
          </TableCell>
          <TableCell>
            <b>End Date</b>
          </TableCell>
          <TableCell>
            <b>Status</b>
          </TableCell>
          <TableCell align='center'>
            <b>Details</b>
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {paginatedBenefits.length > 0 ? (
          paginatedBenefits.map((b: BenefitRow) => (
            <TableRow key={b.benefitAssignmentId || b.id}>
              <TableCell>{b.name || '-'}</TableCell>
              <TableCell>{b.type || '-'}</TableCell>
              <TableCell>{formatDate(b.startDate || '')}</TableCell>
              <TableCell>{formatDate((b.endDate as string) || '')}</TableCell>
              <TableCell>
                <Chip
                  label={b.statusOfAssignment || b.status || '-'}
                  color={
                    (b.statusOfAssignment || b.status) === 'active'
                      ? 'success'
                      : 'default'
                  }
                  size='small'
                />
              </TableCell>
              <TableCell align='center'>
                <Tooltip title='View Details'>
                  <IconButton
                    size='small'
                    onClick={() => setSelectedBenefit(b)}
                    sx={{ color: theme => theme.palette.primary.main }}
                    aria-label='View benefit details'
                  >
                    <IoEyeOutline size={20} aria-hidden='true' />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} align='center'>
              No assigned benefits found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  );

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box>
          <AppPageTitle>My Benefits</AppPageTitle>
        </Box>

        {isManager ? (
          <Tooltip title='Download My Benefits'>
            <IconButton
              onClick={handleDownload}
              sx={{
                backgroundColor: '#3083DC',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#3083DC',
                },
              }}
              aria-label='Download My Benefits'
            >
              <FileDownloadIcon aria-hidden='true' />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title='Download My Benefits'>
            <IconButton
              onClick={handleDownload}
              sx={{
                backgroundColor: '#3083DC',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#3083DC',
                },
              }}
              aria-label='Download My Benefits'
            >
              <FileDownloadIcon aria-hidden='true' />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Paper
        sx={{
          p: role === 'employee' ? 0 : 2,
          borderRadius: role === 'employee' ? 0 : 2,
          boxShadow: role === 'employee' ? 'none' : undefined,
          background: role === 'employee' ? 'unset' : undefined,
          mt: role === 'employee' ? 0 : undefined,
        }}
      >
        {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress />
        </Box>
      ) : shouldUseAppTable ? (
        <AppTable>{tableContent}</AppTable>
      ) : (
        <Paper sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none' }}>
          <Table>{tableContent}</Table>
        </Paper>
      )}

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' alignItems='center' py={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
          />
        </Box>
      )}

      {totalRecords > 0 && (
        <Box textAlign='center' my={2}>
          <Typography variant='body2' color='text.secondary'>
            Showing page {page} of {totalPages} ({totalRecords} total records)
          </Typography>
        </Box>
      )}
      </Paper>

      <Dialog
        open={!!selectedBenefit}
        onClose={() => setSelectedBenefit(null)}
        PaperProps={{
          sx: {},
        }}
      >
        {!!selectedBenefit && (
          <Box>
            <BenefitCardUnsafe
              name={selectedBenefit.name || ''}
              type={selectedBenefit.type || ''}
              eligibilityCriteria={selectedBenefit.eligibilityCriteria || ''}
              description={selectedBenefit.description}
              startDate={formatDate(selectedBenefit.startDate || '')}
              endDate={formatDate((selectedBenefit.endDate as string) || '')}
              status={
                selectedBenefit.statusOfAssignment ||
                selectedBenefit.status ||
                ''
              }
            />
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default BenefitDetails;
