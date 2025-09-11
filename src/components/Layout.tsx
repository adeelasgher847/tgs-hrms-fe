import { Box, useMediaQuery, useTheme as useMuiTheme, CircularProgress } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Nabvar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import '../layout.css';
import EmployeeInviteModal from './Modal/EmployeeInviteModal';

import { useUser } from '../hooks/useUser';
import { useTheme } from '../theme/hooks';
import {
  getDefaultDashboardRoute,
  isDashboardPathAllowedForRole,
} from '../utils/permissions';
const Layout = () => {
  const muiTheme = useMuiTheme();
  const { mode: themeMode, setMode } = useTheme();
  const isLargeScreen = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rtlMode, setRtlMode] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const darkMode = themeMode === 'dark';

  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const role =
    typeof user?.role === 'string'
      ? user?.role
      : (user as { role?: { name?: string } })?.role?.name;

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    if (!isLargeScreen) {
      setSidebarOpen(false);
    }
  };

  // Handle clicks outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen &&
        !isLargeScreen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };

    if (sidebarOpen && !isLargeScreen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, isLargeScreen]);

  // Role-based guard and default redirects for /dashboard/*
  useEffect(() => {
    // Only guard dashboard routes
    if (!location.pathname.startsWith('/dashboard')) return;

    // Wait for user loading to finish to avoid premature redirects on refresh
    if (loading) return;

    // Check if user is actually authenticated
    const token = localStorage.getItem('accessToken');
    if (!token || !user) {
      // User is not authenticated, redirect to login
      navigate('/', { replace: true });
      return;
    }

    // Extract subpath after /dashboard
    const subPath = location.pathname
      .replace('/dashboard', '')
      .replace(/^\/+/, '');
    const allowed = isDashboardPathAllowedForRole(subPath, role);

    if (!allowed) {
      const target = getDefaultDashboardRoute(role);
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, role, navigate, user, loading]);

  // Determine access for current dashboard route to avoid UI flash
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const subPath = isDashboardRoute
    ? location.pathname.replace('/dashboard', '').replace(/^\/+/, '')
    : '';
  const isAllowed = !isDashboardRoute
    ? true
    : user && !loading
      ? isDashboardPathAllowedForRole(subPath, role)
      : false;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
        // flexDirection: rtlMode ? "row-reverse" : "row",
      }}
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && !isLargeScreen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          ref={sidebarRef}
          className='sidebar'
          sx={{
            backgroundColor: 'var(--dark-color)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            direction: rtlMode ? 'rtl' : 'ltr',
            height: {
              xs: '100vh',
              lg: 'calc(100vh - 50px)',
            },

            position: {
              xs: 'absolute',
              lg: 'fixed',
            },
            // left: 0,
            top: 0,
            left: rtlMode ? 'auto' : 0,
            right: rtlMode ? 0 : 'auto',
            m: {
              xs: 0,
              lg: 3,
            },
            mr: 0,
            borderRadius: {
              xs: 0,
              lg: '17.6px',
            },
            zIndex: 1000,
          }}
        >
          <Sidebar
            rtlMode={rtlMode}
            setRtlMode={setRtlMode}
            darkMode={darkMode}
            setDarkMode={(value: React.SetStateAction<boolean>) => {
              const newValue =
                typeof value === 'function' ? value(darkMode) : value;
              setMode(newValue ? 'dark' : 'light');
            }}
            onMenuItemClick={closeSidebar}
          />
        </Box>
      )}
      {/* Right Section */}
      <Box
        className='main-area content'
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          height: '100%',
          // marginLeft: {
          //   xs: 0,
          //   lg: sidebarOpen ? "274px" : "0px",
          // },
          transition: 'margin 0.3s ease',
          marginLeft: isLargeScreen && sidebarOpen && !rtlMode ? '274px' : 0,
          marginRight: isLargeScreen && sidebarOpen && rtlMode ? '274px' : 0,
          // bgcolor: "#fff", // 🔁 Here
          width: '100%',
          direction: rtlMode ? 'rtl' : 'ltr',
        }}
      >
        {/* Navbar */}
        <Box
          sx={{
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            // padding: "0 20px",
            flexShrink: 0,
            mt: 3,
            mb: 3,
          }}
        >
          <Navbar
            onOpenInviteModal={() => setInviteModalOpen(true)}
            onToggleSidebar={toggleSidebar}
            darkMode={darkMode}
          />
          <EmployeeInviteModal
            open={inviteModalOpen}
            darkMode={darkMode}
            onClose={() => setInviteModalOpen(false)}
          />
        </Box>

        {/* Scrollable Content */}
        <Box component='main' sx={{ flex: 1, px: { xs: '7px', md: '24px' }, py: 3 }}>
          {isDashboardRoute && (loading || !user || !isAllowed) ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Outlet context={{ darkMode }} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
