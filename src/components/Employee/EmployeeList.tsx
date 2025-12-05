import React, { memo } from 'react';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

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
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
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
  onResendInvite?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  loading?: boolean;
  departments?: Record<string, string>;
  designations?: Record<string, string>;
}

interface OutletContext {
  darkMode: boolean;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onDelete,
  onEdit,
  onResendInvite,
  onView,
  loading,
  departments = {},
  designations = {},
}) => {
  const theme = useTheme();
  const { language } = useLanguage();
  const { darkMode } = useOutletContext<OutletContext>();

  const labels = {
    en: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      department: 'Department',
      designation: 'Designation',
      cnic: 'CNIC Number',
      status: 'Status',
      actions: 'Actions',
      viewDetails: 'View Details',
      resendInvite: 'Resend Invite',
      editEmployee: 'Edit Employee',
      deleteEmployee: 'Delete Employee',
      noRecord: 'No record exists',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      department: 'القسم',
      designation: 'الوظيفة',
      cnic: 'رقم الهوية',
      status: 'الحالة',
      actions: 'إجراءات',
      viewDetails: 'عرض التفاصيل',
      resendInvite: 'إعادة إرسال الدعوة',
      editEmployee: 'تعديل الموظف',
      deleteEmployee: 'حذف الموظف',
      noRecord: 'لا توجد سجلات',
    },
  } as const;

  const L = labels[language] || labels.en;

  // Dark mode styles
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const secondaryTextColor = darkMode
    ? '#9a9a9a'
    : theme.palette.text.secondary;

  // Handle resend invite
  const handleResendInvite = (employee: Employee) => {
    if (onResendInvite) {
      onResendInvite(employee);
    }
  };

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.name}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.email}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.phone}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.department}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.designation}
              </TableCell>
              <TableCell
                sx={{
                  color: textColor,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}
              >
                {L.cnic}
                {direction === 'rtl' ? 'رقم الهوية' : 'CNIC Number'}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: 'bold' }}>
                {L.status}
              </TableCell>
              {(onDelete || onEdit || onResendInvite || onView) && (
                <TableCell
                  sx={{ color: textColor, fontWeight: 'bold', width: '120px' }}
                >
                  {L.actions}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={
                    onDelete || onEdit || onResendInvite || onView ? 8 : 7
                  }
                  align='center'
                >
                  <Box display='flex' justifyContent='center' py={4}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    onDelete || onEdit || onResendInvite || onView ? 8 : 7
                  }
                  align='center'
                >
                  <Box display='flex' justifyContent='center' py={4}>
                    <Typography variant='body1' color='textSecondary'>
                      {L.noRecord}
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
                  <TableCell sx={{ color: textColor, whiteSpace: 'nowrap' }}>
                    {emp.cnic_number || '—'}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {emp.status || 'N/A'}
                  </TableCell>
                  {(onDelete || onEdit || onResendInvite || onView) && (
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        gap={1}
                      >
                        {onView && (
                          <Tooltip title={L.viewDetails} placement='bottom'>
                            <IconButton
                              onClick={() => onView(emp)}
                              disabled={loading}
                              sx={{
                                color: darkMode ? '#4caf50' : '#2e7d32',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(76,175,80,0.1)'
                                    : 'rgba(46,125,50,0.1)',
                                },
                              }
                            }
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onResendInvite && (
                          <Tooltip title={L.resendInvite} placement='bottom'>
                            <span>
                              <IconButton
                                sx={{
                                  color: darkMode ? '#1976d2' : '#0288d1',
                                  opacity:
                                    emp.status === 'Invite Expired' ? 1 : 0.5,
                                }}
                                onClick={() =>
                                  emp.status === 'Invite Expired' &&
                                  handleResendInvite(emp)
                                }
                                disabled={
                                  loading || emp.status !== 'Invite Expired'
                                }
                              >
                                <ReplayIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title={L.editEmployee} placement='bottom'>
                            <IconButton
                              onClick={() => onEdit(emp)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title={L.deleteEmployee} placement='bottom'>
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
    </Box>
  );
};

export default memo(EmployeeList);
