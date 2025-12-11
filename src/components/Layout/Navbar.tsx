import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { useLanguage } from '../../hooks/useLanguage';
import { useUser } from '../../hooks/useUser';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleDisplayName,
  isManager,
  isEmployee,
} from '../../utils/roleUtils';

import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button,
  Paper,
} from '@mui/material';
import UserAvatar from '../Common/UserAvatar';
import MenuIcon from '@mui/icons-material/Menu';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import { Icons } from '../../assets/icons';
import TeamMembersAvatar from '../Teams/TeamMembersAvatar';
import TeamMembersModal from '../Teams/TeamMembersModal';

const labels = {
  en: {
    search: 'Search',
    members: 'Members',
    settings: 'Settings',
    signout: 'Sign Out',
    adminProfile: 'Admin Profile',
    dylan: 'Dylan Hunter',
    email: 'Dylan.hunter@gmail.com',
  },
  ar: {
    search: 'بحث',
    members: 'الأعضاء',
    settings: 'الإعدادات',
    signout: 'تسجيل الخروج',
    adminProfile: 'ملف المشرف',
    dylan: 'ديلان هنتر',
    email: 'Dylan.hunter@gmail.com',
  },
};

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: 'var(--primary-color)',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '400px',
    flexGrow: 0,
  },
}));

const StyledInputBase = styled(InputBase)(() => ({
  fontSize: 'var(--body-font-size)',
  flex: 1,
  '& .MuiInputBase-input': {
    padding: 0,
    '::placeholder': {
      color: 'var(--dark-grey-color)',
      opacity: 1,
    },
  },
}));

