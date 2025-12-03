import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../../hooks/useLanguage';

import { departments, designations } from '../../Data/userMock';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  designation: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: User) => void;
  userData?: User;
}

const roles = ['Admin', 'User'];

const UserForm: React.FC<Props> = ({ open, onClose, onSubmit, userData }) => {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    designation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [designationList, setDesignationList] = useState<string[]>([]);
  const { language } = useLanguage();

  const labels = {
    en: {
      createUser: 'Create User',
      editUser: 'Edit User',
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      role: 'Role',
      department: 'Department',
      designation: 'Designation',
      update: 'Update',
      create: 'Create',
      requiredFullName: 'Full Name is required',
      requiredEmail: 'Email is required',
      requiredPassword: 'Password is required',
      requiredRole: 'Role is required',
      requiredDepartment: 'Department is required',
      requiredDesignation: 'Designation is required',
    },
    ar: {
      createUser: 'إنشاء مستخدم',
      editUser: 'تعديل مستخدم',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      role: 'الدور',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      update: 'تحديث',
      create: 'إنشاء',
      requiredFullName: 'الاسم الكامل مطلوب',
      requiredEmail: 'البريد الإلكتروني مطلوب',
      requiredPassword: 'كلمة المرور مطلوبة',
      requiredRole: 'الدور مطلوب',
      requiredDepartment: 'القسم مطلوب',
      requiredDesignation: 'المسمى الوظيفي مطلوب',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  useEffect(() => {
    if (userData) {
      setFormData(userData);
      setDesignationList(designations[userData.department] || []);
    } else {
      resetForm();
    }
  }, [userData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'department' && { designation: '' }),
    }));

    if (name === 'department') {
      setDesignationList(designations[value] || []);
    }

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = L.requiredFullName;
    if (!formData.email) newErrors.email = L.requiredEmail;
    if (!userData && !formData.password)
      newErrors.password = L.requiredPassword;
    if (!formData.role) newErrors.role = L.requiredRole;
    if (!formData.department) newErrors.department = L.requiredDepartment;
    if (!formData.designation) newErrors.designation = L.requiredDesignation;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      department: '',
      designation: '',
    });
    setDesignationList([]);
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {userData ? L.editUser : L.createUser}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box display='flex' flexWrap='wrap' gap={2} mt={1}>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              label={L.fullName}
              name='name'
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              label={L.email}
              name='email'
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Box>
          {!userData && (
            <Box width={{ xs: '100%', sm: '48%' }}>
              <TextField
                label={L.password}
                name='password'
                type='password'
                fullWidth
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Box>
          )}
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label={L.role}
              name='role'
              fullWidth
              value={formData.role}
              onChange={handleChange}
              error={!!errors.role}
              helperText={errors.role}
            >
              {roles.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label={L.department}
              name='department'
              fullWidth
              value={formData.department}
              onChange={handleChange}
              error={!!errors.department}
              helperText={errors.department}
            >
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label={L.designation}
              name='designation'
              fullWidth
              value={formData.designation}
              onChange={handleChange}
              disabled={!formData.department}
              error={!!errors.designation}
              helperText={errors.designation}
            >
              {designationList.map(des => (
                <MenuItem key={des} value={des}>
                  {des}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <DialogActions sx={{ justifyContent: 'flex-start', px: 0, pb: 2 }}>
          <Button variant='contained' onClick={handleSubmit}>
            {userData ? L.update : L.create}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
