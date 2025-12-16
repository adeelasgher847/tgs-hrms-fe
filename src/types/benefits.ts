export type BenefitStatus = 'active' | 'inactive';

export type BenefitType =
  | 'health'
  | 'dental'
  | 'vision'
  | 'life'
  | 'retirement'
  | 'other';

export interface Benefit {
  id: string;
  name: string;
  type: BenefitType;
  description: string;
  eligibility: string;
  status: BenefitStatus;
}

export interface EmployeeBenefitAssignment {
  id: string;
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string | null;
  status: 'active' | 'ended' | 'scheduled';
}

export interface BenefitFilters {
  search?: string;
  status?: BenefitStatus | 'all';
  type?: BenefitType | 'all';
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
