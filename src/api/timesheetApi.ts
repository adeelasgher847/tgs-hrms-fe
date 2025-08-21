// timesheetApi.ts
import axiosInstance from './axiosInstance';

export interface TimesheetEntry {
  id: string;
  user_id: string;
  employee_full_name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
}

interface TimesheetResponse {
  employee: { userId: string; fullName: string };
  totalHours: number;
  sessions: TimesheetEntry[];
}

class TimesheetApiService {
  private baseUrl = '/timesheet';

  async startWork(): Promise<TimesheetEntry> {
    const response = await axiosInstance.post<TimesheetEntry>(`${this.baseUrl}/start`);
    return response.data;
  }

  async endWork(): Promise<TimesheetEntry> {
    const response = await axiosInstance.post<TimesheetEntry>(`${this.baseUrl}/end`);
    return response.data;
  }

  async getUserTimesheet(): Promise<TimesheetEntry[]> {
    const response = await axiosInstance.get<TimesheetResponse>(this.baseUrl);
    return response.data.sessions; // <-- unwrap the array
  }
}

const timesheetApi = new TimesheetApiService();
export default timesheetApi;
