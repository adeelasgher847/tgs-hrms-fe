import { Icons } from '../../assets/icons';
import { Box, Typography } from '@mui/material';

const AuthSidebar: React.FC = () => {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        width: '40%',
        backgroundColor: 'var(--primary-dark-color)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '720px',
          pl: '86px',
          pr: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {/* Logo */}
        <Box>
          <Box
            component='img'
            src={Icons.logoWhite}
            alt='Logo'
            sx={{
              maxHeight: 40,
              width: 'auto',
            }}
          />
        </Box>

        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <Typography
              variant='h1'
              sx={{
                fontSize: '48px',
                fontWeight: 500,
                color: 'var(--white-color)',
                lineHeight: 1.2,
              }}
            >
              Workonnect - Let's Management Better
            </Typography>

            <Box
              component='img'
              src={Icons.authSidebar}
              alt='Illustration'
              sx={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthSidebar;
