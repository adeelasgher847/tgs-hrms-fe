import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { useLanguage } from '../hooks/useLanguage';
import { useUser } from '../hooks/useUser';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { env } from '../config/env';
import { getRoleDisplayName, isManager, isEmployee } from '../utils/roleUtils';

import {
  AppBar,
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
} from '@mui/material';
import UserAvatar from './common/UserAvatar';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AddIcon from '@mui/icons-material/Add';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import TeamMembersAvatar from './Teams/TeamMembersAvatar';
import TeamMembersModal from './Teams/TeamMembersModal';
import { COLORS } from '../constants/appConstants';

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
  borderRadius: '6px',
  backgroundColor: '#efefef',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '300px',
    flexGrow: 0,
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000',
  marginRight: theme.spacing(1),
}));

const StyledInputBase = styled(InputBase)(() => ({
  fontSize: '16px',
  '& .MuiInputBase-input': {
    padding: 0,
    '::placeholder': {
      color: '#b3b3b3',
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position='static'
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          color: darkMode ? 'white' : 'black',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, md: 3 },
            gap: '10px',
            display: { xs: 'block', sm: 'flex' },
            justifyContent: { xs: 'center', sm: 'space-between' },
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: darkMode ? '#262727' : '#efefef',
                borderRadius: '6px',
                px: 1,
                height: '44px',
              }}
            >
              <Search
                sx={{
                  backgroundColor: 'transparent',
                  height: '100%',
                  paddingLeft: 0,
                }}
              >
                <SearchIconWrapper>
                  <SearchIcon sx={{}} />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder={lang.search}
                  inputProps={{ 'aria-label': 'search' }}
                  sx={{
                    transition: 'all 0.3s ease-in-out',
                    color: darkMode ? 'white' : 'black',
                    '& input': {
                      backgroundColor: 'transparent',
                      height: '43px',
                    },
                    '&:focus-within': {
                      height: '45px',
                    },
                  }}
                />
              </Search>

              <Box
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  borderRadius: '6px',
                  p: '6px',
                }}
              >
                <IconButton
                  onClick={handleOpenTeamMembersModal}
                  aria-label='Open team members modal'
                  size='small'
                  sx={{
                    p: '6px',
                  }}
                >
                  <AddIcon
                    sx={{
                      color: '#555',
                      fontSize: '26px',
                      width: '31px',
                      height: '31px',
                    }}
                    aria-hidden='true'
                  />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 3, md: 2 },
              }}
            >
              {/* <IconButton
                sx={{
                  backgroundColor: '#4b4f73',
                  color: 'white',
                  width: 28,
                  height: 28,
                }}
              >
                <InfoOutlinedIcon fontSize='small' />
              </IconButton> */}
              <Button
                variant='text'
                size='small'
                onClick={e => setLangAnchorEl(e.currentTarget)}
                sx={{
                  minWidth: 0,
                  px: 0,
                  color: textColor,
                  fontWeight: 600,
                }}
                aria-label={`Current language: ${language === 'en' ? 'English' : 'Arabic'}. Click to change language`}
                aria-haspopup='true'
                aria-expanded={langMenuOpen}
              >
                {language === 'en' ? 'EN' : 'عربي'}
              </Button>
              <TeamMembersAvatar
                maxAvatars={5}
                onOpenInviteModal={onOpenInviteModal}
                darkMode={darkMode}
              />

              <IconButton
                sx={{ xs: { padding: '8px' }, md: { padding: '0px' } }}
                aria-label='Notifications'
                aria-describedby='notifications-badge'
              >
                <Badge variant='dot' color='error' id='notifications-badge'>
                  <NotificationsNoneOutlinedIcon
                    sx={{ color: textColor }}
                    aria-hidden='true'
                  />
                </Badge>
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  variant='subtitle2'
                  sx={{ fontWeight: 600, fontSize: '14px' }}
                  color={textColor}
                >
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </Typography>
                <Typography variant='caption' color={textColor}>
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
              <IconButton
                onClick={handleMenuOpen}
                aria-label={`User menu for ${user ? `${user.first_name} ${user.last_name}` : 'user'}`}
                aria-haspopup='true'
                aria-expanded={open}
              >
                {user ? (
                  <UserAvatar user={user} size={50} clickable={false} />
                ) : (
                  <img
                    src='./avatar.png'
                    alt=''
                    aria-hidden='true'
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </IconButton>
              {/* Language Toggle */}
              {/* <ToggleButtonGroup
                value={language}
                exclusive
                onChange={(_, value) => value && setLanguage(value)}
                size='small'
              >
                <ToggleButton
                  value='en'
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: COLORS.PRIMARY,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                >
                  EN
                </ToggleButton>

                <ToggleButton
                  value='ar'
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: COLORS.PRIMARY,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                >
                  عربي
                </ToggleButton>
              </ToggleButtonGroup> */}
              <Menu
                anchorEl={langAnchorEl}
                open={langMenuOpen}
                onClose={() => setLangAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    borderRadius: '8px',
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
            </Box>
            <Box>
              <IconButton
                onClick={onToggleSidebar}
                sx={{ display: { xs: 'block', lg: 'none' } }}
                aria-label='Toggle sidebar menu'
                aria-expanded='false'
              >
                <MenuIcon sx={{ color: textColor }} aria-hidden='true' />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

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
