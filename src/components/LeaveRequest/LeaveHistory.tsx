import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Pagination,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import type { Leave } from '../../type/levetypes';

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<
  string,
  {
    color: 'success' | 'error' | 'warning' | 'default';
    icon: React.ReactElement | null;
  }
> = {
  pending: {
    color: 'warning',
    icon: <AccessTimeIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  approved: {
    color: 'success',
    icon: <CheckCircleIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  rejected: {
    color: 'error',
    icon: <CancelIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  withdrawn: {
    color: 'default',
    icon: <UndoIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return 'N/A';
  }
};

interface LeaveHistoryProps {
  leaves: Leave[];
  isAdmin: boolean;
  isManager?: boolean;
  currentUserId?: string;
  onAction?: (id: string, action: 'approved' | 'rejected') => void;
  onWithdraw?: (id: string) => void;
  title?: string;
  showNames?: boolean;
  viewMode?: 'you' | 'team';
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  leaves,
  isAdmin,
  isManager = false,
  currentUserId,
  onAction,
  onWithdraw,
  title = 'Leave History',
  showNames = false,
  viewMode = 'you',
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [page, setPage] = useState(1);

  const hideNameColumn = isManager && viewMode === 'you';
  const hideDropdown = isManager && viewMode === 'you';

  const employeeNames = useMemo(() => {
    const names = new Set<string>();
    leaves.forEach(l => {
      const empId =
        l.employee?.id || l.employee_id || l.user_id || l.employeeId;
      const name = l.employee?.first_name || l.name;
      if (empId && name && empId !== currentUserId) names.add(name);
    });
    return Array.from(names);
  }, [leaves, currentUserId]);

  const filteredLeaves = useMemo(() => {
    if (isManager && viewMode === 'you') {
      return leaves.filter(
        l =>
          l.employee?.id === currentUserId ||
          l.employee_id === currentUserId ||
          l.user_id === currentUserId ||
          l.employeeId === currentUserId
      );
    }

    if (selectedEmployee === '') return leaves;

    return leaves.filter(
      leave =>
        leave.employee?.first_name === selectedEmployee ||
        leave.name === selectedEmployee
    );
  }, [selectedEmployee, leaves, isManager, viewMode, currentUserId]);

  // Pagination Logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE)
  );
  const paginatedLeaves = filteredLeaves.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));

  if (!Array.isArray(leaves)) {
    return (
      <Box>
        <Typography color='error'>Error: Invalid leaves data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon color='primary' sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant='h5' fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {!hideDropdown && (isAdmin || isManager) && (
          <TextField
            select
            size='small'
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            sx={{ minWidth: 200 }}
            SelectProps={{
              displayEmpty: true,
              renderValue: value => (value === '' ? 'All Employees' : value),
            }}
          >
            <MenuItem value=''>All Employees</MenuItem>
            {employeeNames.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {filteredLeaves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='h6' color='textSecondary' gutterBottom>
            No Leave History Found
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {isManager && viewMode === 'you'
              ? "You haven't applied for any leaves yet."
              : 'No leave requests available.'}
          </Typography>
        </Box>
      ) : (
        <Paper elevation={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {!hideNameColumn && (isAdmin || isManager || showNames) && (
                    <TableCell>Name</TableCell>
                  )}
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions / Remarks</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedLeaves.map((leave, index) => (
                  <TableRow key={leave.id || index}>
                    {!hideNameColumn && (isAdmin || isManager || showNames) && (
                      <TableCell>
                        {leave.employee?.first_name || leave.name || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      {leave.leaveType?.name || leave.type || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{formatDate(leave.createdAt)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {leave.reason || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusConfig[leave.status]?.icon}
                        label={
                          leave.status
                            ? leave.status.charAt(0).toUpperCase() +
                              leave.status.slice(1)
                            : 'Unknown'
                        }
                        color={statusConfig[leave.status]?.color}
                        sx={{ fontSize: 15, width: '100%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {leave.status === 'rejected' && leave.remarks && (
                          <Typography
                            variant='body2'
                            sx={{
                              mt: 0.5,
                              fontSize: 13,
                              p: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {leave.remarks}
                          </Typography>
                        )}

                        {isAdmin && leave.status === 'pending' && onAction && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label='Approve'
                              color='success'
                              clickable
                              onClick={() => onAction(leave.id, 'approved')}
                            />
                            <Chip
                              label='Reject'
                              color='error'
                              clickable
                              onClick={() => onAction(leave.id, 'rejected')}
                            />
                          </Box>
                        )}

                        {isManager &&
                          viewMode === 'you' &&
                          onWithdraw &&
                          leave.status === 'pending' && (
                            <Chip
                              label='Withdraw'
                              color='warning'
                              clickable
                              onClick={() => onWithdraw(leave.id)}
                            />
                          )}

                        {!isAdmin &&
                          !isManager &&
                          onWithdraw &&
                          leave.status === 'pending' && (
                            <Chip
                              label='Withdraw'
                              color='warning'
                              clickable
                              onClick={() => onWithdraw(leave.id)}
                            />
                          )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box display='flex' justifyContent='center' my={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color='primary'
        />
      </Box>
      <Box textAlign='center' mb={2}>
        <Typography variant='body2' color='text.secondary'>
          Showing{' '}
          {filteredLeaves.length === 0
            ? 0
            : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredLeaves.length)}
          –{Math.min(page * ITEMS_PER_PAGE, filteredLeaves.length)} of{' '}
          {filteredLeaves.length} records
        </Typography>
      </Box>
    </Box>
  );
};

export default LeaveHistory;
