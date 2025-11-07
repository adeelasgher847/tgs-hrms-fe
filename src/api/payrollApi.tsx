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

export const payrollApi = {
  // Get payroll configuration
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
        return null; // Config doesn't exist yet
      }
      console.error('Failed to fetch payroll config:', error);
      throw error;
    }
  },

  // Create payroll configuration
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

  // Update payroll configuration
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

  // Employee Salary APIs
  // Create/Assign salary structure to employee
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

  // Get employee salary structure
  getEmployeeSalary: async (employeeId: string): Promise<EmployeeSalary> => {
    try {
      const response = await axiosInstance.get<EmployeeSalary>(
        `/payroll/salary/${employeeId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch employee salary:', error);
      throw error;
    }
  },

  // Update employee salary structure
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

  // Get employee salary history
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

  // Get all employees with salary structures
  getAllEmployeeSalaries: async (): Promise<
    Array<{
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
  > => {
    try {
      const response = await axiosInstance.get<
        Array<{
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
      >('/payroll/salary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all employee salaries:', error);
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
