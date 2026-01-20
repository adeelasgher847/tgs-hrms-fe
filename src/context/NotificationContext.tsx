/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

// Local Notification type for the UI notifications used by the Navbar
export interface Notification {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  read: boolean;
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
          setNotifications(items);
        }
      } catch (err) {
        // On failure, keep any stored notifications
        console.warn('Failed to fetch dashboard alerts', err);
      }
    };

    fetchAlerts();

    return () => {
      mounted = false;
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

  // Mark a specific notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
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
