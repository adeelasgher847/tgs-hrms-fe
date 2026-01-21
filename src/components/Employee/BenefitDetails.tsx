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
  Pagination,

  CircularProgress,
  TextField,
  Stack,
  InputLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  FileDownload as FileDownloadIcon,
  Edit as EditIcon,
  Delete as CancelIcon,
} from '@mui/icons-material';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import BenefitCard from '../Benefits/BenefitCard';
import { formatDate } from '../../utils/dateUtils';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import AppTable from '../common/AppTable';
import AppPageTitle from '../common/AppPageTitle';
import { IoEyeOutline } from 'react-icons/io5';
import { env } from '../../config/env';
import AppFormModal from '../common/AppFormModal';
import AppButton from '../common/AppButton';

const ITEMS_PER_PAGE = 10;

interface ReimbursementRequest {
  id: string;
  amount: string;
  details?: string;
  description?: string;
  status: string;
  createdAt: string;
  proofDocuments?: string[];
  reviewRemarks?: string;
}

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
  const theme = useTheme();
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

  // const BenefitCardUnsafe =
  //   BenefitCard as unknown as React.ComponentType<BenefitCardPropsWithDates>;

  // History State
  const [reimbursementHistory, setReimbursementHistory] = useState<ReimbursementRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (selectedBenefit) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const history = await employeeBenefitApi.getBenefitReimbursements(
            selectedBenefit.benefitAssignmentId || selectedBenefit.id
          );
          setReimbursementHistory(history);
        } catch (error) {
          console.error('Failed to fetch reimbursement history', error);
          setReimbursementHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setReimbursementHistory([]);
    }
  }, [selectedBenefit]);

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

        const employeeData = (response as unknown as Array<Record<string, unknown>>).find(
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

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('blob:')) return path;
    const baseUrl = env.apiBaseUrl?.endsWith('/')
      ? env.apiBaseUrl.slice(0, -1)
      : env.apiBaseUrl;
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${relativePath}`;
  };

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

  // Reimbursement State
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [reimbursementAmount, setReimbursementAmount] = useState('');
  const [reimbursementDescription, setReimbursementDescription] = useState('');
  const [reimbursementFile, setReimbursementFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submittingReimbursement, setSubmittingReimbursement] = useState(false);

  // Edit Mode State
  const [pendingRequest, setPendingRequest] = useState<ReimbursementRequest | null>(null);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  const handleReimburseClick = () => {
    // Check if there is a pending request
    const pendingReq = reimbursementHistory.find(
      r => r.status === 'pending'
    );

    if (pendingReq) {
      // If pending request exists, force update mode
      setPendingRequest(pendingReq);
      setReimbursementAmount(pendingReq.amount);
      setReimbursementDescription(pendingReq.details || pendingReq.description || '');
      setExistingFiles(pendingReq.proofDocuments || []);
      setFilesToRemove([]);
      setReimbursementFile(null);
      setPreviewUrl(null);
      setIsReimburseModalOpen(true);
    } else {
      // No pending request (can have approved/rejected/cancelled), allow new request
      setPendingRequest(null);
      setReimbursementAmount('');
      setReimbursementDescription('');
      setExistingFiles([]);
      setFilesToRemove([]);
      setReimbursementFile(null);
      setPreviewUrl(null);
      setIsReimburseModalOpen(true);
    }
  };

  const handleReimburseClose = () => {
    setIsReimburseModalOpen(false);
    setReimbursementAmount('');
    setReimbursementDescription('');
    setReimbursementFile(null);
    setPendingRequest(null);
    setExistingFiles([]);
    setFilesToRemove([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Fixed syntax error: removed extra closing braces

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reimbursement request?')) {
      return;
    }

    try {
      await employeeBenefitApi.cancelBenefitReimbursement(requestId);
      alert('Reimbursement request cancelled successfully.');

      // Refresh history
      if (selectedBenefit) {
        const history = await employeeBenefitApi.getBenefitReimbursements(
          selectedBenefit.benefitAssignmentId || selectedBenefit.id
        );
        setReimbursementHistory(history);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      if (!validImageTypes.includes(file.type)) {
        alert('Invalid file type. Only image files are allowed (JPG, JPEG, PNG, GIF, WebP)');
        event.target.value = '';
        return;
      }

      setReimbursementFile(file);

      // If updating, automatically mark ALL existing files for removal to ensure replacement
      if (pendingRequest && existingFiles.length > 0) {
        setFilesToRemove([...existingFiles]);
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReimburseSubmit = async () => {
    if (!selectedBenefit) return;

    const benefitId = selectedBenefit.benefitAssignmentId || selectedBenefit.id;

    if (!benefitId) {
      alert('Benefit ID is missing, cannot submit reimbursement.');
      return;
    }

    setSubmittingReimbursement(true);
    try {
      const formData = new FormData();

      // If updating, we might just need ID in URL, but let's check API
      if (!pendingRequest) {
        formData.append('employeeBenefitId', benefitId);
      }
      formData.append('amount', reimbursementAmount);
      formData.append('details', reimbursementDescription);

      if (reimbursementFile) {
        formData.append('proofDocuments', reimbursementFile);
      }


      if (pendingRequest) {
        await employeeBenefitApi.updateBenefitReimbursement(pendingRequest.id, formData);
        alert('Reimbursement request updated successfully!');
      } else {
        await employeeBenefitApi.createBenefitReimbursement(formData);
        alert('Reimbursement request submitted successfully!');
      }

      handleReimburseClose();

      // Refresh history instead of closing the main dialog
      const history = await employeeBenefitApi.getBenefitReimbursements(
        selectedBenefit.benefitAssignmentId || selectedBenefit.id
      );
      setReimbursementHistory(history);

      setReimbursementHistory(history);

    } catch (error: unknown) {
      console.error('Error submitting reimbursement:', error);
      let errorMessage = 'Failed to submit reimbursement request.';
      const err = error as {
        response?: {
          data?: {
            message?: string | string[];
            error?: string;
          };
        };
      };

      if (err.response && err.response.data) {
        console.error('Server Error Data:', err.response.data);
        const serverData = err.response.data;

        // Try to find a meaningful message in common error formats
        if (serverData.message) {
          errorMessage = Array.isArray(serverData.message)
            ? serverData.message.join(', ')
            : serverData.message;
        } else if (serverData.error) {
          errorMessage = serverData.error;
        }

        alert(`Server Error: ${errorMessage}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmittingReimbursement(false);
    }
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
                    sx={{ color: theme => theme.palette.text.primary }}
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
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
        }}
      >
        <Box>
          <AppPageTitle>My Benefits</AppPageTitle>
        </Box>

        <Box
          sx={{
            mt: { xs: 1, sm: 0 },
            alignSelf: { xs: 'flex-start', sm: 'auto' },
          }}
        >
          <Tooltip title='Download My Benefits'>
            <IconButton
              onClick={handleDownload}
              sx={{
                backgroundColor: '#3083DC',
                borderRadius: '6px',
                padding: { xs: '8px', sm: '6px' },
                color: 'white',
                // keep intrinsic width on small screens; align left under heading
                justifyContent: { xs: 'flex-start', sm: 'center' },
                '&:hover': {
                  backgroundColor: '#3083DC',
                },
              }}
              aria-label='Download My Benefits'
            >
              <FileDownloadIcon aria-hidden='true' />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper
        sx={{
          p: 0,
          borderRadius: 0,
          background: 'transparent',
          boxShadow: 'none',
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
          <Paper sx={{ overflowX: 'auto', boxShadow: 'none', background: 'transparent' }}>
            <AppTable>{tableContent}</AppTable>
          </Paper>
        ) : (
          <Paper sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none' }}>
            <Table>{tableContent}</Table>
          </Paper>
        )}

        {totalPages > 1 && (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            py={2}
          >
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

      <AppFormModal
        open={!!selectedBenefit}
        onClose={() => setSelectedBenefit(null)}
        title={selectedBenefit?.name || 'Benefit Details'}
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        onSubmit={() => { }}
        paperSx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        }}
      >
        {!!selectedBenefit && (
          <BenefitCard
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
            onReimburse={
              (selectedBenefit.statusOfAssignment || selectedBenefit.status) ===
                'active'
                ? handleReimburseClick
                : undefined
            }
          >
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle1' fontWeight={600} gutterBottom>
                Reimbursement History
              </Typography>
              <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 'none' }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Proof</TableCell>
                        <TableCell>HR/Admin Remarks</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
                            <CircularProgress size={20} />
                          </TableCell>
                        </TableRow>
                      ) : reimbursementHistory.length > 0 ? (
                        reimbursementHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {formatDate(item.createdAt)}
                            </TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                size='small'
                                color={
                                  item.status === 'approved'
                                    ? 'success'
                                    : item.status === 'rejected'
                                      ? 'error'
                                      : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                maxWidth: 200,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <Tooltip title={item.details || item.description || ''}>
                                <span>{item.details || item.description || '-'}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {item.proofDocuments && item.proofDocuments.length > 0 ? (
                                // Show only the last uploaded document (recently updated)
                                item.proofDocuments.slice(-1).map((doc: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={getFileUrl(doc)}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    style={{ display: 'block', fontSize: '12px', color: '#1976d2', textDecoration: 'underline' }}
                                  >
                                    View Proof
                                  </a>
                                ))
                              ) : (
                                'No Proof'
                              )}
                            </TableCell>
                            <TableCell>
                              {item.reviewRemarks ? (
                                <Tooltip title={item.reviewRemarks}>
                                  <span>
                                    {item.reviewRemarks.length > 20 ? item.reviewRemarks.substring(0, 20) + '...' : item.reviewRemarks}
                                  </span>
                                </Tooltip>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.status === 'pending' && (
                                <Tooltip title="Edit Request">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      // Directly open edit mode for this item
                                      setPendingRequest(item);
                                      setReimbursementAmount(item.amount);
                                      setReimbursementDescription(item.details || item.description || '');
                                      setExistingFiles(item.proofDocuments || []);
                                      setFilesToRemove([]);
                                      setReimbursementFile(null);
                                      setPreviewUrl(null);
                                      setIsReimburseModalOpen(true);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {item.status === 'pending' && (
                                <Tooltip title="Cancel Request">
                                  <IconButton
                                    size="small"
                                    color="error" // Red color for delete
                                    onClick={() => handleCancelRequest(item.id)}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
                            No reimbursement history found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Box>
          </BenefitCard>
        )}
      </AppFormModal>

      {/* Reimbursement Dialog */}
      <AppFormModal
        open={isReimburseModalOpen}
        onClose={handleReimburseClose}
        title={`${pendingRequest ? 'Update Reimbursement Request' : 'Request Reimbursement'} - ${selectedBenefit?.name}`}
        onSubmit={handleReimburseSubmit}
        submitLabel={pendingRequest ? 'Update Request' : 'Submit Request'}
        isSubmitting={submittingReimbursement}
        submitDisabled={submittingReimbursement || !reimbursementAmount || !reimbursementDescription}
        maxWidth='sm'
        cancelLabel='Cancel'
      >
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Show existing files if in Edit Mode */}
          {existingFiles.length > 0 && (
            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Current Documents:
              </Typography>
              <Stack spacing={1}>
                {existingFiles.map((file, idx) => {
                  const isRemoved = filesToRemove.includes(file);
                  // If file is marked removed (e.g. by new upload), don't show it or show as removed
                  if (isRemoved && reimbursementFile) return null; // Hide old files if replacing

                  return (
                    <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" p={1} bgcolor="#f5f5f5" borderRadius={1}>
                      <Box
                        component="img"
                        src={getFileUrl(file)}
                        alt="Proof"
                        sx={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mr: 2,
                          opacity: isRemoved ? 0.4 : 1,
                          border: isRemoved ? 'none' : '1px solid #ddd'
                        }}
                      />
                      {isRemoved ? (
                        <Typography variant="caption" color="error">Removed</Typography>
                      ) : (
                        <IconButton size="small" color="error" onClick={() => setFilesToRemove(prev => [...prev, file])}>
                          <Typography variant="caption" color="error">Remove</Typography>
                        </IconButton>
                      )}
                    </Box>
                  )
                })}
              </Stack>
            </Box>
          )}

          <TextField
            label='Amount'
            type='number'
            fullWidth
            value={reimbursementAmount}
            onChange={(e) => setReimbursementAmount(e.target.value)}
            required
          />

          <TextField
            label='Payment Details / Description'
            multiline
            rows={4}
            fullWidth
            value={reimbursementDescription}
            onChange={(e) => setReimbursementDescription(e.target.value)}
            placeholder='Enter bank details or expense description...'
            required
          />

          <Box>
            <InputLabel sx={{ mb: 1 }}>Upload Proof (Image)</InputLabel>
            <AppButton
              variant='outlined'
              variantType='secondary'
              component='label'
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {reimbursementFile ? reimbursementFile.name : 'Choose File'}
              <input
                type='file'
                hidden
                onChange={handleFileChange}
                accept='image/jpeg,image/png,image/webp,image/gif'
              />
            </AppButton>
            {previewUrl && (
              <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={previewUrl}
                  alt='Proof Preview'
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </AppFormModal>
    </Box >
  );
};

export default BenefitDetails;
