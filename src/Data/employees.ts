export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
  phone?: string;
}

// Mock employee data - in a real app, this would come from an API
export const mockEmployees: Employee[] = [
  { 
    id: 'e1', 
    name: 'John Doe', 
    department: 'Engineering', 
    designation: 'Software Engineer',
    email: 'john.doe@company.com',
    phone: '+1-555-0101'
  },
  { 
    id: 'e2', 
    name: 'Jane Smith', 
    department: 'HR', 
    designation: 'HR Manager',
    email: 'jane.smith@company.com',
    phone: '+1-555-0102'
  },
  { 
    id: 'e3', 
    name: 'Mike Johnson', 
    department: 'Finance', 
    designation: 'Accountant',
    email: 'mike.johnson@company.com',
    phone: '+1-555-0103'
  },
  { 
    id: 'e4', 
    name: 'Sarah Wilson', 
    department: 'Engineering', 
    designation: 'Senior Engineer',
    email: 'sarah.wilson@company.com',
    phone: '+1-555-0104'
  },
  { 
    id: 'e5', 
    name: 'David Brown', 
    department: 'Marketing', 
    designation: 'Marketing Specialist',
    email: 'david.brown@company.com',
    phone: '+1-555-0105'
  },
];

// Helper function to get employee by ID
export const getEmployeeById = (id: string): Employee | undefined => {
  return mockEmployees.find(emp => emp.id === id);
};

// Helper function to get employee name by ID
export const getEmployeeName = (id: string): string => {
  const employee = getEmployeeById(id);
  return employee ? employee.name : `Employee ${id}`;
};

// Helper function to get employees by department
export const getEmployeesByDepartment = (department: string): Employee[] => {
  return mockEmployees.filter(emp => emp.department === department);
};
