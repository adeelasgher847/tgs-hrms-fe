/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import notificationsApi from '../api/notificationsApi';

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

// API shapes for dashboard alerts
interface PendingApproval {
  id?: string;
  user_id?: string;
  employee?: { first_name?: string; last_name?: string; email?: string } | null;
  check_in_time?: string;
  approval_status?: string;
  message?: string;
  timestamp?: string;
}

interface AutoCheckout {
  id?: string;
  title?: string;
  message?: string;
  reason?: string;
  timestamp?: string;
}

interface SalaryIssue {
  id?: string;
  title?: string;
  message?: string;
  details?: string;
  timestamp?: string;
}

interface AlertsResponse {
  auto_checkouts?: AutoCheckout[];
  pending_approvals?: PendingApproval[];
  salary_issues?: SalaryIssue[];
  timestamp?: string;
}
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

const STORAGE_KEY = 'hrms_task_notifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize notifications from localStorage or use mock data
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      // Start empty; we'll try to fetch server alerts on mount and
      // fallback to a small mock when the fetch fails or returns no items.
      return [];
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      return [];
    }
  });

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);

  // Fetch server-side dashboard alerts and normalize them into our Notification[]
  useEffect(() => {
    let mounted = true;

    // No local mock seeding — prefer server data or stored notifications

    const fetchAlerts = async () => {
      try {
        const resp = await axiosInstance.get('/dashboard/alerts');
        const data = resp?.data || resp;

        // Expected shape: { auto_checkouts: [], pending_approvals: [], salary_issues: [], timestamp }
        const items: Notification[] = [];

        const pushNormalized = (
          id: string,
          title: string,
          text: string,
          ts?: string
        ) => {
          items.push({
            id,
            title,
            text,
            timestamp: ts ?? data.timestamp ?? new Date().toISOString(),
            read: false,
          });
        };
        // First, load notifications for the current user via notifications API
        const fetchUserNotifications = async () => {
          try {
            const resp = await notificationsApi.getNotifications({ limit: 50 });
            if (
              resp.ok &&
              Array.isArray(resp.notifications) &&
              resp.notifications.length > 0
            ) {
              const items: Notification[] = resp.notifications.map(n => ({
                id: n.id,
                title: n.type
                  ? `${n.type}`
                  : (n.message?.slice?.(0, 80) ?? 'Notification'),
                text: n.message ?? '',
                timestamp:
                  n.created_at ?? n.updated_at ?? new Date().toISOString(),
                read: n.status === 'read',
                raw: n,
              }));

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
          } catch (err) {
            console.warn('Failed to load user notifications', err);
          }
        };

        fetchUserNotifications();

        // then fetch dashboard alerts as before
        if (Array.isArray((data as AlertsResponse).pending_approvals)) {
          (data as AlertsResponse).pending_approvals!.forEach(
            (p: PendingApproval) => {
              const emp = p.employee ?? {};
              const name =
                `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
              const title = `Pending approval${name ? ` - ${name}` : ''}`;
              const text = p.message ?? 'Pending approval';
              const ts =
                p.check_in_time ??
                p.timestamp ??
                (data as AlertsResponse).timestamp;
              const id =
                p.id ?? `pending-${Math.random().toString(36).slice(2, 9)}`;
              pushNormalized(id, title, text, ts);
            }
          );
        }

        if (Array.isArray((data as AlertsResponse).auto_checkouts)) {
          (data as AlertsResponse).auto_checkouts!.forEach(
            (a: AutoCheckout, idx: number) => {
              const id =
                a.id ?? `auto-${idx}-${Math.random().toString(36).slice(2, 9)}`;
              const title = a.title ?? 'Auto checkout alert';
              const text = a.message ?? a.reason ?? 'Employee missing checkout';
              const ts = a.timestamp ?? (data as AlertsResponse).timestamp;
              pushNormalized(id, title, text, ts);
            }
          );
        }

        if (Array.isArray((data as AlertsResponse).salary_issues)) {
          (data as AlertsResponse).salary_issues!.forEach(
            (s: SalaryIssue, idx: number) => {
              const id =
                s.id ??
                `salary-${idx}-${Math.random().toString(36).slice(2, 9)}`;
              const title = s.title ?? 'Salary issue';
              const text = s.message ?? s.details ?? 'Payroll issue detected';
              const ts = s.timestamp ?? (data as AlertsResponse).timestamp;
              pushNormalized(id, title, text, ts);
            }
          );
        }

        if (mounted && items.length > 0) {
          // sort by timestamp desc
          items.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          // Merge with existing notifications, deduplicate by id
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newItems = items.filter(i => !existingIds.has(i.id));
            const merged = [...newItems, ...prev];
            // Keep most recent first and limit to reasonable size
            merged.sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
            return merged.slice(0, 200);
          });
        }
      } catch (err) {
        // On failure, keep any stored notifications
        console.warn('Failed to fetch dashboard alerts', err);
      }
    };

    fetchAlerts();

    // Poll for alerts periodically to surface cross-session notifications
    const POLL_INTERVAL = 15000; // 15s
    const interval = setInterval(() => {
      fetchAlerts();
    }, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Listen for in-app notification events dispatched by `notificationsApi`
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detail = (e as any).detail ?? {};
        const msg = detail.message ?? detail.data?.message ?? 'Notification';
        const timestamp = new Date().toISOString();

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
      } catch (err) {
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
