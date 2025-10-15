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
  Pagination,
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
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BenefitFormModal from './BenefitFormModal'; // ✅ default import only

const ITEMS_PER_PAGE = 10;

interface Benefit {
  id: number;
  name: string;
  type: string;
  description: string;
  eligibility: string;
  status: string;
}

const mockBenefits: Benefit[] = [
  {
    id: 1,
    name: 'Health Insurance',
    type: 'Health',
    description: 'Covers medical expenses and hospitalization.',
    eligibility: 'Full-time employees',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Transport Allowance',
    type: 'Allowance',
    description: 'All employees',
    eligibility: 'Employees with daily office attendance',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Meal Voucher',
    type: 'Voucher',
    description: 'Monthly meal voucher credits.',
    eligibility: 'Full-time employees',
    status: 'Inactive',
  },
];

const BenefitList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setBenefits(mockBenefits);
      setTotalPages(
        Math.max(1, Math.ceil(mockBenefits.length / ITEMS_PER_PAGE))
      );
      setLoading(false);
    }, 800);
    return () => clearTimeout(timeout);
  }, []);

  const filteredData = benefits.filter(b => {
    const matchType = filterType === 'all' || b.type === filterType;
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchType && matchStatus;
  });

  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Dummy UI submit handler
  const handleCreateBenefit = (data: any) => {
    console.log('Form submitted:', data);
    setModalOpen(false);
    setEditingBenefit(null);
    setShowToast(true);
  };

  const handleDownload = () => {
    alert('CSV export will be available after API integration.');
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
              onChange={e => setFilterType(e.target.value)}
            >
              <MenuItem value='all'>All Types</MenuItem>
              <MenuItem value='Health'>Health</MenuItem>
              <MenuItem value='Allowance'>Allowance</MenuItem>
              <MenuItem value='Voucher'>Voucher</MenuItem>
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 160 }}>
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <MenuItem value='all'>All Status</MenuItem>
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
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
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
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
                {paginatedData.length > 0 ? (
                  paginatedData.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.type}</TableCell>
                      <TableCell>{b.description}</TableCell>
                      <TableCell>{b.eligibility}</TableCell>
                      <TableCell align='center'>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            color: b.status === 'Active' ? 'green' : 'gray',
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

                          <Tooltip title='Deactivate'>
                            <IconButton color='error' size='small'>
                              <DoNotDisturbAltIcon />
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

      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        mt={2}
        flexDirection='column'
      >
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
          color='primary'
        />
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Showing{' '}
          {filteredData.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(page * ITEMS_PER_PAGE, filteredData.length)} of{' '}
          {filteredData.length} records
        </Typography>
      </Box>

      <BenefitFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBenefit(null);
        }}
        onSubmit={handleCreateBenefit}
        benefit={editingBenefit || undefined}
      />

      {/* Toast */}
      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity='success'
          variant='filled'
          onClose={() => setShowToast(false)}
        >
          Benefit {editingBenefit ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BenefitList;
