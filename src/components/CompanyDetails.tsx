
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';
import signupApi, { type CompanyDetailsRequest } from '../api/signupApi';

const CompanyDetails: React.FC = () => {
  const navigate = useNavigate();
  const [lang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    domain: '',
  });
  
  const [fieldErrors, setFieldErrors] = useState({
    companyName: '',
    companyType: '',
    domain: '',
  });

  // Check if user has signupSessionId, redirect if not
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    if (!signupSessionId) {
      navigate('/Signup');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    const nextErrors = {
      companyName: '',
      companyType: '',
      domain: '',
    };

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Company name is required';
    }
   
    if (!formData.domain.trim()) {
      nextErrors.domain = 'Domain is required';
    } 
   

    setFieldErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    return !hasErrors;
  };

  const isSubmitDisabled =
    loading ||
    !formData.companyName.trim() ||
    !formData.domain.trim() ||
    Object.values(fieldErrors).some(Boolean);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const signupSessionId = localStorage.getItem('signupSessionId');
      if (!signupSessionId) {
        throw new Error('Signup session not found. Please start over.');
      }

      const companyDetails: CompanyDetailsRequest = {
        signupSessionId,
        companyName: formData.companyName.trim(),
        domain: formData.domain.trim(),
        planId: '', // Will be set when user selects a plan
      };

      console.log('Sending company details:', companyDetails);
      
      // Store company details in localStorage for plan selection
      localStorage.setItem('companyDetails', JSON.stringify({
        companyName: formData.companyName.trim(),
        companyType: formData.companyType.trim(),
        domain: formData.domain.trim(),
      }));
      
      setSuccess('Company details saved successfully!');
      setSnackbar({
        open: true,
        message: lang === 'ar' ? 'تم حفظ تفاصيل الشركة بنجاح!' : 'Company details saved successfully!',
        severity: 'success',
      });
      
      // Redirect to plan selection after a short delay
      setTimeout(() => {
        navigate('/signup/select-plan');
      }, 2000);

    } catch (err: any) {
      console.error('Company details error:', err);
      
      if (err.response?.data?.message) {
        const errorData = err.response.data.message;
        if (typeof errorData === 'object' && errorData.field && errorData.message) {
          const field = String(errorData.field) as keyof typeof fieldErrors;
          setFieldErrors(prev => ({ ...prev, [field]: String(errorData.message) }));
          setError(null);
        } else {
          setError(errorData);
        }
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(', '));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to save company details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/Signup');
  };

  return (
    <div className='loginpage'>
      <Box
        className='login-scroll'
        sx={{
          height: '100vh',
          m: { xs: '14px', sm: 0 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            direction: lang === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              margin: 'auto',
            }}
          >
            {/* Form only */}
            <Box sx={{ width: '100%', maxWidth: '512px' }}>
              <Paper
                elevation={4}
                sx={{
                  backgroundColor: 'var(--dark-color)',
                  color: 'common.white',
                  p: { xs: 3, md: 5 },
                  borderRadius: { xs: 2, lg: 0 },
                }}
              >
                <Box component='form' onSubmit={handleSubmit} noValidate>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant='h4'
                      sx={{
                        color: 'common.white',
                        fontWeight: 500,
                        fontSize: '28px',
                        mb: 1,
                        fontFamily: 'Open Sans, sans-serif',
                      }}
                    >
                      {lang === 'ar' ? 'تفاصيل الشركة' : 'Company Details'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: 'common.white' }}>
                      {lang === 'ar' ? 'أخبرنا المزيد عن شركتك' : 'Tell us more about your company'}
                    </Typography>
                  </Box>

                  {/* Error Message */}
                  {error && (
                    <Alert severity='error' sx={{ mt: 2, mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <Typography component='label' htmlFor='companyName' sx={{ fontWeight: 400, fontSize: '14px' }}>
                        {lang === 'ar' ? 'اسم الشركة' : 'Company Name'}
                      </Typography>
                      <TextField
                        id='companyName'
                        name='companyName'
                        required
                        fullWidth
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder={lang === 'ar' ? 'أدخل اسم الشركة' : 'Enter company name'}
                        disabled={loading}
                        error={Boolean(fieldErrors.companyName)}
                        helperText={fieldErrors.companyName}
                        sx={{
                          mt: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme => theme.palette.background.paper,
                            },
                          },
                          '& input': { outline: 'none', boxShadow: 'none' },
                          '& input:-webkit-autofill': { height: '10px' },
                        }}
                      />
                    </Box>

                    {/* <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <Typography component='label' htmlFor='companyType' sx={{ fontWeight: 400, fontSize: '14px' }}>
                        {lang === 'ar' ? 'نوع الشركة' : 'Company Type'}
                      </Typography>
                      <FormControl fullWidth sx={{ mt: 1 }}>
                        <Select
                          id='companyType'
                          name='companyType'
                          value={formData.companyType}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
                          disabled={loading}
                          displayEmpty
                          sx={{
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme => theme.palette.background.paper,
                            },
                          }}
                        >
                          <MenuItem value='' disabled>
                            {lang === 'ar' ? 'اختر نوع الشركة' : 'Select company type'}
                          </MenuItem>
                          <MenuItem value='Technology'>Technology</MenuItem>
                          <MenuItem value='Healthcare'>Healthcare</MenuItem>
                          <MenuItem value='Finance'>Finance</MenuItem>
                          <MenuItem value='Education'>Education</MenuItem>
                          <MenuItem value='Manufacturing'>Manufacturing</MenuItem>
                          <MenuItem value='Retail'>Retail</MenuItem>
                          <MenuItem value='Other'>Other</MenuItem>
                        </Select>
                      </FormControl>
                      {fieldErrors.companyType && (
                        <Typography sx={{ color: 'error.main', fontSize: '12px', mt: 0.5 }}>
                          {fieldErrors.companyType}
                        </Typography>
                      )}
                    </Box> */}

                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <Typography component='label' htmlFor='domain' sx={{ fontWeight: 400, fontSize: '14px' }}>
                        {lang === 'ar' ? 'النطاق' : 'Domain'}
                      </Typography>
                      <TextField
                        id='domain'
                        name='domain'
                        required
                        fullWidth
                        value={formData.domain}
                        onChange={handleChange}
                        placeholder={lang === 'ar' ? 'أدخل النطاق (مثال: company.com)' : 'Enter domain (e.g., Development)'}
                        disabled={loading}
                        error={Boolean(fieldErrors.domain)}
                        helperText={fieldErrors.domain}
                        sx={{
                          mt: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme => theme.palette.background.paper,
                            },
                          },
                          '& input': { outline: 'none', boxShadow: 'none' },
                          '& input:-webkit-autofill': { height: '10px' },
                        }}
                      />
                    </Box>

                    {/* Employee Count */}
                    {/* <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <Typography component='label' htmlFor='employeeCount' sx={{ fontWeight: 400, fontSize: '14px' }}>
                        {lang === 'ar' ? 'عدد الموظفين' : 'Number of Employees'}
                      </Typography>
                      <TextField
                        id='employeeCount'
                        name='employeeCount'
                        type='number'
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(Math.max(0, Number(e.target.value) || 0))}
                        inputProps={{ min: 0 }}
                        fullWidth
                        sx={{
                          mt: 1,
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme => theme.palette.background.paper,
                            },
                          },
                          '& input': { outline: 'none', boxShadow: 'none' },
                          '& input:-webkit-autofill': { height: '10px' },
                        }}
                      />
                    </Box> */}

                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Button 
                      variant='outlined' 
                      type='button' 
                      onClick={handleBack}
                      disabled={loading}
                      sx={{ 
                        borderColor: 'white', 
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      {lang === 'ar' ? 'رجوع' : 'Back'}
                    </Button>
                    <Button 
                      variant='contained' 
                      type='submit' 
                      disabled={isSubmitDisabled}
                      sx={{ 
                        backgroundColor: 'white', 
                        color: 'black',
                        fontWeight: 500,
                        '&:hover': { backgroundColor: '#f0f0f0' },
                        '&:disabled': { backgroundColor: '#ccc' },
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                        </Box>
                      ) : (
                        lang === 'ar' ? 'التالي' : 'Next'
                      )}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CompanyDetails; 