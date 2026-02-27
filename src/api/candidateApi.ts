import axiosInstance from './axiosInstance';
import type { Candidate, Application, CandidateStage, StatusHistoryEntry } from '../types/candidate';

export interface CreateCandidateDto {
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  skills: string[];
  experience: string;
  currentCompany?: string;
  location: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface UpdateCandidateDto {
  name?: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
  skills?: string[];
  experience?: string;
  currentCompany?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface CreateApplicationDto {
  candidateId: string;
  jobRequisitionId: string;
  notes?: string;
}

export interface UpdateApplicationStageDto {
  stage: CandidateStage;
  comments?: string;
  rating?: number;
}

export interface CandidateListResponse {
  data: Candidate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApplicationListResponse {
  data: Application[];
  total: number;
  page: number;
  pageSize: number;
}

class CandidateApiService {
  private baseUrl = '/candidates';

  // Candidate CRUD
  async getCandidates(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<CandidateListResponse> {
    const response = await axiosInstance.get<CandidateListResponse>(this.baseUrl, { params });
    return response.data;
  }

  async getCandidate(id: string): Promise<Candidate> {
    const response = await axiosInstance.get<Candidate>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createCandidate(data: CreateCandidateDto): Promise<Candidate> {
    const response = await axiosInstance.post<Candidate>(this.baseUrl, data);
    return response.data;
  }

  async updateCandidate(id: string, data: UpdateCandidateDto): Promise<Candidate> {
    const response = await axiosInstance.put<Candidate>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteCandidate(id: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${id}`);
  }

  // Application CRUD
  async getApplications(params?: {
    page?: number;
    pageSize?: number;
    jobRequisitionId?: string;
    stage?: CandidateStage;
  }): Promise<ApplicationListResponse> {
    const response = await axiosInstance.get<ApplicationListResponse>('/applications', { params });
    return response.data;
  }

  async getApplication(id: string): Promise<Application> {
    const response = await axiosInstance.get<Application>(`/applications/${id}`);
    return response.data;
  }

  async createApplication(data: CreateApplicationDto): Promise<Application> {
    const response = await axiosInstance.post<Application>('/applications', data);
    return response.data;
  }

  async updateApplicationStage(id: string, data: UpdateApplicationStageDto): Promise<Application> {
    const response = await axiosInstance.patch<Application>(`/applications/${id}/stage`, data);
    return response.data;
  }

  async deleteApplication(id: string): Promise<void> {
    await axiosInstance.delete(`/applications/${id}`);
  }

  // Mock implementations for frontend simulation
  async getCandidatesMock(): Promise<Candidate[]> {
    // In real implementation, this would be removed
    const { candidatesMockData } = await import('../Data/candidateMockData');
    return candidatesMockData;
  }

  async getApplicationsMock(jobRequisitionId?: string): Promise<Application[]> {
    const { applicationsMockData } = await import('../Data/candidateMockData');
    if (jobRequisitionId) {
      return applicationsMockData.filter(app => app.jobRequisitionId === jobRequisitionId);
    }
    return applicationsMockData;
  }

  async updateApplicationStageMock(id: string, data: UpdateApplicationStageDto): Promise<Application> {
    const { applicationsMockData } = await import('../Data/candidateMockData');
    const application = applicationsMockData.find(app => app.id === id);
    if (!application) {
      throw new Error('Application not found');
    }

    // Simulate current user (in real app, get from context)
    const currentUser = { id: 'USER-001', name: 'Sarah Johnson' };

    const newHistoryEntry: StatusHistoryEntry = {
      stage: data.stage,
      date: new Date().toISOString(),
      updatedBy: currentUser,
      comments: data.comments,
    };

    application.currentStage = data.stage;
    application.statusHistory.push(newHistoryEntry);
    application.updatedAt = new Date().toISOString();
    if (data.rating !== undefined) {
      application.rating = data.rating;
    }

    return application;
  }
}

export const candidateApiService = new CandidateApiService();

export const candidateApi = candidateApiService;
export default candidateApi;