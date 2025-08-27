import React from 'react';
import {
  Box,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  TableContainer,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useOutletContext } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
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

  // Dark mode styles
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const secondaryTextColor = darkMode
    ? '#9a9a9a'
    : theme.palette.text.secondary;

  console.log('Employees data:', employees);
  console.log('First employee department:', employees[0]?.department);
  console.log('First employee designation:', employees[0]?.designation);
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
                <TableCell colSpan={onDelete || onEdit ? 6 : 5} align='center'>
                  <Box display='flex' justifyContent='center' py={4}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && employees.map(emp => (
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
                {(onDelete || onEdit) && (
                  <TableCell>
                    {onEdit && (
                      <Tooltip
                        title={
                          direction === 'rtl' ? 'تعديل الموظف' : 'Edit Employee'
                        }
                      >
                        <IconButton
                          onClick={() => onEdit(emp)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip
                        title={
                          direction === 'rtl' ? 'حذف الموظف' : 'Delete Employee'
                        }
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

export default EmployeeList;
