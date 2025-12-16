import { useState, useCallback } from 'react';
import { extractErrorMessage, handleApiError } from '../utils/errorHandler';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface UseErrorHandlerReturn {
  snackbar: SnackbarState;
  showError: (
    error: unknown,
    context?: {
      operation: 'create' | 'update' | 'delete' | 'fetch';
      resource: 'department' | 'designation' | 'employee';
      isGlobal?: boolean;
    }
  ) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeSnackbar: () => void;
}

/**
 * Custom hook for consistent error handling across components
 * Provides centralized error message extraction and snackbar management
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'error',
  });

  const showError = useCallback(
    (
      error: unknown,
      context?: {
        operation: 'create' | 'update' | 'delete' | 'fetch';
        resource: 'department' | 'designation' | 'employee';
        isGlobal?: boolean;
      }
    ) => {
      const errorResult = context
        ? handleApiError(error, context)
        : extractErrorMessage(error);

      setSnackbar({
        open: true,
        message: errorResult.message,
        severity: 'error',
      });
    },
    []
  );

  const showSuccess = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  }, []);

  const showWarning = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'warning',
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'info',
    });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    closeSnackbar,
  };
}

/**
 * Higher-order function to wrap API calls with error handling
 * @param apiCall - The API function to call
 * @param errorHandler - The error handler function
 * @param context - Context for error handling
 * @returns Promise that resolves to the API result or rejects with handled error
 */
export function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  errorHandler: (error: unknown) => void
  // context?: {
  //   operation: 'create' | 'update' | 'delete' | 'fetch';
  //   resource: 'department' | 'designation' | 'employee';
  //   isGlobal?: boolean;
  // }
): Promise<T> {
  return apiCall().catch((error: unknown) => {
    errorHandler(error);
    throw error; // Re-throw to maintain error flow
  });
}
