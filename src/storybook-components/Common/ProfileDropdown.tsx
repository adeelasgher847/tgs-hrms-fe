import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import {
  GroupOutlined as GroupOutlinedIcon,
  AdminPanelSettings,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTheme } from '../theme';

// Mock user data
const mockUser = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  profile_pic: null,
};

// Mock language translations
const mockLang = {
  members: 'Members',
  settings: 'Settings',
  signout: 'Sign Out',
};

const ProfileDropdown: React.FC = () => {
  const { theme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action: string) => {
    handleMenuClose();
  };

  const handleLogout = () => {
    handleMenuClose();
  };

  const getInitials = (first: string, last: string) =>
    `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

  const generateAvatarColor = (name: string) => {
    const colors = [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#cddc39',
      '#ffeb3b',
      '#ffc107',
      '#ff9800',
      '#ff5722',
      '#795548',
      '#9e9e9e',
      '#607d8b',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      manager: 'Manager',
      employee: 'Employee',
      hr: 'HR Manager',
    };
    return roleMap[role] || role;
  };

  return (
    <Box>
      {/* Profile Icon Button */}
      <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
        <Avatar
          sx={{
            width: 50,
            height: 50,
            backgroundColor: generateAvatarColor(mockUser.first_name),
            fontSize: '20px',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
              transform: 'scale(1.05)',
              transition: 'all 0.2s ease-in-out',
            },
          }}
        >
          {getInitials(mockUser.first_name, mockUser.last_name)}
        </Avatar>
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 'var(--radius-lg)',
            width: 280,
            p: 2,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
          },
        }}
      >
        {/* User Info Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: generateAvatarColor(mockUser.first_name),
              fontSize: '16px',
            }}
          >
            {getInitials(mockUser.first_name, mockUser.last_name)}
          </Avatar>
          <Box>
            <Typography 
              fontWeight={600} 
              color='var(--text-primary)'
              fontFamily='var(--font-family-primary)'
              fontSize='var(--font-size-base)'
            >
              {`${mockUser.first_name} ${mockUser.last_name}`}
            </Typography>
            <Typography 
              variant='body2' 
              color='var(--text-secondary)'
              fontFamily='var(--font-family-primary)'
              fontSize='var(--font-size-sm)'
            >
              {mockUser.email}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 1, borderColor: 'var(--border-primary)' }} />

        {/* Menu Items */}
        <MenuItem
          onClick={() => handleMenuItemClick('Members')}
          sx={{
            borderRadius: 'var(--radius-sm)',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'var(--bg-hover)',
            },
          }}
        >
          <ListItemIcon>
            <GroupOutlinedIcon 
              fontSize='small' 
              sx={{ color: 'var(--text-primary)' }} 
            />
          </ListItemIcon>
          <Typography 
            color='var(--text-primary)'
            fontFamily='var(--font-family-primary)'
            fontSize='var(--font-size-base)'
          >
            {mockLang.members}
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuItemClick('Profile')}
          sx={{
            borderRadius: 'var(--radius-sm)',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'var(--bg-hover)',
            },
          }}
        >
          <ListItemIcon>
            <AdminPanelSettings 
              fontSize='small' 
              sx={{ color: 'var(--text-primary)' }} 
            />
          </ListItemIcon>
          <Typography 
            color='var(--text-primary)'
            fontFamily='var(--font-family-primary)'
            fontSize='var(--font-size-base)'
          >
            Profile
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuItemClick('Settings')}
          sx={{
            borderRadius: 'var(--radius-sm)',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'var(--bg-hover)',
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon 
              fontSize='small' 
              sx={{ color: 'var(--text-primary)' }} 
            />
          </ListItemIcon>
          <Typography 
            color='var(--text-primary)'
            fontFamily='var(--font-family-primary)'
            fontSize='var(--font-size-base)'
          >
            {mockLang.settings}
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={handleLogout}
          sx={{
            borderRadius: 'var(--radius-sm)',
            '&:hover': {
              backgroundColor: 'var(--bg-hover)',
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon 
              fontSize='small' 
              sx={{ color: 'var(--text-primary)' }} 
            />
          </ListItemIcon>
          <Typography 
            color='var(--text-primary)'
            fontFamily='var(--font-family-primary)'
            fontSize='var(--font-size-base)'
          >
            {mockLang.signout}
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProfileDropdown;
