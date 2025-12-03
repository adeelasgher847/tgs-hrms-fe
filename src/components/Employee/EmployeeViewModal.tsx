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
import { useLanguage } from '../../hooks/useLanguage';

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
}

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  open,
  onClose,
  employee,
}) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<OutletContext>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  // State for images
  const [profileImage, setProfileImage] = useState<string>('');
  const [cnicFrontImage, setCnicFrontImage] = useState<string>('');
  const [cnicBackImage, setCnicBackImage] = useState<string>('');
  const [loadingImages, setLoadingImages] = useState(false);

  const labels = {
    en: {
      employeeDetails: 'Employee Details',
      personalInformation: 'Personal Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      cnicNumber: 'CNIC Number',
      workInformation: 'Work Information',
      department: 'Department',
      designation: 'Designation',
      role: 'Role',
      status: 'Status',
      cnicDocuments: 'CNIC Documents',
      noCnicFrontImage: 'No CNIC Front Image',
      cnicFront: 'CNIC Front',
      noCnicBackImage: 'No CNIC Back Image',
      cnicBack: 'CNIC Back',
      close: 'Close',
    },
    ar: {
      employeeDetails: 'تفاصيل الموظف',
      personalInformation: 'المعلومات الشخصية',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      cnicNumber: 'رقم الهوية',
      workInformation: 'معلومات العمل',
      department: 'القسم',
      designation: 'الوظيفة',
      role: 'الدور',
      status: 'الحالة',
      cnicDocuments: 'وثائق الهوية',
      noCnicFrontImage: 'لا توجد صورة أمامية للهوية',
      cnicFront: 'الهوية الأمامية',
      noCnicBackImage: 'لا توجد صورة خلفية للهوية',
      cnicBack: 'الهوية الخلفية',
      close: 'إغلاق',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  // Load images when modal opens
  useEffect(() => {
    if (open && employee) {
      setLoadingImages(true);

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const toAbsoluteUrl = (path?: string | null) => {
        if (!path) return '';
        const trimmed = path.trim();
        const isAbsolute = /^https?:\/\//i.test(trimmed);
        const base = API_BASE_URL.replace(/\/$/, '');
        const url = isAbsolute
          ? trimmed
          : `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
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
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: bgColor,
          color: textColor,
          // Use app language to control overall dialog direction so
          // static UI labels flip in Arabic while DB values remain LTR
          direction: language === 'ar' ? 'rtl' : 'ltr',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          // Force a row flex direction so DOM order follows DOM order
          // and use LTR inside the title so DOM order maps to visual
          // left/right even when the parent Paper is RTL.
          flexDirection: 'row',
          direction: 'ltr',
          alignItems: 'center',
          color: textColor,
          justifyContent: 'flex-start',
        }}
      >
        {/* Render icon/title in the explicit order so it visually matches language */}
        {language === 'ar' ? (
          <>
            <IconButton
              onClick={onClose}
              sx={{ color: darkMode ? '#ccc' : theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ flex: 1, textAlign: 'right' }}>{L.employeeDetails}</Box>
          </>
        ) : (
          <>
            <Box sx={{ flex: 1, textAlign: 'left' }}>{L.employeeDetails}</Box>
            <IconButton
              onClick={onClose}
              sx={{ color: darkMode ? '#ccc' : theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </>
        )}
      </DialogTitle>

      <DialogContent>
        <Box id='employee-print-content'>
          <Divider sx={{ mb: 3 }} />

          {/* Profile Picture */}
          {(employee.profile_picture || employee.user_id) && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {loadingImages ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 120,
                  }}
                >
                  <CircularProgress size={40} />
                </Box>
              ) : profileImage ? (
                <Avatar
                  src={profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '1px solid #000',
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    backgroundColor: darkMode ? '#555' : '#ccc',
                    border: '1px solid #000',
                  }}
                >
                  {employee.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>
          )}

          {/* Employee Information */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Card sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ color: textColor, mb: 2 }}>
                    {L.personalInformation}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.name}:
                      </Typography>
                      {/* DB-driven value: render as LTR so names/emails/ids remain readable */}
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.name}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.email}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.email}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.phone}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.phone}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.cnicNumber}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
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
                  <Typography variant='h6' sx={{ color: textColor, mb: 2 }}>
                    {L.workInformation}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.department}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.department?.name || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.designation}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.designation?.title || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.role}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
                        {employee.role_name || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {L.status}:
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{ color: textColor }}
                        dir='ltr'
                      >
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
              <Typography variant='h6' sx={{ color: textColor }}>
                {L.cnicDocuments}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                }}
              >
                {employee.cnic_picture && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {loadingImages ? (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 200,
                          }}
                        >
                          <CircularProgress size={40} />
                        </Box>
                      ) : cnicFrontImage ? (
                        <img
                          src={cnicFrontImage}
                          alt='CNIC Front'
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
                          <Typography variant='body2' sx={{ color: textColor }}>
                            {L.noCnicFrontImage}
                          </Typography>
                        </Box>
                      )}
                      <Typography
                        variant='body2'
                        sx={{ mt: 1, color: textColor }}
                      >
                        {L.cnicFront}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {employee.cnic_back_picture && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      {loadingImages ? (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 200,
                          }}
                        >
                          <CircularProgress size={40} />
                        </Box>
                      ) : cnicBackImage ? (
                        <img
                          src={cnicBackImage}
                          alt='CNIC Back'
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
                          <Typography variant='body2' sx={{ color: textColor }}>
                            {L.noCnicBackImage}
                          </Typography>
                        </Box>
                      )}
                      <Typography
                        variant='body2'
                        sx={{ mt: 1, color: textColor }}
                      >
                        {L.cnicBack}
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
        {/* Placing the action at the flex end gives the desired visual
            result: end is right in LTR (English) and left in RTL (Arabic). */}
        <Button
          onClick={onClose}
          variant='outlined'
          sx={{ color: textColor, borderColor }}
        >
          {L.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeViewModal;
