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
import { useLanguage } from '../../hooks/useLanguage';

const ITEMS_PER_PAGE = 10;

const BenefitDetails: React.FC = () => {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'My Benefits',
      downloadTooltip: 'Download My Benefits',
      csvHeaders: ['Benefit Name', 'Type', 'Start Date', 'End Date', 'Status'],
      benefitName: 'Benefit Name',
      type: 'Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status',
      details: 'Details',
      noAssigned: 'No assigned benefits found.',
      showingRecords: (start: number, end: number, total: number) =>
        `Showing ${start}–${end} of ${total} records`,
    },
    ar: {
      pageTitle: 'مزاياي',
      downloadTooltip: 'تنزيل مزاياي',
      csvHeaders: [
        'اسم الميزة',
        'النوع',
        'تاريخ البدء',
        'تاريخ الانتهاء',
        'الحالة',
      ],
      benefitName: 'اسم الميزة',
      type: 'النوع',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      status: 'الحالة',
      details: 'تفاصيل',
      noAssigned: 'لا توجد مزايا مخصصة.',
      showingRecords: (start: number, end: number, total: number) =>
        `عرض ${start}–${end} من ${total} سجلات`,
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;

  useEffect(() => {
    const fetchBenefits = async () => {
      setLoading(true);
      try {
        const employeeId = localStorage.getItem('employeeId');
        if (!employeeId) {
          console.warn('No employeeId found in localStorage');
          setLoading(false);
          return;
        }

        const response = await employeeBenefitApi.getEmployeeBenefits(page);
        console.log('Get Employee Benefits Response:', response);

        const employeeData = response.find(
          (emp: any) => emp.employeeId === employeeId
        );

        // response shape may vary between deployments; support both 'benefits' and 'benefit'
        const list =
          (employeeData && (employeeData.benefits || employeeData.benefit)) ||
          [];
        if (Array.isArray(list)) setBenefits(list);
        else setBenefits([]);
      } catch (err) {
        console.error('Error fetching employee benefits:', err);
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
      alert(L.noAssigned);
      return;
    }

    const csvHeader = L.csvHeaders;
    const rows = (benefits as any[]).map((row: any) =>
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
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        sx={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}
      >
        <Typography
          variant='h4'
          gutterBottom
          dir='ltr'
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {L.pageTitle}
        </Typography>

        <Tooltip title={L.downloadTooltip}>
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
                  <b>{L.benefitName}</b>
                </TableCell>
                <TableCell>
                  <b>{L.type}</b>
                </TableCell>
                <TableCell>
                  <b>{L.startDate}</b>
                </TableCell>
                <TableCell>
                  <b>{L.endDate}</b>
                </TableCell>
                <TableCell>
                  <b>{L.status}</b>
                </TableCell>
                <TableCell align='center'>
                  <b>{L.details}</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedBenefits.length > 0 ? (
                (paginatedBenefits as any[]).map((b: any) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    {L.noAssigned}
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

      <Box textAlign='center' my={2}>
        <Typography variant='body2' color='text.secondary'>
          {L.showingRecords(
            totalRecords === 0
              ? 0
              : Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalRecords),
            Math.min(page * ITEMS_PER_PAGE, totalRecords),
            totalRecords
          )}
        </Typography>
      </Box>

      <Dialog open={!!selectedBenefit} onClose={() => setSelectedBenefit(null)}>
        {selectedBenefit && (
          <Box>
            <BenefitCard
              name={selectedBenefit?.name || ''}
              type={selectedBenefit?.type || ''}
              eligibilityCriteria={selectedBenefit?.eligibilityCriteria || ''}
              description={selectedBenefit?.description}
              status={
                selectedBenefit?.statusOfAssignment ||
                selectedBenefit?.status ||
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
