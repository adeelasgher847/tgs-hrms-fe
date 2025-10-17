import axiosInstance from './axiosInstance';

class AttendanceSummaryApi {
  private baseUrl = '/reports/attendance-summary';

  async getAttendanceSummary(
    tenantId: string,
    days: number = 30,
    page: number = 1
  ): Promise<{
    items: Record<string, unknown>[];
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
        (error as Record<string, unknown>)?.response?.data || (error as Record<string, unknown>)?.message
      );
      throw error;
    }
  }
}

export default new AttendanceSummaryApi();
