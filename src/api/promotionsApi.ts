import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';

export interface Promotion {
  id: string;
  employee_id: string;
  previousDesignation: string;
  newDesignation: string;
  effectiveDate: string;
  approvedBy?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string | null;
  tenant_id?: string;
  employee?: any;
  createdAt?: string;
}

export interface CreatePromotionDto {
  employeeId: string;
  previousDesignation: string;
  newDesignation: string;
  effectiveDate: string;
  remarks?: string;
}

export interface PromotionsResponse {
  items: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApprovePromotionDto {
  status: 'approved' | 'rejected';
  effectiveDate?: string;
  remarks?: string;
}

class PromotionsApiService {
  private baseUrl = '/promotions';

  // Manager: create a promotion request for an employee
  async createPromotion(data: CreatePromotionDto): Promise<Promotion> {
    try {
      const response = await axiosInstance.post<Promotion>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      const err = handleApiError(error, {
        operation: 'create',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(err.message);
    }
  }

  // Get promotions for tenant. Optional filters: employeeId, page, limit
  async getPromotions(params?: {
    employeeId?: string;
    page?: number;
    limit?: number;
  }): Promise<PromotionsResponse> {
    try {
      const response = await axiosInstance.get<PromotionsResponse>(
        this.baseUrl,
        { params }
      );
      return response.data;
    } catch (error) {
      const err = handleApiError(error, {
        operation: 'fetch',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(err.message);
    }
  }

  // Get single promotion by id
  async getPromotionById(id: string): Promise<Promotion> {
    try {
      const response = await axiosInstance.get<Promotion>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      const err = handleApiError(error, {
        operation: 'fetch',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(err.message);
    }
  }

  // Admin/HR: approve or reject a promotion request
  async approvePromotion(
    id: string,
    data: ApprovePromotionDto
  ): Promise<Promotion> {
    try {
      const response = await axiosInstance.put<Promotion>(
        `${this.baseUrl}/${id}/approve`,
        data
      );
      return response.data;
    } catch (error) {
      const err = handleApiError(error, {
        operation: 'update',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(err.message);
    }
  }
}

export const promotionsApiService = new PromotionsApiService();
