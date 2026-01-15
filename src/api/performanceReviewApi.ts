import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';
import { type Employee, type EmployeeKPI } from './employeeKpiApi';

export interface PerformanceReview {
    id: string;
    employee_id: string;
    cycle: string;
    overallScore: number;
    status: 'under_review' | 'completed';
    reviewedBy: string;
    approvedBy: string | null;
    recommendation: string;
    tenant_id: string;
    createdAt: string;
    employee?: Employee;
    kpis?: EmployeeKPI[];
}

export interface CreatePerformanceReviewDto {
    employeeId: string;
    cycle: string;
    overallScore: number;
    recommendation: string;
}

export interface PerformanceReviewsResponse {
    items: PerformanceReview[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class PerformanceReviewApiService {
    private baseUrl = '/performance-reviews';

    // Create a new performance review (Manager role)
    async createPerformanceReview(data: CreatePerformanceReviewDto): Promise<PerformanceReview> {
        try {
            const response = await axiosInstance.post<PerformanceReview>(this.baseUrl, data);
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

    // Get all performance reviews
    async getPerformanceReviews(params?: {
        cycle?: string;
        page?: number;
        limit?: number;
    }): Promise<PerformanceReviewsResponse> {
        try {
            const response = await axiosInstance.get<PerformanceReviewsResponse>(this.baseUrl, { params });
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

    // Get a single performance review by ID
    async getPerformanceReviewById(id: string): Promise<PerformanceReview> {
        try {
            const response = await axiosInstance.get<PerformanceReview>(`${this.baseUrl}/${id}`);
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

    // Approve and finalize a performance review (Admin and HR Admin roles)
    async approvePerformanceReview(id: string): Promise<PerformanceReview> {
        try {
            const response = await axiosInstance.post<PerformanceReview>(`${this.baseUrl}/${id}/approve`);
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
}

export const performanceReviewApiService = new PerformanceReviewApiService();
