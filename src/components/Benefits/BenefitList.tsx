import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Button,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Delete as DeleteIcon } from '@mui/icons-material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BenefitFormModal from './BenefitFormModal';
import type { BenefitFormValues } from './BenefitFormModal';
import benefitsApi from '../../api/benefitApi';

const ITEMS_PER_PAGE = 10;

interface Benefit {
  id: string;
  name: string;
  type: string;
  description: string;
  eligibilityCriteria: string;
  status: string;
}

const BenefitList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
      };

      const resp = await benefitsApi.getBenefits(params);

      const items = Array.isArray(resp) ? resp : resp.items || [];

      setBenefits(items);

      // Extract unique types and statuses
      const uniqueTypes = Array.from(new Set(items.map(b => b.type)));
      const uniqueStatuses = Array.from(new Set(items.map(b => b.status)));

      setTypes(uniqueTypes);
      setStatuses(uniqueStatuses);

      setTotalPages(resp?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching benefits:', err);
      setBenefits([]);
      setTypes([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBenefits = benefits.filter(b => {
    const matchesType =
      filterType === 'all' || b.type.toLowerCase() === filterType.toLowerCase();
    const matchesStatus =
      filterStatus === 'all' ||
      b.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesType && matchesStatus;
  });

  useEffect(() => {
    fetchBenefits();
  }, [page, filterType, filterStatus]);

  const handleSaveBenefit = async (data: BenefitFormValues) => {
    try {
      setLoading(true);
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        eligibilityCriteria: data.eligibilityCriteria,
        status: data.status.toLowerCase(),
      };

      if (editingBenefit) {
        await benefitsApi.updateBenefit(editingBenefit.id, payload);
        setToastMessage('Benefit updated successfully!');
      } else {
        await benefitsApi.createBenefit(payload);
        setToastMessage('Benefit created successfully!');
      }

      setToastSeverity('success');
      setShowToast(true);
      setModalOpen(false);
      setEditingBenefit(null);
      fetchBenefits();
    } catch (error: any) {
      console.error('Error saving benefit:', error);
      setToastSeverity('error');
      if (error.response?.status === 404) {
        setToastMessage('Benefit not found.');
      } else if (error.response?.status === 409) {
        setToastMessage('A benefit with this name already exists.');
      } else {
        setToastMessage('Failed to save benefit.');
      }
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this benefit?'))
      return;

    try {
      setLoading(true);
      await benefitsApi.deleteBenefit(id);
      setToastMessage('Benefit deleted successfully!');
      setToastSeverity('success');
      setShowToast(true);
      fetchBenefits();
    } catch (error: any) {
      console.error('Error deleting benefit:', error);
      setToastSeverity('error');
      if (error.response?.status === 404) {
        setToastMessage('Benefit not found.');
      } else {
        setToastMessage('Failed to delete benefit.');
      }
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const csvEscape = (value: any) => {
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
      'Description',
      'Eligibility Criteria',
      'Status',
    ];

    const rows = benefits.map(row =>
      [
        csvEscape(row.name),
        csvEscape(row.type),
        csvEscape(row.description),
        csvEscape(row.eligibilityCriteria),
        csvEscape(row.status),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `BenefitsList_Page${page}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box display='flex' alignItems='center' gap={1} mb={1}>
        <Typography variant='h4' gutterBottom>
          Benefit Management
        </Typography>
      </Box>

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap={2}
      >
        <Box display='flex' gap={2}>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <Select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value='all'>All Types</MenuItem>
              {types.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 160 }}>
            <Select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value='all'>All Status</MenuItem>
              {statuses.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box display='flex' gap={1}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            color='primary'
            onClick={() => {
              setEditingBenefit(null);
              setModalOpen(true);
            }}
          >
            Create
          </Button>

          <Tooltip title='Export Benefit List'>
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
        <Paper sx={{ mt: 2 }}>
          <TableContainer>
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
                    <b>Description</b>
                  </TableCell>
                  <TableCell>
                    <b>Eligibility</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Status</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBenefits.length > 0 ? (
                  filteredBenefits.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.type}</TableCell>
                      <TableCell>{b.description}</TableCell>
                      <TableCell>{b.eligibilityCriteria}</TableCell>
                      <TableCell align='center'>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            backgroundColor:
                              b.status === 'active' ? '#206d23ff' : '#9e9e9e',
                            px: 1,
                            borderRadius: 2,
                            color: 'white',
                            textTransform: 'capitalize',
                          }}
                        >
                          {b.status}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Box display='flex' justifyContent='center' gap={1}>
                          <Tooltip title='Edit'>
                            <IconButton
                              color='primary'
                              size='small'
                              onClick={() => {
                                setEditingBenefit(b);
                                setModalOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title='Delete'>
                            <IconButton
                              color='error'
                              size='small'
                              onClick={() => handleDeleteBenefit(b.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No benefits found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box textAlign='center' my={2}>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(page * ITEMS_PER_PAGE, benefits.length)} of{' '}
          {benefits.length} records
        </Typography>
      </Box>

      <BenefitFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBenefit(null);
        }}
        onSubmit={handleSaveBenefit}
        benefit={editingBenefit || undefined}
      />

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={toastSeverity}
          variant='filled'
          onClose={() => setShowToast(false)}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BenefitList;
