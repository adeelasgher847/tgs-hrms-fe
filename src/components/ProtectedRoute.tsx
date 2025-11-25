import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [requiresPayment, setRequiresPayment] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || isChecking) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setRequiresPayment(false);
      return;
    }

    let needsPayment = false;

    if (user) {
      const userAny = user as Record<string, unknown>;
      needsPayment =
        userAny?.requiresPayment === true || userAny?.requires_payment === true;
    }

    if (!needsPayment) {
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        try {
          const parsedUser = JSON.parse(userFromStorage);
          needsPayment =
            parsedUser?.requiresPayment === true ||
            parsedUser?.requires_payment === true;
        } catch {
          // Ignore parse errors - user data may be invalid
        }
      }
    }

    setRequiresPayment(needsPayment);
  }, [user, loading, isChecking]);

  if (loading || isChecking || requiresPayment === null) {
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

  const token = localStorage.getItem('accessToken');

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
