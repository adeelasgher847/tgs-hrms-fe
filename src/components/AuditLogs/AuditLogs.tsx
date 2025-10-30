import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';

// 🔹 Mock Data (replace later with API data)
const mockLogs = [
  {
    timestamp: '2025-10-27 14:20:15',
    user: 'Admin',
    action: 'Created new user',
    entity: 'User Management',
    tenantId: 'Tenant-001',
  },
  {
    timestamp: '2025-10-27 13:05:22',
    user: 'John Doe',
    action: 'Updated department policy',
    entity: 'HR Policy',
    tenantId: 'Tenant-002',
  },
  {
    timestamp: '2025-10-26 09:42:10',
    user: 'Admin',
    action: 'Deleted record',
    entity: 'Payroll',
    tenantId: 'Tenant-003',
  },
  {
    timestamp: '2025-10-25 18:30:05',
    user: 'Sarah Ali',
    action: 'Modified leave rules',
    entity: 'Leave Management',
    tenantId: 'Tenant-002',
  },
];

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 🔹 Filter and sort logs
  const filteredLogs = useMemo(() => {
    const filtered = mockLogs.filter(
      log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tenantId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [searchTerm, sortOrder]);

  // 🔹 Export mock data to CSV
  const handleExport = () => {
    const csvHeader = 'Timestamp,User,Action,Entity,Tenant ID\n';
    const csvRows = filteredLogs
      .map(
        log =>
          `${log.timestamp},${log.user},${log.action},${log.entity},${log.tenantId}`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    saveAs(blob, 'audit_logs.csv');
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography
            variant='h5'
            sx={{ fontWeight: 600, color: '#3c3572', mb: 2 }}
          >
            Audit Logs
          </Typography>

          {/* 🔹 Search and Sort Controls */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', sm: 'center' }}
            mb={3}
          >
            <TextField
              label='Search logs'
              variant='outlined'
              size='small'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: '50%' } }}
            />

            <Box display='flex' alignItems='center' gap={2}>
              <Select
                size='small'
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value='desc'>Newest First</MenuItem>
                <MenuItem value='asc'>Oldest First</MenuItem>
              </Select>

              {/* 🔹 Updated Export Button with Leave Management Style */}
              <Button
                onClick={handleExport}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 'auto',
                  padding: 0,
                  borderRadius: 2,
                  backgroundColor: '#3c3572', // purple background
                  color: '#fff', // white icon
                  boxShadow: 1, // subtle shadow
                  '&:hover': {
                    backgroundColor: '#2f285b', // darker on hover
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DownloadIcon fontSize='small' />
              </Button>
            </Box>
          </Stack>

          {/* 🔹 Logs Table */}
          <TableContainer component={Paper}>
            <Table size='small'>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>
                    <b>Timestamp</b>
                  </TableCell>
                  <TableCell>
                    <b>User</b>
                  </TableCell>
                  <TableCell>
                    <b>Action</b>
                  </TableCell>
                  <TableCell>
                    <b>Entity</b>
                  </TableCell>
                  <TableCell>
                    <b>Tenant ID</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>{log.tenantId}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditLogs;
