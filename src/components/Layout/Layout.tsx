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
import Navbar from './Navbar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../../layout.css';
import EmployeeInviteModal from '../Employee/EmployeeInviteModal';
import RouteErrorBoundary from '../common/RouteErrorBoundary';

import { useUser } from '../../hooks/useUser';
import { useTheme } from '../../theme/hooks';
import {
  getDefaultDashboardRoute,
  isDashboardPathAllowedForRole,
} from '../../utils/permissions';

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

  // Memoize role extraction to avoid recalculation
  const role = useMemo(
    () =>
      typeof user?.role === 'string'
        ? user?.role
        : (user as { role?: { name?: string } })?.role?.name,
    [user]
  );

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => {
    if (!isLargeScreen) setSidebarOpen(false);
  }, [isLargeScreen]);

  // Memoize setDarkMode callback to prevent Sidebar re-renders
  const handleSetDarkMode = useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(darkMode) : value;
      setMode(newValue ? 'dark' : 'light');
    },
    [darkMode, setMode]
  );

  // Memoize invite modal handlers
  const handleOpenInviteModal = useCallback(() => setInviteModalOpen(true), []);
  const handleCloseInviteModal = useCallback(
    () => setInviteModalOpen(false),
    []
  );

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

  // Memoize computed route values to avoid recalculation
  const isDashboardRoute = useMemo(
    () => location.pathname.startsWith('/dashboard'),
    [location.pathname]
  );

  const subPath = useMemo(
    () =>
      isDashboardRoute
        ? location.pathname.replace('/dashboard', '').replace(/^\/+/, '')
        : '',
    [isDashboardRoute, location.pathname]
  );

  const isAllowed = useMemo(
    () =>
      !isDashboardRoute
        ? true
        : user && !loading
          ? isDashboardPathAllowedForRole(subPath, role)
          : false,
    [isDashboardRoute, user, loading, subPath, role]
  );

  // Memoize Outlet context to prevent unnecessary re-renders of child components
  const outletContext = useMemo(() => ({ darkMode }), [darkMode]);

  // Memoized Sidebar & Navbar (render once)
  const MemoizedSidebar = useMemo(
    () =>
      sidebarOpen && (
        <Box
          ref={sidebarRef}
          sx={{
            backgroundColor: 'var(--white-color)',
            color: 'var(--text-color)',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            direction: rtlMode ? 'rtl' : 'ltr',
            height: { xs: '100vh', lg: 'auto' },
            width: { xs: '240px', lg: '280px' },
            position: { xs: 'absolute', lg: 'relative' },
            top: 0,
            left: rtlMode ? 'auto' : { xs: 0, lg: 'auto' },
            right: rtlMode ? { xs: 0, lg: 'auto' } : 'auto',
            mt: { xs: 0, lg: 2.5 },
            ml: { xs: 0, lg: 2.5 },
            mb: { xs: 0, lg: 2.5 },
            borderRadius: {
              xs: rtlMode ? '0 20px 20px 0' : '20px 0 0 20px',
              lg: '20px',
            },
            zIndex: { xs: 1000, lg: 'auto' },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Sidebar
            rtlMode={rtlMode}
            setRtlMode={setRtlMode}
            darkMode={darkMode}
            setDarkMode={handleSetDarkMode}
            onMenuItemClick={closeSidebar}
          />
        </Box>
      ),
    [sidebarOpen, rtlMode, darkMode, closeSidebar, handleSetDarkMode]
  );

  const MemoizedNavbar = useMemo(
    () => (
      <Box
        sx={{
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          px: { xs: 2, lg: 3 },
          pt: { xs: 2, lg: 0 },
        }}
      >
        <Navbar
          onOpenInviteModal={handleOpenInviteModal}
          onToggleSidebar={toggleSidebar}
          darkMode={darkMode}
        />
        <EmployeeInviteModal
          open={inviteModalOpen}
          darkMode={darkMode}
          onClose={handleCloseInviteModal}
        />
      </Box>
    ),
    [
      darkMode,
      inviteModalOpen,
      toggleSidebar,
      handleOpenInviteModal,
      handleCloseInviteModal,
    ]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'var(--white-100-color)',
        py: { xs: 2, md: 0 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1440px',
          display: 'flex',
          fontFamily: 'SF Pro Rounded, sans-serif',
          overflow: 'hidden',
          borderRadius: '20px',
          height: { xs: 'auto', md: '100vh' },
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
            height: { xs: 'auto', md: '100vh' },
            transition: 'margin 0.3s ease',
            marginLeft: 0,
            marginRight: 0,
            width: '100%',
            direction: rtlMode ? 'rtl' : 'ltr',
            backgroundColor: 'var(--white-100-color)',
          }}
        >
          {/* Navbar (static) */}
          {MemoizedNavbar}

          {/* Scrollable Outlet */}
          <Box
            component='main'
            sx={{
              flex: 1,
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 3 },
              backgroundColor: 'var(--white-100-color)',
            }}
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
              <RouteErrorBoundary>
                <Outlet context={outletContext} />
              </RouteErrorBoundary>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(Layout);
