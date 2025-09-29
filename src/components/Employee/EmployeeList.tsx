import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  TableContainer,
  Typography,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import { useOutletContext } from 'react-router-dom';
import { refreshInviteStatus } from '../../api/refreshInviteStatus';
import Snackbar from '@mui/material/Snackbar';

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  status?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeListProps {
  employees: Employee[];
  onDelete?: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  loading?: boolean;
  departments?: Record<string, string>;
  designations?: Record<string, string>;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onDelete,
  onEdit,
  loading,
  departments = {},
  designations = {},
}) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<OutletContext>();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const [inviteLoading, setInviteLoading] = React.useState<string | null>(null);
  const [resentIds, setResentIds] = React.useState<string[]>([]);

  const isInviteExpired = (status?: string) =>
    (status || '').toLowerCase() === 'invite expired';

  const handleResendInvite = async (emp: Employee) => {
    console.log('Resend Invite Clicked:', emp);
    if (!isInviteExpired(emp.status)) return;
    setInviteLoading(emp.id);
    try {
      const msg = await refreshInviteStatus(emp.id);
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
      setResentIds(prev => [...prev, emp.id]); // Mark as resent
      console.log('Invite resent for:', emp.id);
    } catch (error) {
      setSnackbarMsg('Failed to resend invite');
      setSnackbarOpen(true);
      console.error('Resend Invite Error:', error);
    } finally {
      setInviteLoading(null);
    }
  };

  // Dark mode styles
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const secondaryTextColor = darkMode
    ? '#9a9a9a'
    : theme.palette.text.secondary;

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'الاسم' : 'Name'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'البريد الإلكتروني' : 'Email'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'رقم الهاتف' : 'Phone'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'القسم' : 'Department'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'الوظيفة' : 'Designation'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {direction === 'rtl' ? 'الحالة' : 'Status'}
              </TableCell>
              {(onDelete || onEdit) && (
                <TableCell
                  sx={{ color: textColor, fontWeight: 'bold', width: '120px' }}
                >
                  {direction === 'rtl' ? 'إجراءات' : 'Actions'}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={onDelete || onEdit ? 7 : 6} align='center'>
                  <Box display='flex' justifyContent='center' py={4}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={onDelete || onEdit ? 7 : 6} align='center'>
                  <Box display='flex' justifyContent='center' py={4}>
                    <Typography variant='body1' color='textSecondary'>
                      {direction === 'rtl'
                        ? 'لا توجد سجلات'
                        : 'No record exists'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              employees.length > 0 &&
              employees.map(emp => (
                <TableRow
                  key={emp.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: darkMode
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <TableCell sx={{ color: textColor }}>{emp.name}</TableCell>
                  <TableCell sx={{ color: secondaryTextColor }}>
                    {emp.email}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>{emp.phone}</TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {emp.department?.name ||
                      departments[emp.departmentId] ||
                      emp.departmentId ||
                      '—'}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {emp.designation?.title ||
                      designations[emp.designationId] ||
                      emp.designationId ||
                      '—'}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {emp.status || 'N/A'}
                  </TableCell>
                  {(onDelete || onEdit) && (
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        gap={1}
                      >
                        <Tooltip
                          title={
                            direction === 'rtl'
                              ? 'إعادة إرسال الدعوة'
                              : 'Resend Invite'
                          }
                          placement='bottom'
                        >
                          <span>
                            <IconButton
                              sx={{
                                color: darkMode ? '#1976d2' : '#0288d1',
                                opacity:
                                  isInviteExpired(emp.status) &&
                                  !resentIds.includes(emp.id)
                                    ? 1
                                    : 0.5,
                              }}
                              onClick={() => handleResendInvite(emp)}
                              disabled={
                                loading ||
                                inviteLoading === emp.id ||
                                !isInviteExpired(emp.status) ||
                                resentIds.includes(emp.id)
                              }
                            >
                              {inviteLoading === emp.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <ReplayIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        {onEdit && (
                          <Tooltip
                            title={
                              direction === 'rtl'
                                ? 'تعديل الموظف'
                                : 'Edit Employee'
                            }
                            placement='bottom'
                          >
                            <IconButton
                              onClick={() => onEdit(emp)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip
                            title={
                              direction === 'rtl'
                                ? 'حذف الموظف'
                                : 'Delete Employee'
                            }
                            placement='bottom'
                          >
                            <IconButton
                              onClick={() => onDelete(emp.id)}
                              disabled={loading}
                              sx={{
                                color: darkMode ? '#ff6b6b' : '#d32f2f',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255,107,107,0.1)'
                                    : 'rgba(211,47,47,0.1)',
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Box>
  );
};

export default EmployeeList;
