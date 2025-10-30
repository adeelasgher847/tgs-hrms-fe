import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  useTheme,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOutletContext } from 'react-router-dom';

interface Employee {
  id: string;
  user_id?: string; // User ID for fetching profile pictures
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  role_name?: string;
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

interface EmployeeViewModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  open,
  onClose,
  employee,
}) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<OutletContext>();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  // State for images
  const [profileImage, setProfileImage] = useState<string>('');
  const [cnicFrontImage, setCnicFrontImage] = useState<string>('');
  const [cnicBackImage, setCnicBackImage] = useState<string>('');
  const [loadingImages, setLoadingImages] = useState(false);

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  // Load images when modal opens
  useEffect(() => {
    if (open && employee) {
      setLoadingImages(true);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const toAbsoluteUrl = (path?: string | null) => {
        if (!path) return '';
        const trimmed = path.trim();
        const isAbsolute = /^https?:\/\//i.test(trimmed);
        const base = API_BASE_URL.replace(/\/$/, '');
        const url = isAbsolute ? trimmed : `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
        return `${url}?t=${Date.now()}`;
      };

      try {
        const profileUrl = toAbsoluteUrl(employee.profile_picture);
        const cnicFrontUrl = toAbsoluteUrl(employee.cnic_picture);
        const cnicBackUrl = toAbsoluteUrl(employee.cnic_back_picture);

        setProfileImage(profileUrl);
        setCnicFrontImage(cnicFrontUrl);
        setCnicBackImage(cnicBackUrl);
      } catch (error) {
        console.error('Error resolving image URLs:', error);
      } finally {
        setLoadingImages(false);
      }
    } else {
      // Reset images when modal closes
      setProfileImage('');
      setCnicFrontImage('');
      setCnicBackImage('');
      setLoadingImages(false);
    }
  }, [open, employee]);

  // Print functionality removed per request

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: bgColor,
          color: textColor,
          direction: direction === 'rtl' ? 'rtl' : 'ltr',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: textColor,
        }}
      >
        {getLabel('Employee Details', 'تفاصيل الموظف')}
        <IconButton
          onClick={onClose}
          sx={{ color: darkMode ? '#ccc' : theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box id="employee-print-content">
          <Divider sx={{ mb: 3 }} />

          {/* Profile Picture */}
          {(employee.profile_picture || employee.user_id) && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {loadingImages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : profileImage ? (
                <Avatar
                  src={profileImage}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '1px solid #000' }}
                />
              ) : (
                <Avatar
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2, backgroundColor: darkMode ? '#555' : '#ccc', border: '1px solid #000' }}
                >
                  {employee.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>
          )}

          {/* Employee Information */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: textColor, mb: 2 }}>
                    {getLabel('Personal Information', 'المعلومات الشخصية')}
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Name', 'الاسم')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.name}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Email', 'البريد الإلكتروني')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.email}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Phone', 'رقم الهاتف')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.phone}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('CNIC Number', 'رقم الهوية')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.cnic_number || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Card sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: textColor, mb: 2 }}>
                    {getLabel('Work Information', 'معلومات العمل')}
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Department', 'القسم')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.department?.name || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Designation', 'الوظيفة')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.designation?.title || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Role', 'الدور')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.role_name || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
                        {getLabel('Status', 'الحالة')}:
                      </Typography>
                      <Typography variant="body1" sx={{ color: textColor }}>
                        {employee.status || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* CNIC Images */}
          {(employee.cnic_picture || employee.cnic_back_picture) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ color: textColor}}>
                {getLabel('CNIC Documents', 'وثائق الهوية')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                {employee.cnic_picture && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {loadingImages ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                          <CircularProgress size={40} />
                        </Box>
                      ) : cnicFrontImage ? (
                        <img
                          src={cnicFrontImage}
                          alt="CNIC Front"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            border: `1px solid ${borderColor}`,
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '200px',
                            border: `2px dashed ${borderColor}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: textColor }}>
                            {getLabel('No CNIC Front Image', 'لا توجد صورة أمامية للهوية')}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mt: 1, color: textColor }}>
                        {getLabel('CNIC Front', 'الهوية الأمامية')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {employee.cnic_back_picture && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {loadingImages ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                          <CircularProgress size={40} />
                        </Box>
                      ) : cnicBackImage ? (
                        <img
                          src={cnicBackImage}
                          alt="CNIC Back"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            border: `1px solid ${borderColor}`,
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '200px',
                            border: `2px dashed ${borderColor}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: textColor }}>
                            {getLabel('No CNIC Back Image', 'لا توجد صورة خلفية للهوية')}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mt: 1, color: textColor }}>
                        {getLabel('CNIC Back', 'الهوية الخلفية')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: textColor, borderColor }}
        >
          {getLabel('Close', 'إغلاق')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeViewModal;
