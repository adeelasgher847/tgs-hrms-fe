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
import InfoIcon from '@mui/icons-material/Info';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import BenefitCard from '../Benefits/BenefitCard';
import { formatDate } from '../../utils/dateUtils';

const ITEMS_PER_PAGE = 10;

const BenefitDetails: React.FC = () => {
  const [benefits, setBenefits] = useState<unknown[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

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

        const employeeData = response.find(
          (emp: { employeeId: string }) => emp.employeeId === employeeId
        );

        if (employeeData && Array.isArray(employeeData.benefits)) {
          setBenefits(employeeData.benefits);
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
    const rows = benefits.map(
      (row: {
        name?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        statusOfAssignment?: string;
        status?: string;
      }) =>
        [
          csvEscape(row.name),
          csvEscape(row.type),
          csvEscape(formatDate(row.startDate || '')),
          csvEscape(formatDate(row.endDate || '')),
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

  return (
    <Box>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4' gutterBottom>
          My Benefits
        </Typography>

        <Tooltip title='Download My Benefits'>
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

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none' }}>
          <Table>
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
                paginatedBenefits.map(
                  (b: {
                    benefitAssignmentId?: string;
                    id?: string;
                    name?: string;
                    type?: string;
                    startDate?: string;
                    endDate?: string;
                    statusOfAssignment?: string;
                    status?: string;
                  }) => (
                    <TableRow key={b.benefitAssignmentId || b.id}>
                      <TableCell>{b.name || '-'}</TableCell>
                      <TableCell>{b.type || '-'}</TableCell>
                      <TableCell>{formatDate(b.startDate || '')}</TableCell>
                      <TableCell>{formatDate(b.endDate || '')}</TableCell>
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
                            color='primary'
                            onClick={() => setSelectedBenefit(b)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    No assigned benefits found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

      <Dialog open={!!selectedBenefit} onClose={() => setSelectedBenefit(null)}>
        {selectedBenefit && (
          <Box>
            <BenefitCard
              name={(selectedBenefit as { name?: string }).name || ''}
              type={(selectedBenefit as { type?: string }).type || ''}
              eligibilityCriteria={
                (selectedBenefit as { eligibilityCriteria?: string })
                  .eligibilityCriteria || ''
              }
              description={
                (selectedBenefit as { description?: string }).description
              }
              startDate={formatDate(
                (selectedBenefit as { startDate?: string }).startDate || ''
              )}
              endDate={formatDate(
                (selectedBenefit as { endDate?: string }).endDate || ''
              )}
              status={
                (
                  selectedBenefit as {
                    statusOfAssignment?: string;
                    status?: string;
                  }
                ).statusOfAssignment ||
                (selectedBenefit as { status?: string }).status ||
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
