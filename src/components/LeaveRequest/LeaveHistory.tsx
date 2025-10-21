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
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import type { Leave } from '../../type/levetypes';

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

const LeaveHistory = ({
  leaves,
  isAdmin,
  isManager = false,
  onAction,
  onWithdraw,
  title = 'Leave History',
  showNames = false,
}: {
  leaves: Leave[];
  isAdmin: boolean;
  isManager?: boolean;
  onAction: (id: string, action: 'approved' | 'rejected') => void;
  onWithdraw?: (id: string) => void;
  title?: string;
  showNames?: boolean;
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const filteredLeaves = useMemo(() => {
    if (!selectedEmployee) return leaves;
    return leaves.filter(
      leave =>
        leave.employee?.first_name === selectedEmployee ||
        leave.name === selectedEmployee
    );
  }, [selectedEmployee, leaves]);

  if (!Array.isArray(leaves)) {
    return (
      <Box>
        <Typography color='error'>Error: Invalid leaves data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Row */}
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

        {(isAdmin || isManager) && (
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
            {[...new Set(leaves.map(l => l.employee?.first_name || l.name))]
              .filter(Boolean)
              .map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
          </TextField>
        )}
      </Box>

      {/* Table */}
      {filteredLeaves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='h6' color='textSecondary' gutterBottom>
            No Leave History Found
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {title === 'My Leaves'
              ? "You haven't applied for any leaves yet."
              : 'No leave requests available.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                {(isAdmin || isManager || showNames) && (
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
              {filteredLeaves.map((leave, index) => (
                <TableRow key={leave.id || index}>
                  {(isAdmin || isManager || showNames) && (
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
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {leave.status === 'rejected' && leave.remarks && (
                        <Typography
                          variant='body2'
                          // color='error'
                          sx={{
                            mt: 0.5,
                            fontSize: 13,
                            // fontStyle: 'italic',
                            // backgroundColor: '#ffe6e6',
                            p: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          {leave.remarks}
                        </Typography>
                      )}

                      {(isAdmin || isManager) && leave.status === 'pending' && (
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

                      {!isAdmin && onWithdraw && leave.status === 'pending' && (
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
      )}
    </Box>
  );
};

export default LeaveHistory;
