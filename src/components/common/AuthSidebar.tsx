import { Box, Typography } from '@mui/material';
import { Icons } from '../../assets/icons';

const AuthSidebar: React.FC = () => {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        width: '40%',
        backgroundColor: 'var(--primary-dark-color)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          component='img'
          src={Icons.logoWhite}
          alt='Logo'
          sx={{
            height: 'auto',
            width: 'auto',
            maxHeight: '40px',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          textAlign: 'center',
        }}
      >
        <Typography
          variant='h1'
          sx={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'var(--white-color)',
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
  );
};

export default AuthSidebar;
