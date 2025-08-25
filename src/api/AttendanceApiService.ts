import axiosInstance from './axiosInstance';

export type AttendanceEvent = {
  id: string;
  timestamp: string; // e.g. "2025-08-09T21:55:09.299Z"
  type: 'check-in' | 'check-out' | string;
  user_id?: string;
  user?: { first_name?: string; name?: string; id?: string };
  created_at?: string;
  // any other fields your backend returns
};

export type UserDailySummary = {
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string or null
  checkOut: string | null; // ISO string or null
  workedHours: number; // decimal hours
};

const BASE = '/attendance';

class AttendanceApiService {
  // Get attendance events for current user (or optionally a specific user)
  async getUserAttendance(userId?: string): Promise<AttendanceEvent[]> {
    const url = userId ? `${BASE}?userId=${userId}` : BASE;
    const res = await axiosInstance.get<AttendanceEvent[]>(url);
    return (res.data as any) || [];
  }

  // Get all attendance events (admin)
  async getAllAttendance(): Promise<AttendanceEvent[]> {
    const res = await axiosInstance.get<AttendanceEvent[]>(`${BASE}/all`);
    console.log('🔥 All Attendance Events:', res.data);
    return (res.data as any) || [];
  }

  // Create a new check-in / check-out event.
  // Payload is intentionally small because server creates the timestamp.
  async createAttendance(payload: { type: 'check-in' | 'check-out' | string }) {
    const res = await axiosInstance.post(BASE, payload);
    return res.data as AttendanceEvent;
  }

  // Fetch daily summaries for the current user (or for a provided userId if admin wants to view another user)
  async getUserDailySummary(userId?: string): Promise<UserDailySummary[]> {
    console.log('🔥 Fetching User Daily Summary for userId:', userId);
    const url = userId ? `${BASE}?userId=${userId}` : BASE;
    const res = await axiosInstance.get<UserDailySummary[]>(url);
    console.log(url);
    console.log('🔥 User Daily Summary:', res.data);
    // The backend returns an array of { date, checkIn, checkOut, workedHours }
    return res.data || [];
  }

  // Helper: fetch today's summary for convenience
  async getTodaySummary(userId?: string): Promise<UserDailySummary | null> {
    const all = await this.getUserDailySummary(userId);
    const today = new Date().toISOString().split('T')[0];
    console.log(
      '🔥 Today Summary:',
      all.find(d => d.date === today)
    );
    return all.find(d => d.date === today) || null;
  }
}

export const attendanceApiService = new AttendanceApiService();
export default attendanceApiService;
