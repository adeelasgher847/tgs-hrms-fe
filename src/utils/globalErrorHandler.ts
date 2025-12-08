import { snackbar } from './snackbar';
import { extractErrorMessage } from './errorHandler';

let initialized = false;

/**
 * Sets up global error and unhandled promise rejection handlers.
 *
 * This is a last line of defence and complements:
 * - React Error Boundaries (for render/lifecycle errors)
 * - `useErrorHandler` / API helpers (for controlled async errors)
 */
export function initializeGlobalErrorHandling(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  initialized = true;

  window.addEventListener('error', event => {
    try {
      const sourceError = (event as ErrorEvent).error ?? event.message;
      const result = extractErrorMessage(sourceError || 'Unexpected error');

      if (result.shouldShow) {
        snackbar.error(result.message);
      }
    } catch {
      snackbar.error('An unexpected error occurred. Please try again.');
    }
  });

  window.addEventListener('unhandledrejection', event => {
    try {
      const anyEvent = event as PromiseRejectionEvent;
      const reason =
        (anyEvent.reason && (anyEvent.reason.error || anyEvent.reason)) ??
        anyEvent.reason;

      const result = extractErrorMessage(reason || 'Unexpected error');

      if (result.shouldShow) {
        snackbar.error(result.message);
      }
    } catch {
      snackbar.error('An unexpected error occurred. Please try again.');
    }
  });
}
