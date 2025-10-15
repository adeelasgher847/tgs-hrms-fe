import axiosInstance from './axiosInstance';

class AttendanceSummaryApi {
  private baseUrl = '/reports/attendance-summary';

  async getAttendanceSummary(
    tenantId: string,
    days: number = 30,
    page: number = 1
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
    } catch (error: unknown) {
      console.error(
        'Error fetching attendance summary:',
        (error as any)?.response?.data || (error as any)?.message
      );
      throw error;
    }
  }
}

export default new AttendanceSummaryApi();
