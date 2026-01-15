import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';
import { type KPI } from './kpiApi';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_pic?: string;
}

export interface Employee {
    id: string;
    user_id: string;
    designation_id?: string;
    status: string;
    invite_status?: string;
    team_id?: string;
    cnic_number?: string;
    profile_picture?: string;
    created_at: string;
    user?: User;
}

export interface EmployeeKPI {
    id: string;
    employee_id: string;
    kpi_id: string;
    targetValue: number;
    achievedValue: number;
    score: number;
    reviewCycle: string;
    reviewedBy: string;
    remarks: string;
    tenant_id: string;
    createdAt: string;
    kpi?: KPI;
    employee?: Employee;
}

export interface CreateEmployeeKPIDto {
    employeeId: string;
    kpiId: string;
    targetValue: number;
    achievedValue: number;
    reviewCycle: string;
    reviewedBy: string;
    remarks: string;
}

export interface UpdateEmployeeKPIDto {
    targetValue?: number;
    achievedValue?: number;
    reviewCycle?: string;
    reviewedBy?: string;
    remarks?: string;
}

export interface KPISummary {
    employeeId: string;
    cycle: string;
    totalScore: number;
    recordCount: number;
}

export interface TeamKPISummary {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    cycle: string;
    totalScore: number;
    recordCount: number;
    kpis: {
        kpiId: string;
        kpiTitle: string;
        targetValue: number;
        achievedValue: number;
        score: number;
        weight: number;
        weightedScore: number;
    }[];
}

export class EmployeeKpiApiService {
    private baseEmployeeKpiUrl = '/employee-kpis';

    // Assign a KPI to an employee
    async assignKPI(data: CreateEmployeeKPIDto): Promise<EmployeeKPI> {
        try {
            const response = await axiosInstance.post<EmployeeKPI>(
                this.baseEmployeeKpiUrl,
                data
            );
            return response.data;
        } catch (error) {
            const errorResult = handleApiError(error, {
                operation: 'create',
                resource: 'kpi', // Reusing kpi resource type
                isGlobal: false,
            });
            throw new Error(errorResult.message);
        }
    }

    // Get all employee KPIs (with optional filters)
    async getEmployeeKPIs(params?: {
        employeeId?: string;
        cycle?: string;
    }): Promise<EmployeeKPI[]> {
        try {
            const response = await axiosInstance.get<EmployeeKPI[]>(
                this.baseEmployeeKpiUrl,
                { params }
            );
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

    // Get team KPIs
    async getTeamKPIs(params?: { cycle?: string }): Promise<EmployeeKPI[]> {
        try {
            const response = await axiosInstance.get<EmployeeKPI[]>(
                `${this.baseEmployeeKpiUrl}/team`,
                { params }
            );
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

    // Update employee KPI
    async updateEmployeeKPI(
        id: string,
        data: UpdateEmployeeKPIDto
    ): Promise<EmployeeKPI> {
        try {
            const response = await axiosInstance.put<EmployeeKPI>(
                `${this.baseEmployeeKpiUrl}/${id}`,
                data
            );
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

    // Get single employee KPI by ID
    async getEmployeeKPIById(id: string): Promise<EmployeeKPI> {
        try {
            const response = await axiosInstance.get<EmployeeKPI>(
                `${this.baseEmployeeKpiUrl}/${id}`
            );
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

    // Get KPI summary for an employee
    async getKPISummary(params: {
        employeeId: string;
        cycle?: string;
    }): Promise<KPISummary> {
        try {
            // Try query params first
            const response = await axiosInstance.get<KPISummary>(
                `${this.baseEmployeeKpiUrl}/summary`,
                { params }
            );
            return response.data;
        } catch (error: any) {
            // fallback for potential 404 or path-based endpoint
            if (error.response?.status === 404) {
                try {
                    const response = await axiosInstance.get<KPISummary>(
                        `${this.baseEmployeeKpiUrl}/employee/${params.employeeId}/summary`,
                        { params: { cycle: params.cycle } }
                    );
                    return response.data;
                } catch {
                    // If both fail, the caller should handle it
                }
            }
            const errorResult = handleApiError(error, {
                operation: 'fetch',
                resource: 'kpi',
                isGlobal: false,
            });
            throw new Error(errorResult.message);
        }
    }

    // Get KPI summary for team
    async getTeamKPISummary(params: {
        cycle?: string;
    }): Promise<TeamKPISummary[]> {
        try {
            const response = await axiosInstance.get<TeamKPISummary[]>(
                `${this.baseEmployeeKpiUrl}/team/summary`,
                { params }
            );
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
}

export const employeeKpiApiService = new EmployeeKpiApiService();
