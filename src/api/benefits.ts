import { v4 as uuidv4 } from 'uuid';
import type {
  Benefit,
  BenefitFilters,
  EmployeeBenefitAssignment,
  PagedResult,
} from '../types/benefits';
import { seedBenefits, seedAssignments } from '../Data/benefits.ts';

let benefitsDb: Benefit[] = [...seedBenefits];
let assignmentsDb: EmployeeBenefitAssignment[] = [...seedAssignments];

function simulateLatency<T>(data: T, ms = 300): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

export async function listBenefits(
  filters: BenefitFilters
): Promise<PagedResult<Benefit>> {
  const {
    search = '',
    status = 'all',
    type = 'all',
    page = 1,
    pageSize = 10,
  } = filters;
  let items = benefitsDb.filter(
    b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
  );
  if (status !== 'all') items = items.filter(b => b.status === status);
  if (type !== 'all') items = items.filter(b => b.type === type);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return simulateLatency({ items: paged, page, pageSize, total });
}

export async function createBenefit(
  input: Omit<Benefit, 'id'>
): Promise<Benefit> {
  const newBenefit: Benefit = { id: uuidv4(), ...input };
  benefitsDb.unshift(newBenefit);
  return simulateLatency(newBenefit);
}

export async function updateBenefit(
  id: string,
  input: Partial<Omit<Benefit, 'id'>>
): Promise<Benefit> {
  const index = benefitsDb.findIndex(b => b.id === id);
  if (index === -1) throw new Error('Benefit not found');
  benefitsDb[index] = { ...benefitsDb[index], ...input };
  return simulateLatency(benefitsDb[index]);
}

export async function deactivateBenefit(id: string): Promise<Benefit> {
  return updateBenefit(id, { status: 'inactive' });
}

export async function listEmployeeBenefits(
  employeeId: string
): Promise<EmployeeBenefitAssignment[]> {
  const items = assignmentsDb.filter(a => a.employeeId === employeeId);
  return simulateLatency(items);
}

export async function assignBenefits(
  employeeId: string,
  benefitIds: string[],
  startDate: string
): Promise<EmployeeBenefitAssignment[]> {
  const created: EmployeeBenefitAssignment[] = benefitIds.map(benefitId => ({
    id: uuidv4(),
    employeeId,
    benefitId,
    startDate,
    endDate: null,
    status: 'scheduled',
  }));
  assignmentsDb = [...created, ...assignmentsDb];
  return simulateLatency(created);
}

export async function listAllBenefitAssignments(): Promise<
  EmployeeBenefitAssignment[]
> {
  return simulateLatency(assignmentsDb);
}

export function __resetBenefitsMock() {
  benefitsDb = [...seedBenefits];
  assignmentsDb = [...seedAssignments];
}
