// // src/components/Users/UserList.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  MenuItem,
  TextField,
  useTheme,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import UserForm from './UserForm';
import AddIcon from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import type { User } from './UserForm';
import {
  departments,
  designations,
  users as mockUsers,
} from '../../Data/userMock';
import { useLanguage } from '../../hooks/useLanguage';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>(undefined);
  const [filters, setFilters] = useState({ department: '', designation: '' });
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const theme = useTheme();
  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'User Management UI',
      department: 'Department',
      designation: 'Designation',
      all: 'All',
      createUser: 'Create User',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
    },
    ar: {
      pageTitle: 'إدارة المستخدمين',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      all: 'الكل',
      createUser: 'إنشاء مستخدم',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      actions: 'الإجراءات',
      edit: 'تعديل',
      delete: 'حذف',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  const filteredUsers = users.filter(user => {
    return (
      (!filters.department || user.department === filters.department) &&
      (!filters.designation || user.designation === filters.designation)
    );
  });

  const handleOpen = (user?: User) => {
    setEditUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setEditUser(undefined);
    setOpen(false);
  };

  const handleSubmit = (userData: User) => {
    if (editUser?.id) {
      setUsers(prev =>
        prev.map(user =>
          user.id === editUser.id ? { ...user, ...userData } : user
        )
      );
    } else {
      setUsers(prev => [...prev, { ...userData, id: Date.now() }]);
    }
  };

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };
  return (
    <Box p={0}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ color: darkMode ? '#8f8f8f' : '#000' }}
      >
        {L.pageTitle}
      </Typography>

      <Box
        display='flex'
        flexWrap={'wrap'}
        gap={2}
        mb={2}
        alignItems='center'
        color={theme.palette.text.primary}
      >
        <TextField
          select
          size='small'
          label={L.department}
          value={filters.department}
          onChange={e =>
            setFilters({
              ...filters,
              department: e.target.value,
              designation: '',
            })
          }
          sx={{ width: 180 }}
        >
          <MenuItem value=''>{L.all}</MenuItem>
          {departments.map(dept => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size='small'
          label={L.designation}
          value={filters.designation}
          onChange={e =>
            setFilters({ ...filters, designation: e.target.value })
          }
          sx={{ width: 180 }}
          disabled={!filters.department}
        >
          <MenuItem value=''>{L.all}</MenuItem>
          {(designations[filters.department] || []).map(des => (
            <MenuItem key={des} value={des}>
              {des}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant='contained'
          onClick={() => handleOpen()}
          startIcon={<AddIcon />}
          sx={{
            minHeight: '36px',
            paddingX: 2,
            fontSize: '14px',
            borderRadius: '4px',
            backgroundColor: '#484c7f',
            color: '#fff',
            textTransform: 'none',
            marginLeft: { xs: '0', sm: 'auto' },
          }}
        >
          {L.createUser}
        </Button>
      </Box>
      <Box sx={{ overflowX: 'auto', bgcolor: theme.palette.background.paper }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{L.name}</TableCell>
              <TableCell>{L.email}</TableCell>
              <TableCell>{L.role}</TableCell>
              <TableCell>{L.department}</TableCell>
              <TableCell>{L.designation}</TableCell>
              <TableCell>{L.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.designation}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(user)} aria-label={L.edit}>
                    <Edit />
                  </Button>
                  <Button
                    color='error'
                    onClick={() => handleDelete(user.id!)}
                    aria-label={L.delete}
                  >
                    <Delete />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <UserForm
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        userData={editUser}
      />
    </Box>
  );
};

export default UserList;
