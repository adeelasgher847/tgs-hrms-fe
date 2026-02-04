/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationsApi from '../api/notificationsApi';
import { getCurrentUser } from '../utils/auth';

// Local Notification type for the UI notifications used by the Navbar
export interface Notification {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  read: boolean;
  // Optional extra fields used by some UIs (task panel etc.)
  employeeName?: string;
  taskTitle?: string;
  oldStatus?: string;
  newStatus?: string;
  // keep raw payload for debugging or future use
  raw?: unknown;
}

// Removed unused alert helper types (PendingApproval, AutoCheckout, SalaryIssue)

// AlertsResponse type removed; not used in this module
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize notifications to an empty array and rely on server fetch/polling
  // as the source of truth (do not read/write localStorage so UI shows live data).
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch server-side user notifications and normalize them into our Notification[]
  useEffect(() => {
    let mounted = true;

    const fetchUserNotifications = async () => {
      try {
        const resp = await notificationsApi.getNotifications({ limit: 50 });
        if (
          resp.ok &&
          Array.isArray(resp.notifications) &&
          resp.notifications.length > 0
        ) {
          const formatTypeLabel = (t?: string) => {
            if (!t) return undefined;
            // drop suffix after colon (backend may append :id)
            let s = String(t).split(':')[0];
            s = s
              .replace(/[_-]+/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .trim();
            s = s
              .split(' ')
              .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
              .join(' ');
            return s || undefined;
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cleanMessage = (m?: any) =>
            String(m ?? '')
              // remove UUIDs
              .replace(
                /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
                ''
              )
              // remove tokens like 'leave request id 1234', 'request id=123', 'id:123'
              .replace(
                /\b(?:leave\s*request\s*id|request\s*id|id)[:=]?\s*#?\d+\b/gi,
                ''
              )
              // remove hash-number tokens like #12345
              .replace(/#\d+\b/g, '')
              // remove hex-like id tokens (legacy)
              .replace(/id[:=]?\s*[0-9a-f-]+/gi, '')
              .replace(/\s{2,}/g, ' ')
              .trim();

          const items: Notification[] = resp.notifications
            .map(n => ({
              id: n.id,
              raw: n,
              type: n.type,
              _title: formatTypeLabel(n.type) ?? undefined,
              _message: cleanMessage(n.message) ?? '',
              timestamp:
                n.created_at ?? n.updated_at ?? new Date().toISOString(),
              read: n.status === 'read',
            }))
            .filter(x => {
              const t = String(x.type ?? '').toLowerCase();
              const m = String(x._message ?? '').toLowerCase();
              // exclude explicit 'alert' types or messages containing 'alert'
              if (t === 'alert' || m.includes('alert')) return false;
              return true;
            })
            .map(x => ({
              id: x.id,
              title: x._title ?? x._message?.slice?.(0, 80) ?? 'Notification',
              text: x._message,
              timestamp: x.timestamp,
              read: x.read,
              raw: x.raw,
            }));

          if (mounted) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = items.filter(i => !existingIds.has(i.id));
              const merged = [...newItems, ...prev];
              merged.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              );
              return merged.slice(0, 200);
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load user notifications', err);
      }
    };

    fetchUserNotifications();

    // Poll for user notifications periodically (keeps in sync across sessions)
    const POLL_INTERVAL = 15000; // 15s
    const interval = setInterval(() => {
      fetchUserNotifications();
    }, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = React.useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
    },
    []
  );

  // Listen for in-app notification events dispatched by `notificationsApi`
  // Ignore events that originated from the current user (actor) to avoid
  // showing self-generated notifications (e.g. assigning tasks to others).
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail ?? {};
        const msg = detail.message ?? detail.data?.message ?? 'Notification';

        // If the event includes an actorId and it's the current user, ignore
        const currentUser = getCurrentUser();
        const actorId = detail.actorId ?? detail.data?.actorId ?? undefined;
        if (
          actorId &&
          currentUser &&
          String(actorId) === String(currentUser.id)
        ) {
          return; // skip self-originated event
        }

        // Build a richer notification when possible
        const notification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
          title: detail.title ?? 'Notification',
          text: String(msg),
          employeeName:
            detail.employeeName ?? detail.data?.employeeName ?? undefined,
          taskTitle: detail.taskTitle ?? detail.data?.taskTitle ?? undefined,
          oldStatus: detail.oldStatus ?? detail.data?.oldStatus ?? undefined,
          newStatus: detail.newStatus ?? detail.data?.newStatus ?? undefined,
          raw: detail,
        };

        addNotification(notification);
      } catch {
        // ignore
      }
    };

    // Listen on window for CustomEvent('hrms:notification')
    window.addEventListener('hrms:notification', handler as EventListener);
    return () => {
      window.removeEventListener('hrms:notification', handler as EventListener);
    };
  }, [addNotification]);

  // Mark a specific notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    // Fire-and-forget: notify backend
    (async () => {
      try {
        const resp =
          await notificationsApi.markNotificationRead(notificationId);
        if (!resp.ok) {
          console.warn(
            'Failed to mark notification read on server',
            resp.message,
            resp.status
          );
        }
      } catch (err) {
        console.warn('Error marking notification read', err);
      }
    })();
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));

    // Fire-and-forget: notify backend to mark all as read
    (async () => {
      try {
        const resp = await notificationsApi.markAllNotificationsRead();
        if (!resp.ok) {
          console.warn(
            'Failed to mark all notifications read on server',
            resp.message,
            resp.status
          );
        }
      } catch (err) {
        console.warn('Error marking all notifications read', err);
      }
    })();
  };

  // Clear a specific notification
  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

// Note: do not default-export non-component/context values in files that
// also export components/hooks — this keeps fast-refresh happy.
// If the raw context object is needed elsewhere, re-export it from a
// dedicated utils file. For now, keep only component and hook exports.
