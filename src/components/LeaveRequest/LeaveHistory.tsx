import React from 'react';
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
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import type { Leave } from '../../type/levetypes';

const typeColor: Record<
  string,
  'success' | 'error' | 'info' | 'warning' | 'default'
> = {
  Vacation: 'success',
  Emergency: 'error',
  Sick: 'info',
  Casual: 'warning',
  Other: 'default',
};

const statusConfig: Record<
  string,
  { color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactElement }
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

const LeaveHistory = ({
  leaves,
  isAdmin,
  onAction,
  onWithdraw,
  title = "My Leaves",
  showNames = false,
}: {
  leaves: Leave[];
  isAdmin: boolean;
  onAction: (id: string, action: 'approved' | 'rejected') => void;
  onWithdraw?: (id: string) => void;
  title?: string;
  showNames?: boolean;
}) => {
  // Debug logging
  console.log('LeaveHistory props:', { leaves, isAdmin });
  console.log('Leaves data:', leaves);

  // Check if leaves array is valid
  if (!Array.isArray(leaves)) {
    console.error('❌ Leaves is not an array:', leaves);
    return (
      <Box>
        <Typography>Error: Invalid leaves data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AccessTimeIcon color='primary' sx={{ fontSize: 32, mr: 1 }} />
        <Typography variant='h5' fontWeight={600}>
          {title}
        </Typography>
      </Box>

      {leaves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Leave History Found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {title === "My Leaves" ? 
              "You haven't applied for any leaves yet." : 
              "No leave requests found."
            }
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 0, }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {(isAdmin || showNames) && <TableCell>Name</TableCell>}
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reason</TableCell>
                {isAdmin && <TableCell>Actions</TableCell>}
                {!isAdmin && onWithdraw && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((leave, index) => {
                // Debug each leave item
                console.log(`Rendering leave ${index}:`, leave);

                // Validate leave data
                if (!leave || typeof leave !== 'object') {
                  console.error(`❌ Invalid leave at index ${index}:`, leave);
                  return null;
                }

                return (
                  <TableRow key={leave.id || index}>
                    {(isAdmin || showNames) && (
                      <TableCell>
                        {typeof leave.name === 'string'
                          ? leave.name
                          : typeof leave.name === 'object'
                            ? JSON.stringify(leave.name)
                            : 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={leave.type || 'Unknown'}
                        color={typeColor[leave.type] || 'default'}
                        sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 , width:'100%'}}
                      />
                    </TableCell>
                    <TableCell>{leave.fromDate || 'N/A'}</TableCell>
                    <TableCell>{leave.toDate || 'N/A'}</TableCell>
                    <TableCell>{leave.applied || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={statusConfig[leave.status]?.icon}
                        label={leave.status || 'Unknown'}
                        color={statusConfig[leave.status]?.color}
                        sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1,width:'100%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography>{leave.reason || 'N/A'}</Typography>
                      {leave.status === 'rejected' && leave.secondaryReason && (
                        <Typography
                          variant='body2'
                          color='error'
                          sx={{ mt: 0.5 }}
                        >
                          {leave.secondaryReason}
                        </Typography>
                      )}
                    </TableCell>
                    {isAdmin && leave.status === 'pending' && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label='Approve'
                            color='success'
                            clickable
                            onClick={() => onAction(leave.id, 'approved')}
                            sx={{ width:'100%' }}
                          />
                          <Chip
                            label='Reject'
                            color='error'
                            clickable
                            onClick={() => onAction(leave.id, 'rejected')}
                            sx={{ width:'100%' }}
                          />
                        </Box>
                      </TableCell>
                    )}
                    {isAdmin && leave.status !== 'pending' && <TableCell />}
                    {!isAdmin && onWithdraw && (
                      <TableCell>
                        {leave.status === 'pending' && (
                          <Chip
                            label='Withdraw'
                            color='warning'
                            clickable
                            onClick={() => onWithdraw(leave.id)}
                            sx={{ width:'100%' }}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LeaveHistory;
