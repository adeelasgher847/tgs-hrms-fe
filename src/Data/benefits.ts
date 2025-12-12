import type { Benefit, EmployeeBenefitAssignment } from '../types/benefits';

export const seedBenefits: Benefit[] = [
  {
    id: 'b1',
    name: 'Health Insurance - Silver Plan',
    type: 'health',
    description: 'Comprehensive health coverage with moderate premiums.',
    eligibility: 'Full-time employees after 30 days',
    status: 'active',
  },
  {
    id: 'b2',
    name: 'Dental Coverage Basic',
    type: 'dental',
    description: 'Preventive dental services coverage.',
    eligibility: 'All employees',
    status: 'active',
  },
  {
    id: 'b3',
    name: 'Vision Plan',
    type: 'vision',
    description: 'Vision exams and eyewear allowances.',
    eligibility: 'Full-time and part-time employees',
    status: 'inactive',
  },
];

export const seedAssignments: EmployeeBenefitAssignment[] = [
  {
    id: 'a1',
    employeeId: 'e1',
    benefitId: 'b1',
    startDate: '2025-01-01',
    endDate: null,
    status: 'active',
  },
  {
    id: 'a2',
    employeeId: 'e2',
    benefitId: 'b2',
    startDate: '2025-02-15',
    endDate: null,
    status: 'active',
  },
];
