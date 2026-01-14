import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';

export interface KPI {
  id: string;
  title: string;
  description: string;
  weight: number;
  category: string;
  tenant_id: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKPIDto {
  title: string;
  description: string;
  weight: number;
  category: string;
  status: string;
}

export interface UpdateKPIDto {
  title?: string;
  description?: string;
  weight?: number;
  category?: string;
  status?: string;
}

export class KpiApiService {
  private baseUrl = '/kpis';

  // Create a new KPI
  async createKPI(data: CreateKPIDto): Promise<KPI> {
    try {
      const response = await axiosInstance.post<KPI>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'create',
        resource: 'kpi',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Get all KPIs
  async getKPIs(page: number): Promise<KPI[]> {
    try {
      const response = await axiosInstance.get<KPI[]>(this.baseUrl, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'fetch',
        resource: 'kpi',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Update existing KPI
  async updateKPI(id: string, data: UpdateKPIDto): Promise<KPI> {
    try {
      const response = await axiosInstance.put<KPI>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'kpi',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Delete a KPI
  async deleteKPI(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{ deleted: true; id: string }>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'delete',
        resource: 'kpi',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }
}

export const kpiApiService = new KpiApiService();
