export type CandidateStage =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interviewed'
  | 'Technical Round'
  | 'HR Round'
  | 'Offered'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn';

export interface StatusHistoryEntry {
  stage: CandidateStage;
  date: string; // ISO date string
  updatedBy: {
    id: string;
    name: string;
  };
  comments?: string;
}

export interface Candidate {
  id: string;
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
  websiteUrl?: string;
  profileSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobRequisitionId: string;
  currentStage: CandidateStage;
  statusHistory: StatusHistoryEntry[];
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  rating?: number; // 1-5 stars
}