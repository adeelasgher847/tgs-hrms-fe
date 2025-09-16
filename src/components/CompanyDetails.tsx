import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
} from '@mui/material';

const CompanyDetails: React.FC = () => {
  const [lang] = React.useState<'en' | 'ar'>('en');
  const [employeeCount, setEmployeeCount] = React.useState<number>(1);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
                      Company Details
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: 'common.white' }}>
                      Tell us more about your company
                    </Typography>
                  </Box>

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
                        placeholder={lang === 'ar' ? 'أدخل اسم الشركة' : 'Enter company name'}
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

                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <Typography component='label' htmlFor='companyType' sx={{ fontWeight: 400, fontSize: '14px' }}>
                        {lang === 'ar' ? 'نوع الشركة' : 'Company Type'}
                      </Typography>
                      <TextField
                        id='companyType'
                        name='companyType'
                        fullWidth
                        placeholder={lang === 'ar' ? 'أدخل نوع الشركة' : 'Enter company type'}
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
                    <Button variant='outlined' type='button' sx={{ borderColor: 'white', color: 'white' }}>
                      Back
                    </Button>
                    <Button variant='contained' type='submit' sx={{ backgroundColor: 'white', color: 'black' }}>
                      Next
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default CompanyDetails; 