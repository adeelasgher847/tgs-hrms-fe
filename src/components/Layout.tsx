import {
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
  CircularProgress,
} from '@mui/material';
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import Sidebar from './Sidebar';
import Navbar from './Nabvar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => {
    if (!isLargeScreen) setSidebarOpen(false);
  }, [isLargeScreen]);

  // Handle outside clicks
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, isLargeScreen, closeSidebar]);

  // Role-based route guard
  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    if (!user) return;

    const subPath = location.pathname
      .replace('/dashboard', '')
      .replace(/^\/+/, '');

    if (subPath === 'UserProfile') return;

    const allowed = isDashboardPathAllowedForRole(subPath, role);

    if (!allowed) {
      const target = getDefaultDashboardRoute(role);
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, role, navigate, user]);

  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const subPath = isDashboardRoute
    ? location.pathname.replace('/dashboard', '').replace(/^\/+/, '')
    : '';
  const isAllowed = !isDashboardRoute
    ? true
    : user && !loading
      ? isDashboardPathAllowedForRole(subPath, role)
      : false;

  // Memoized Sidebar & Navbar (render once)
  const MemoizedSidebar = useMemo(
    () =>
      sidebarOpen && (
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
            height: { xs: '100vh', lg: 'calc(100vh - 50px)' },
            width: '270px',
            position: { xs: 'absolute', lg: 'fixed' },
            top: 0,
            left: rtlMode ? 'auto' : 0,
            right: rtlMode ? 0 : 'auto',
            m: { xs: 0, lg: 3 },
            mr: 0,
            borderRadius: { xs: 0, lg: '17.6px' },
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
      ),
    [sidebarOpen, rtlMode, darkMode, closeSidebar, setMode]
  );

  const MemoizedNavbar = useMemo(
    () => (
      <Box
        sx={{
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
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
    ),
    [darkMode, inviteModalOpen, toggleSidebar]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
      }}
    >
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

      {/* Sidebar (rendered once, static) */}
      {MemoizedSidebar}

      {/* Main Area */}
      <Box
        className='main-area content'
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          height: '100%',
          transition: 'margin 0.3s ease',
          marginLeft: isLargeScreen && sidebarOpen && !rtlMode ? '290px' : 0,
          marginRight: isLargeScreen && sidebarOpen && rtlMode ? '274px' : 0,
          width: '100%',
          direction: rtlMode ? 'rtl' : 'ltr',
        }}
      >
        {/* Navbar (static) */}
        {MemoizedNavbar}

        {/* Scrollable Outlet */}
        <Box
          component='main'
          sx={{ flex: 1, px: { xs: '7px', md: '24px' }, py: 3 }}
        >
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

export default React.memo(Layout);
