import axiosInstance from './axiosInstance';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract';
export type WorkLocation = 'Remote' | 'Onsite' | 'Hybrid';
export type RequisitionStatus = 'Draft' | 'Pending approval' | 'Approved' | 'Rejected';
export type ApprovalLevel = 'Department Head' | 'Finance' | 'HR';

export interface ApprovalLog {
  id: string;
  level: ApprovalLevel;
  status: 'Pending' | 'Approved' | 'Rejected';
  approverName: string;
  approverId: string;
  approvedAt?: string;
  rejectionReason?: string;
  comments?: string;
}

export interface JobRequisition {
  id: string;
  jobTitle: string;
  department: {
    id: string;
    name: string;
  };
  reportingManager: {
    id: string;
    name: string;
  };
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  numberOfOpenings: number;
  budgetedSalaryMin: number;
  budgetedSalaryMax: number;
  jobDescription: string;
  responsibilities: string;
  requiredSkills: string;
  requiredExperience: string;
  justificationForHire: string;
  status: RequisitionStatus;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  approvalLogs: ApprovalLog[];
  tenantId: string;
}

export interface CreateJobRequisitionDto {
  jobTitle: string;
  departmentId: string;
  reportingManagerId: string;
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  numberOfOpenings: number;
  budgetedSalaryMin: number;
  budgetedSalaryMax: number;
  jobDescription: string;
  responsibilities: string;
  requiredSkills: string;
  requiredExperience: string;
  justificationForHire: string;
  status?: RequisitionStatus;
}

export interface UpdateJobRequisitionDto {
  jobTitle?: string;
  departmentId?: string;
  reportingManagerId?: string;
  employmentType?: EmploymentType;
  workLocation?: WorkLocation;
  numberOfOpenings?: number;
  budgetedSalaryMin?: number;
  budgetedSalaryMax?: number;
  jobDescription?: string;
  responsibilities?: string;
  requiredSkills?: string;
  requiredExperience?: string;
  justificationForHire?: string;
  status?: RequisitionStatus;
}

export interface ApprovalActionDto {
  status: 'Approved' | 'Rejected';
  comments?: string;
  rejectionReason?: string;
}

export interface JobRequisitionListResponse {
  data: JobRequisition[];
  total: number;
  page: number;
  pageSize: number;
}

class JobRequisitionApiService {
  private baseUrl = '/job-requisitions';

  /**
   * Get all job requisitions with pagination
   */
  async getRequisitions(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      status?: RequisitionStatus;
      departmentId?: string;
      searchTerm?: string;
    }
  ): Promise<JobRequisitionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.departmentId) {
      params.append('departmentId', filters.departmentId);
    }
    if (filters?.searchTerm) {
      params.append('search', filters.searchTerm);
    }

    const response = await axiosInstance.get<JobRequisitionListResponse>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get a single job requisition by ID
   */
  async getRequisitionById(id: string): Promise<JobRequisition> {
    const response = await axiosInstance.get<JobRequisition>(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Create a new job requisition
   */
  async createRequisition(
    data: CreateJobRequisitionDto
  ): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      this.baseUrl,
      data
    );
    return response.data;
  }

  /**
   * Update an existing job requisition
   */
  async updateRequisition(
    id: string,
    data: UpdateJobRequisitionDto
  ): Promise<JobRequisition> {
    const response = await axiosInstance.put<JobRequisition>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a job requisition
   */
  async deleteRequisition(id: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Submit a draft requisition for approval
   */
  async submitForApproval(id: string): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      `${this.baseUrl}/${id}/submit`,
      {}
    );
    return response.data;
  }

  /**
   * Approve or reject a requisition at an approval level
   */
  async approveRequisition(
    id: string,
    data: ApprovalActionDto
  ): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      `${this.baseUrl}/${id}/approve`,
      data
    );
    return response.data;
  }

  /**
   * Reject a requisition
   */
  async rejectRequisition(
    id: string,
    data: ApprovalActionDto
  ): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      `${this.baseUrl}/${id}/reject`,
      data
    );
    return response.data;
  }

  /**
   * Clone an existing job requisition
   */
  async cloneRequisition(id: string): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      `${this.baseUrl}/${id}/clone`,
      {}
    );
    return response.data;
  }

  /**
   * Publish a requisition (only when approved)
   */
  async publishRequisition(id: string): Promise<JobRequisition> {
    const response = await axiosInstance.post<JobRequisition>(
      `${this.baseUrl}/${id}/publish`,
      {}
    );
    return response.data;
  }

  /**
   * Get audit trail for a requisition
   */
  async getAuditTrail(id: string): Promise<ApprovalLog[]> {
    const response = await axiosInstance.get<ApprovalLog[]>(
      `${this.baseUrl}/${id}/audit-trail`
    );
    return response.data;
  }
}

export const jobRequisitionApiService = new JobRequisitionApiService();
export default jobRequisitionApiService;
