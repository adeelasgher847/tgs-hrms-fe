import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { CircularProgress, Box } from '@mui/material';
import { getStoredUser } from '../utils/authSession';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const effectiveUser = useMemo(
    () => user ?? getStoredUser<Record<string, unknown>>(),
    [user]
  );

  const requiresPayment = useMemo(() => {
    if (!token || !effectiveUser) return false;
    const candidate = effectiveUser as {
      requiresPayment?: boolean;
      requires_payment?: boolean;
    };
    return (
      candidate.requiresPayment === true || candidate.requires_payment === true
    );
  }, [effectiveUser, token]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    return <Navigate to='/' replace state={{ from: location }} />;
  }

  if (requiresPayment) {
    return (
      <Navigate to='/signup/select-plan' replace state={{ from: location }} />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
