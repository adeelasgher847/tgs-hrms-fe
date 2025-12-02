import axiosInstance from './axiosInstance';

export interface BasePayComponents {
  basic: number;
  houseRent: number;
  medical: number;
  transport: number;
}

export interface Allowance {
  type: string;
  amount: number;
  percentage: number;
  description?: string;
}

export interface EmployeeSalaryAllowance {
  type: string;
  amount: number;
  percentage: number;
  description?: string;
}

export interface EmployeeSalaryDeduction {
  type: string;
  amount: number;
  percentage: number;
  description?: string;
}

export interface Deductions {
  taxPercentage: number;
  insurancePercentage: number;
  providentFundPercentage: number;
}

export interface OvertimePolicy {
  enabled: boolean;
  rateMultiplier: number;
  maxHoursPerMonth: number;
}

export interface LeaveDeductionPolicy {
  unpaidLeaveDeduction: boolean;
  halfDayDeduction: number;
}

export interface PayrollConfig {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  tenant_id?: string;
  tenant?: {
    id: string;
    name: string;
    status: string;
    isDeleted: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  salaryCycle: 'monthly' | 'weekly' | 'biweekly';
  basePayComponents: BasePayComponents;
  allowances: Allowance[];
  deductions: Deductions;
  overtimePolicy: OvertimePolicy;
  leaveDeductionPolicy: LeaveDeductionPolicy;
  created_by?: string;
  updated_by?: string;
}

export interface CreatePayrollConfigRequest {
  salaryCycle: 'monthly' | 'weekly' | 'biweekly';
  basePayComponents: BasePayComponents;
  allowances: Allowance[];
  deductions: Deductions;
  overtimePolicy: OvertimePolicy;
  leaveDeductionPolicy: LeaveDeductionPolicy;
}

export type PayrollStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface PayrollOtherItem {
  type: string;
  amount: number;
  description?: string | null;
}

export interface PayrollSalaryBreakdown {
  baseSalary: number | string;
  allowances?: PayrollOtherItem[];
  totalAllowances?: number | string;
}

export interface PayrollDeductionsBreakdown {
  tax?: number | string;
  insurance?: number | string;
  leaveDeductions?: number | string;
  otherDeductions?: PayrollOtherItem[];
}

export interface PayrollBonusesBreakdown {
  performanceBonus?: number | string;
  overtimeBonus?: number | string;
  otherBonuses?: PayrollOtherItem[];
}

export interface PayrollRecord {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  employee_id: string;
  employee?: {
    id: string;
    user_id: string;
    designation_id: string;
    status: string;
    invite_status?: string;
    team_id?: string | null;
    cnic_number?: string | null;
    profile_picture?: string | null;
    cnic_picture?: string | null;
    cnic_back_picture?: string | null;
    created_at?: string;
    user?: {
      id: string;
      email: string;
      phone?: string;
      first_name: string;
      last_name: string;
      profile_pic?: string | null;
      role_id?: string;
      gender?: string | null;
      tenant_id?: string;
      created_at?: string;
      updated_at?: string;
    };
    department?: {
      id?: string;
      name?: string;
    };
    designation?: {
      id?: string;
      title?: string;
    };
  };
  month: number;
  year: number;
  grossSalary: number | string;
  salaryBreakdown?: PayrollSalaryBreakdown;
  totalDeductions: number | string;
  deductionsBreakdown?: PayrollDeductionsBreakdown;
  bonuses?: number | string;
  bonusesBreakdown?: PayrollBonusesBreakdown;
  netSalary: number | string;
  workingDays?: number;
  daysPresent?: number;
  daysAbsent?: number;
  paidLeaves?: number;
  unpaidLeaves?: number;
  overtimeHours?: number | string;
  generated_by?: string;
  generatedBy?: {
    id: string;
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  status: PayrollStatus;
  approved_by?: string | null;
  approvedBy?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  approved_at?: string | null;
  paid_at?: string | null;
  remarks?: string | null;
}

export interface PayrollSummary {
  month: number;
  year: number;
  totalGrossPayouts: number;
  totalDeductions: number;
  totalBonuses: number;
  totalNetPayouts: number;
  employeeCount: number;
  departmentCosts?: Array<{
    department: string;
    grossSalary: number;
    deductions: number;
    bonuses: number;
    netSalary: number;
    employeeCount: number;
  }>;
}

export interface PayrollMonthlyTrend {
  month: number;
  year: number;
  totalGross: number;
  totalDeductions: number;
  totalBonuses: number;
  totalNet: number;
  employeeCount: number;
}

export interface PayrollDepartmentComparison {
  department: string;
  totalGross: number;
  totalDeductions: number;
  totalBonuses: number;
  totalNet: number;
  employeeCount: number;
}

export interface PayrollStatistics {
  monthlyTrend: PayrollMonthlyTrend[];
  departmentComparison: PayrollDepartmentComparison[];
}

export const payrollApi = {
  getConfig: async (): Promise<PayrollConfig | null> => {
    try {
      const response =
        await axiosInstance.get<PayrollConfig>('/payroll/config');
      return response.data;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return null;
      }
      console.error('Failed to fetch payroll config:', error);
      throw error;
    }
  },

