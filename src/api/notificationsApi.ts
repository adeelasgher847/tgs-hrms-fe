import axiosInstance from './axiosInstance';
import { getCurrentUser } from '../utils/auth';

export interface SendNotificationRequest {
  user_ids: string[];
  message: string;
  type?: string; // e.g. 'alert'
}

export interface SendNotificationRawResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  correlationId?: string;
}

export interface SendNotificationResult {
  ok: boolean;
  status: number;
  data?: unknown;
  message?: string;
  correlationId?: string | null;
  error?: unknown;
}

export interface GetNotificationsParams {
  status?: 'unread' | 'read';
  type?: string;
  limit?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  tenant_id?: string;
  message: string;
  type?: string;
  status?: 'unread' | 'read';
  created_at?: string;
  updated_at?: string;
}

export interface GetNotificationsResult {
  ok: boolean;
  status: number;
  notifications?: NotificationItem[];
  unread_count?: number;
  message?: string;
  error?: unknown;
}

class NotificationsApi {
  private baseUrl = '/notifications';
  async sendNotification(payload: SendNotificationRequest): Promise<SendNotificationResult> {
    const result: SendNotificationResult = {
      ok: false,
      status: 0,
      correlationId: null,
    };

    try {
      const resp = await axiosInstance.post<SendNotificationRawResponse>(
        `${this.baseUrl}/send`,
        payload
      );

      result.status = resp.status;
      result.ok = resp.status >= 200 && resp.status < 300;
      result.data = resp.data?.data ?? resp.data;
      result.message = resp.data?.message ?? undefined;

      // Try common places for correlation id: response header or body
      const headerCorr =
        resp.headers?.['x-correlation-id'] || resp.headers?.['x-request-id'];
      const dataCorr = (resp.data as SendNotificationRawResponse)
        ?.correlationId;
      result.correlationId = headerCorr ?? dataCorr ?? null;

      // Dispatch an in-app event so the UI can show the notification immediately
      // Dispatch an in-app event so the UI can show the notification immediately
      /*
      try {
        const eventDetail = {
          message: result.message ?? payload.message,
          data: result.data,
          correlationId: result.correlationId,
          type: payload.type ?? 'alert',
        } as Record<string, unknown>;
        const event = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail: eventDetail });
        window.dispatchEvent(event);
      } catch {
        // ignore
      }
      */

      return result;
    } catch (err: unknown) {
      // Try to extract useful info from axios error shape
      // Keep normalized error shape so callers can log/show friendly info
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown>; headers?: Record<string, unknown> } };
      result.error = err;

      if (axiosErr?.response) {
        result.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as Record<string, unknown> | undefined;
        result.message = (data && (data.message as string)) ?? (data && (data.error as string)) ?? undefined;
        result.data = data ?? undefined;
        result.correlationId = (axiosErr.response.headers && (String(axiosErr.response.headers['x-correlation-id']) || undefined)) ?? (data && (data.correlationId as string)) ?? null;
      }

      return result;
    }
  }

  async getNotifications(params?: GetNotificationsParams): Promise<GetNotificationsResult> {
    const res: GetNotificationsResult = { ok: false, status: 0 };
    try {
      const resp = await axiosInstance.get(`${this.baseUrl}`, { params });
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      const data = resp.data ?? {};
      res.notifications = data.notifications ?? data.data ?? [];
      res.unread_count = data.unread_count ?? data.unreadCount ?? 0;
      res.message = data.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as Record<string, unknown> | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }

  async markNotificationRead(notificationId: string): Promise<SendNotificationResult> {
    const res: SendNotificationResult = { ok: false, status: 0, correlationId: null };
    try {
      const resp = await axiosInstance.patch(`${this.baseUrl}/${encodeURIComponent(notificationId)}/read`);
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      res.data = resp.data?.data ?? resp.data;
      res.message = resp.data?.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as Record<string, unknown> | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }

  async markAllNotificationsRead(): Promise<SendNotificationResult> {
    const res: SendNotificationResult = { ok: false, status: 0, correlationId: null };
    try {
      const resp = await axiosInstance.patch(`${this.baseUrl}/read-all`);
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      res.data = resp.data?.data ?? resp.data;
      res.message = resp.data?.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as Record<string, unknown> | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }
}

export const notificationsApi = new NotificationsApi();

export default notificationsApi;