interface NavbarProps {
  darkMode: boolean;
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleSidebar,
  onOpenInviteModal,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = React.useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const lang = labels[language];
  const { user, clearUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();

  // Initialize profile picture state when user data loads
  React.useEffect(() => {
    if (user?.profile_pic) {
      const profilePicUrl = user.profile_pic.startsWith('http')
        ? user.profile_pic
        : `${env.apiBaseUrl}/users/${user.id}/profile-picture`;
      updateProfilePicture(profilePicUrl);
    }
  }, [user?.profile_pic, user?.id, updateProfilePicture]);

  // Language dropdown state
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const langMenuOpen = Boolean(langAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear all authentication and signup data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('rememberedLogin');
    localStorage.removeItem('companyDetails');
    localStorage.removeItem('signupSessionId');

    // Clear user context
    clearUser();

    // Navigate to login page with replace to prevent back navigation
    navigate('/', { replace: true });
  };

  const handleOpenTeamMembersModal = () => {
    setTeamMembersModalOpen(true);
  };

  const handleCloseTeamMembersModal = () => {
    setTeamMembersModalOpen(false);
  };

  const textColor = darkMode ? '#8f8f8f' : '#000';
  // Language context available if needed

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: 'var(--white-100-color)',
        py: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'var(--white-color)',
          borderRadius: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          px: { xs: 2, md: 3 },
          py: 1.5,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            minHeight: 'auto',
          }}
        >
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '300px' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Search>
                <StyledInputBase
                  placeholder={lang.search}
                  inputProps={{ 'aria-label': 'search' }}
                  sx={{
                    color: 'var(--text-color)',
                    '& input': {
                      backgroundColor: 'transparent',
                    },
                  }}
                />
              </Search>
              <IconButton
                sx={{
                  backgroundColor: 'var(--primary-dark-color)',
                  color: 'var(--white-color)',
                  borderRadius: '16px',
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  '&:hover': {
                    backgroundColor: 'var(--primary-light-color)',
                  },
                }}
                aria-label='Search'
              >
                <Box
                  component='img'
                  src={Icons.search}
                  alt='Search'
                  sx={{
                    width: 20,
                    height: 20,
                    filter: 'brightness(0) saturate(100%) invert(1)',
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              variant='text'
              size='small'
              onClick={e => setLangAnchorEl(e.currentTarget)}
              sx={{
                minWidth: 0,
                px: 1.5,
                color: 'var(--text-color)',
                fontWeight: 600,
                fontSize: 'var(--body-font-size)',
              }}
              aria-label={`Current language: ${language === 'en' ? 'English' : 'Arabic'}. Click to change language`}
              aria-haspopup='true'
              aria-expanded={langMenuOpen}
            >
              {language === 'en' ? 'EN' : 'عربي'}
            </Button>

            {/* Team Members Avatar */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
              }}
            >
              <TeamMembersAvatar maxAvatars={5} darkMode={darkMode} />
            </Box>

            {/* Mobile Team Members Button */}
            <IconButton
              onClick={handleOpenTeamMembersModal}
              sx={{
                display: { xs: 'flex', md: 'none' },
                backgroundColor: 'var(--white-color)',
                borderRadius: 'var(--border-radius-lg)',
                p: 1,
              }}
              aria-label='Open team members modal'
            >
              <GroupOutlinedIcon sx={{ color: 'var(--text-color)' }} />
            </IconButton>

            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'var(--light-grey-200-color)',
                borderRadius: '16px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                sx={{
                  padding: '8px',
                }}
                aria-label='Notifications'
                aria-describedby='notifications-badge'
              >
                <Badge
                  variant='dot'
                  sx={{
                    '& .MuiBadge-dot': {
                      backgroundColor: 'var(--secondary-color)',
                      width: 8,
                      height: 8,
                    },
                  }}
                  id='notifications-badge'
                >
                  <Box
                    component='img'
                    src={Icons.notification}
                    alt='Notifications'
                    sx={{
                      width: 24,
                      height: 24,
                      filter: 'brightness(0) saturate(100%)',
                    }}
                    aria-hidden='true'
                  />
                </Badge>
              </IconButton>
            </Paper>

            <Divider
              orientation='vertical'
              flexItem
              sx={{
                height: '40px',
                alignSelf: 'center',
                borderColor: 'var(--light-grey-color)',
              }}
            />

            {/* User Profile */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'var(--white-color)',
                borderRadius: 'var(--border-radius-lg)',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0 }}
                aria-label={`User menu for ${user ? `${user.first_name} ${user.last_name}` : 'user'}`}
                aria-haspopup='true'
                aria-expanded={open}
              >
                {user ? (
                  <UserAvatar user={user} size={40} clickable={false} />
                ) : (
                  <img
                    src='./avatar.png'
                    alt=''
                    aria-hidden='true'
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 'var(--body-font-size)',
                    color: 'var(--black-color)',
                    lineHeight: 1.2,
                  }}
                >
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'var(--label-font-size)',
                    color: 'var(--dark-grey-500-color)',
                    lineHeight: 1.2,
                    fontWeight: 400,
                  }}
                >
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
            </Paper>

            {/* Mobile Menu Toggle */}
            <IconButton
              onClick={onToggleSidebar}
              sx={{
                display: { xs: 'block', lg: 'none' },
                color: 'var(--text-color)',
              }}
              aria-label='Toggle sidebar menu'
              aria-expanded='false'
            >
              <MenuIcon aria-hidden='true' />
            </IconButton>
          </Box>

          {/* Language Menu */}
          <Menu
            anchorEl={langAnchorEl}
            open={langMenuOpen}
            onClose={() => setLangAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 4,
              sx: {
                borderRadius: 'var(--border-radius-lg)',
                minWidth: 80,
                p: 0,
              },
            }}
          >
            {language === 'en' ? (
              <MenuItem
                onClick={() => {
                  setLanguage('ar');
                  setLangAnchorEl(null);
                }}
              >
                عربي
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => {
                  setLanguage('en');
                  setLangAnchorEl(null);
                }}
              >
                EN
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </Paper>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: '10px',
            width: 280,
            p: 2,
            backgroundColor: darkMode ? '#111' : '#fff',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {user && <UserAvatar user={user} size={40} clickable={false} />}
          <Box>
            <Typography fontWeight={600} color={textColor}>
              {user ? `${user.first_name} ${user.last_name}` : 'User'}
            </Typography>
            <Typography variant='body2' color={textColor}>
              {user?.email || ''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1 }} />

        {!isManager(user?.role) && !isEmployee(user?.role) && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/dashboard/EmployeeManager');
            }}
            aria-label='Navigate to employee manager'
          >
            <ListItemIcon>
              <GroupOutlinedIcon
                fontSize='small'
                sx={{ color: textColor }}
                aria-hidden='true'
              />
            </ListItemIcon>
            <Typography color={textColor}>{lang.members}</Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/UserProfile');
          }}
          aria-label='Navigate to user profile'
        >
          <ListItemIcon>
            <AdminPanelSettings
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>Profile</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/settings');
          }}
          aria-label='Navigate to settings'
        >
          <ListItemIcon>
            <SettingsIcon
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>{lang.settings}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} aria-label='Sign out'>
          <ListItemIcon>
            <LogoutIcon
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>{lang.signout}</Typography>
        </MenuItem>
        {/* <Divider sx={{ my: 1 }} /> */}
      </Menu>

      {/* Team Members Modal for Mobile */}
      <TeamMembersModal
        open={teamMembersModalOpen}
        onClose={handleCloseTeamMembersModal}
        onOpenInviteModal={onOpenInviteModal}
        darkMode={darkMode}
      />
    </Box>
  );
};

export default Navbar;