  createConfig: async (
    data: CreatePayrollConfigRequest
  ): Promise<PayrollConfig> => {
    try {
      const response = await axiosInstance.post<PayrollConfig>(
        '/payroll/config',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create payroll config:', error);
      throw error;
    }
  },

  updateConfig: async (
    data: CreatePayrollConfigRequest
  ): Promise<PayrollConfig> => {
    try {
      const response = await axiosInstance.put<PayrollConfig>(
        '/payroll/config',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update payroll config:', error);
      throw error;
    }
  },

  createEmployeeSalary: async (data: {
    employee_id: string;
    baseSalary: number;
    allowances: EmployeeSalaryAllowance[];
    deductions: EmployeeSalaryDeduction[];
    effectiveDate: string;
    endDate?: string;
    status: 'active' | 'inactive';
    notes?: string;
  }): Promise<EmployeeSalary> => {
    try {
      const response = await axiosInstance.post<EmployeeSalary>(
        '/payroll/salary',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create employee salary:', error);
      throw error;
    }
  },

  getEmployeeSalary: async (
    employeeId: string
  ): Promise<EmployeeSalaryResponse> => {
    try {
      const response = await axiosInstance.get<EmployeeSalaryResponse>(
        `/payroll/salary/${employeeId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch employee salary:', error);
      throw error;
    }
  },

  updateEmployeeSalary: async (
    employeeId: string,
    data: {
      baseSalary: number;
      allowances: EmployeeSalaryAllowance[];
      deductions: EmployeeSalaryDeduction[];
      effectiveDate: string;
      endDate?: string;
      status: 'active' | 'inactive';
      notes?: string;
    }
  ): Promise<EmployeeSalary> => {
    try {
      const response = await axiosInstance.put<EmployeeSalary>(
        `/payroll/salary/${employeeId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update employee salary:', error);
      throw error;
    }
  },

  getEmployeeSalaryHistory: async (
    employeeId: string
  ): Promise<EmployeeSalary[]> => {
    try {
      const response = await axiosInstance.get<EmployeeSalary[]>(
        `/payroll/salary/${employeeId}/history`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch employee salary history:', error);
      throw error;
    }
  },

  getAllEmployeeSalaries: async (params?: {
    page?: number | null;
    limit?: number;
  }): Promise<{
    items: Array<{
      employee: {
        id: string;
        user: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          profile_pic: string | null;
        };
        designation: {
          id: string;
          title: string;
        };
        department: {
          id: string;
          name: string;
        };
        team: { id: string; name: string } | null;
        status: string;
      };
      salary: EmployeeSalary | null;
    }>;
    total?: number;
    page?: number;
    totalPages?: number;
  }> => {
    try {
      const requestParams: Record<string, string | number> = {};
      if (params?.page !== undefined && params.page !== null) {
        requestParams.page = params.page;
        requestParams.limit = params.limit ?? 25;
      }

      const response = await axiosInstance.get<
        | Array<{
            employee: {
              id: string;
              user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string;
                profile_pic: string | null;
              };
              designation: {
                id: string;
                title: string;
              };
              department: {
                id: string;
                name: string;
              };
              team: { id: string; name: string } | null;
              status: string;
            };
            salary: EmployeeSalary | null;
          }>
        | {
            items: Array<{
              employee: {
                id: string;
                user: {
                  id: string;
                  first_name: string;
                  last_name: string;
                  email: string;
                  profile_pic: string | null;
                };
                designation: {
                  id: string;
                  title: string;
                };
                department: {
                  id: string;
                  name: string;
                };
                team: { id: string; name: string } | null;
                status: string;
              };
              salary: EmployeeSalary | null;
            }>;
            total?: number;
            page?: number;
            totalPages?: number;
          }
      >('/payroll/salary', { params: requestParams });

      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          totalPages: 1,
        };
      } else if (response.data && typeof response.data === 'object') {
        return {
          items: response.data.items || [],
          total: response.data.total,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
        };
      }
      return { items: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Failed to fetch all employee salaries:', error);
      throw error;
    }
  },

  generatePayroll: async (params: {
    month: number;
    year: number;
    tenantId?: string;
    employeeId?: string;
    employee_id?: string;
  }): Promise<PayrollRecord[]> => {
    try {
      const query: Record<string, string | number> = {
        month: params.month,
        year: params.year,
      };
      if (params.tenantId) {
        query.tenantId = params.tenantId;
      }
      const employeeId = params.employee_id || params.employeeId;
      if (employeeId) {
        query.employee_id = employeeId;
      }

      const response = await axiosInstance.post<PayrollRecord[]>(
        '/payroll/generate',
        undefined,
        {
          params: query,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      throw error;
    }
  },

  getPayrollRecords: async (params: {
    month: number;
    year: number;
    tenant_id?: string;
    employee_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: PayrollRecord[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> => {
    try {
      const query: Record<string, string | number> = {
        month: params.month,
        year: params.year,
      };
      if (params.tenant_id) {
        query.tenant_id = params.tenant_id;
      }
      if (params.employee_id) {
        query.employee_id = params.employee_id;
      }
      if (params.page !== undefined && params.page !== null) {
        query.page = params.page;
        query.limit = params.limit ?? 25;
      } else {
        query.page = 1;
        query.limit = params.limit ?? 25;
      }

      console.log('Payroll API request params:', query);

      const response = await axiosInstance.get<
        | PayrollRecord[]
        | {
            items: PayrollRecord[];
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
          }
      >('/payroll', { params: query });

      console.log('Payroll API raw response:', {
        isArray: Array.isArray(response.data),
        dataType: typeof response.data,
        hasItems: !!(response.data as { items?: unknown[] })?.items,
        itemsLength: Array.isArray(response.data)
          ? response.data.length
          : (response.data as { items?: unknown[] })?.items?.length || 0,
        total: (response.data as { total?: number })?.total,
        totalPages: (response.data as { totalPages?: number })?.totalPages,
        page: (response.data as { page?: number })?.page,
        limit: (response.data as { limit?: number })?.limit,
      });

      if (Array.isArray(response.data)) {
        const itemsCount = response.data.length;
        const limit = (query.limit as number) || 25;
        return {
          items: response.data,
          total: itemsCount,
          page: 1,
          totalPages: Math.ceil(itemsCount / limit),
        };
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as {
          items?: PayrollRecord[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        const items = data.items || [];
        const total = data.total ?? items.length;
        const limit = data.limit ?? (query.limit as number) ?? 25;
        const page = data.page ?? 1;
        const totalPages = data.totalPages ?? Math.ceil(total / limit);

        console.log('Processed pagination response:', {
          itemsCount: items.length,
          total,
          page,
          limit,
          totalPages,
        });

        return {
          items,
          total,
          page,
          totalPages,
        };
      }
      return { items: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Failed to fetch payroll records:', error);
      throw error;
    }
  },

  getPayrollHistory: async (
    employeeId: string,
    params?: { page?: number | null; limit?: number }
  ): Promise<{
    items: PayrollRecord[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> => {
    try {
      const requestParams: Record<string, string | number> = {};
      if (params?.page !== undefined && params.page !== null) {
        requestParams.page = params.page;
        requestParams.limit = params.limit ?? 25;
      }

      const response = await axiosInstance.get<
        | PayrollRecord[]
        | {
            items: PayrollRecord[];
            total?: number;
            page?: number;
            totalPages?: number;
          }
      >(`/payroll/employee/${employeeId}/history`, { params: requestParams });

      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          totalPages: 1,
        };
      } else if (response.data && typeof response.data === 'object') {
        return {
          items: response.data.items || [],
          total: response.data.total,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
        };
      }
      return { items: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Failed to fetch payroll history:', error);
      throw error;
    }
  },

  updatePayrollStatus: async (
    id: string,
    data: { status: PayrollStatus; remarks?: string }
  ): Promise<PayrollRecord> => {
    try {
      const response = await axiosInstance.put<PayrollRecord>(
        `/payroll/${id}/status`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update payroll status:', error);
      throw error;
    }
  },

  getPayrollPayslip: async (id: string): Promise<PayrollRecord> => {
    try {
      const response = await axiosInstance.get<PayrollRecord>(
        `/payroll/${id}/payslip`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payroll payslip:', error);
      throw error;
    }
  },

  getPayrollSummary: async (params: {
    month: number;
    year: number;
    tenantId?: string;
  }): Promise<PayrollSummary> => {
    try {
      const response = await axiosInstance.get<PayrollSummary>(
        '/payroll/summary',
        {
          params: {
            month: params.month,
            year: params.year,
            tenant_id: params.tenantId,
            tenantId: params.tenantId,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payroll summary:', error);
      throw error;
    }
  },

  getPayrollStatistics: async (params: {
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PayrollStatistics> => {
    try {
      interface StatisticsItem {
        tenantId?: string;
        monthlyTrend?: Array<{
          month: number;
          year: number;
          totalGross: number;
          totalDeductions: number;
          totalBonuses: number;
          totalNet: number;
          employeeCount: number;
        }>;
        departmentComparison?: Array<{
          department: string;
          totalGross: number;
          totalDeductions: number;
          totalBonuses: number;
          totalNet: number;
          employeeCount: number;
        }>;
      }

      const response = await axiosInstance.get<
        | PayrollStatistics
        | {
            statistics: StatisticsItem[];
          }
      >('/payroll/statistics', {
        params: {
          ...(params.tenantId && { tenantId: params.tenantId }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
        },
      });

      if (
        response.data &&
        typeof response.data === 'object' &&
        'statistics' in response.data &&
        Array.isArray(response.data.statistics) &&
        response.data.statistics.length > 0
      ) {
        if (params.tenantId) {
          const filteredStat = response.data.statistics.find(
            (stat: StatisticsItem) => stat.tenantId === params.tenantId
          );
          if (filteredStat) {
            return {
              monthlyTrend: filteredStat.monthlyTrend || [],
              departmentComparison: filteredStat.departmentComparison || [],
            };
          } else {
            return {
              monthlyTrend: [],
              departmentComparison: [],
            };
          }
        } else {
          interface MonthlyTrendItem {
            month: number;
            year: number;
            totalGross: number;
            totalDeductions: number;
            totalBonuses: number;
            totalNet: number;
            employeeCount: number;
          }

          interface DepartmentComparisonItem {
            department: string;
            totalGross: number;
            totalDeductions: number;
            totalBonuses: number;
            totalNet: number;
            employeeCount: number;
          }

          const aggregatedMonthlyTrend = new Map<string, MonthlyTrendItem>();
          const aggregatedDepartmentComparison = new Map<
            string,
            DepartmentComparisonItem
          >();

          response.data.statistics.forEach((stat: StatisticsItem) => {
            if (Array.isArray(stat.monthlyTrend)) {
              stat.monthlyTrend.forEach(trend => {
                const key = `${trend.year}-${trend.month}`;
                if (aggregatedMonthlyTrend.has(key)) {
                  const existing = aggregatedMonthlyTrend.get(key);
                  if (existing) {
                    existing.totalGross += Number(trend.totalGross) || 0;
                    existing.totalDeductions +=
                      Number(trend.totalDeductions) || 0;
                    existing.totalBonuses += Number(trend.totalBonuses) || 0;
                    existing.totalNet += Number(trend.totalNet) || 0;
                    existing.employeeCount += Number(trend.employeeCount) || 0;
                  }
                } else {
                  aggregatedMonthlyTrend.set(key, {
                    month: trend.month,
                    year: trend.year,
                    totalGross: Number(trend.totalGross) || 0,
                    totalDeductions: Number(trend.totalDeductions) || 0,
                    totalBonuses: Number(trend.totalBonuses) || 0,
                    totalNet: Number(trend.totalNet) || 0,
                    employeeCount: Number(trend.employeeCount) || 0,
                  });
                }
              });
            }

            if (Array.isArray(stat.departmentComparison)) {
              stat.departmentComparison.forEach(dept => {
                const deptName = dept.department?.trim() || '';
                if (deptName) {
                  if (aggregatedDepartmentComparison.has(deptName)) {
                    const existing =
                      aggregatedDepartmentComparison.get(deptName);
                    if (existing) {
                      existing.totalGross += Number(dept.totalGross) || 0;
                      existing.totalDeductions +=
                        Number(dept.totalDeductions) || 0;
                      existing.totalBonuses += Number(dept.totalBonuses) || 0;
                      existing.totalNet += Number(dept.totalNet) || 0;
                      existing.employeeCount += Number(dept.employeeCount) || 0;
                    }
                  } else {
                    aggregatedDepartmentComparison.set(deptName, {
                      department: deptName,
                      totalGross: Number(dept.totalGross) || 0,
                      totalDeductions: Number(dept.totalDeductions) || 0,
                      totalBonuses: Number(dept.totalBonuses) || 0,
                      totalNet: Number(dept.totalNet) || 0,
                      employeeCount: Number(dept.employeeCount) || 0,
                    });
                  }
                }
              });
            }
          });

          return {
            monthlyTrend: Array.from(aggregatedMonthlyTrend.values()).sort(
              (a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
              }
            ),
            departmentComparison: Array.from(
              aggregatedDepartmentComparison.values()
            ),
          };
        }
      }

      if (
        response.data &&
        typeof response.data === 'object' &&
        ('monthlyTrend' in response.data ||
          'departmentComparison' in response.data)
      ) {
        return {
          monthlyTrend: (response.data as PayrollStatistics).monthlyTrend || [],
          departmentComparison:
            (response.data as PayrollStatistics).departmentComparison || [],
        };
      }

      return {
        monthlyTrend: [],
        departmentComparison: [],
      };
    } catch (error) {
      console.error('Failed to fetch payroll statistics:', error);
      throw error;
    }
  },
};

export interface EmployeeSalary {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  employee_id: string;
  employee?: {
    id: string;
    user_id: string;
    designation_id: string;
    status: string;
    invite_status: string;
    team_id: string | null;
    cnic_number: string | null;
    profile_picture: string | null;
    cnic_picture: string | null;
    cnic_back_picture: string | null;
    created_at: string;
    user: {
      id: string;
      email: string;
      phone: string;
      first_name: string;
      last_name: string;
      profile_pic: string | null;
      role_id: string;
      gender: string;
      tenant_id: string;
      created_at: string;
      updated_at: string;
    };
  };
  baseSalary: number | string;
  allowances: EmployeeSalaryAllowance[];
  deductions: EmployeeSalaryDeduction[];
  effectiveDate: string;
  endDate?: string | null;
  status: 'active' | 'inactive';
  notes?: string | null;
  created_by?: string;
  updated_by?: string | null;
}

export interface EmployeeSalaryDefaults {
  baseSalary: number;
  allowances: EmployeeSalaryAllowance[];
  deductions: EmployeeSalaryDeduction[];
  effectiveDate: string;
}

export interface EmployeeSalaryResponse {
  salary: EmployeeSalary | null;
  defaults: EmployeeSalaryDefaults;
}
