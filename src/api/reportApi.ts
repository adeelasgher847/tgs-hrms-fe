import axiosInstance from './axiosInstance';

class AttendanceSummaryApi {
  private baseUrl = '/reports/attendance-summary';

  async getAttendanceSummary(
    tenantId: string,
    days: number = 30,
    page: number = 1
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        tenantId,
        days: days.toString(),
        page: page.toString(),
      });
      const response = await axiosInstance.get(
        `${this.baseUrl}?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Error fetching attendance summary:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

export default new AttendanceSummaryApi();
