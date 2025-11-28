import axiosInstance from './axiosInstance';

export type AttendanceEvent = {
  id: string;
  timestamp: string; 
  type: 'check-in' | 'check-out' | string;
  user_id?: string;
  user?: { first_name?: string; name?: string; id?: string };
  created_at?: string;

};

export type UserDailySummary = {
  date: string; 
  checkIn: string | null; 
  checkOut: string | null; 
  workedHours: number; 
};

const BASE = '/attendance';

class AttendanceApiService {
  async getUserAttendance(userId?: string): Promise<AttendanceEvent[]> {
    const url = userId ? `${BASE}?userId=${userId}` : BASE;
    const res = await axiosInstance.get<AttendanceEvent[]>(url);
    return (res.data as unknown) || [];
  }

  async getAllAttendance(): Promise<AttendanceEvent[]> {
    const res = await axiosInstance.get<AttendanceEvent[]>(`${BASE}/all`);

    return (res.data as unknown) || [];
  }
  async createAttendance(payload: { type: 'check-in' | 'check-out' | string }) {
    const res = await axiosInstance.post(BASE, payload);
    return res.data as AttendanceEvent;
  }

  async getUserDailySummary(userId?: string): Promise<UserDailySummary[]> {
    const url = userId ? `${BASE}?userId=${userId}` : BASE;
    const res = await axiosInstance.get<UserDailySummary[]>(url);

    return res.data || [];
  }

  async getTodaySummary(userId?: string): Promise<UserDailySummary | null> {
    const all = await this.getUserDailySummary(userId);
    const today = new Date().toISOString().split('T')[0];

    return all.find(d => d.date === today) || null;
  }
}

export const attendanceApiService = new AttendanceApiService();
export default attendanceApiService;
