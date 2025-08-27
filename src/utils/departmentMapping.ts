import { designationApiService } from '../api/designationApi';
import type { BackendDesignation, BackendDepartment } from '../api/designationApi';

// Cache for department and designation mappings
let departmentCache: BackendDepartment[] = [];
let designationCache: BackendDesignation[] = [];
let cacheInitialized = false;

// Initialize cache with all departments and designations
export const initializeDepartmentCache = async (): Promise<void> => {
  if (cacheInitialized) return;
  
  try {
    // Fetch all departments
    departmentCache = await designationApiService.getAllDepartments();
    
    // Fetch all designations
    designationCache = await designationApiService.getAllDesignations();
    
    cacheInitialized = true;
    console.log('Department cache initialized:', {
      departments: departmentCache.length,
      designations: designationCache.length
    });
  } catch (error) {
    console.error('Error initializing department cache:', error);
    // Use fallback data if API fails
    departmentCache = [
      { id: '1', name: 'Human Resources', description: 'HR Department', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', name: 'Information Technology', description: 'IT Department', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '3', name: 'Finance & Accounting', description: 'Finance Department', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '4', name: 'Marketing & Sales', description: 'Marketing Department', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '5', name: 'Operations & Logistics', description: 'Operations Department', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    
    designationCache = [
      { id: '1', title: 'Frontend Web Developer', departmentId: '2', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', title: 'Backend .Net Developer', departmentId: '2', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '3', title: 'UI/UX Designer', departmentId: '2', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '4', title: 'QA Engineer', departmentId: '2', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '5', title: 'DevOps Engineer', departmentId: '2', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '6', title: 'HR Manager', departmentId: '1', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '7', title: 'HR Specialist', departmentId: '1', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '8', title: 'Financial Analyst', departmentId: '3', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '9', title: 'Accountant', departmentId: '3', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '10', title: 'Marketing Manager', departmentId: '4', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '11', title: 'Sales Representative', departmentId: '4', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '12', title: 'Operations Manager', departmentId: '5', tenantId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    
    cacheInitialized = true;
  }
};

// Get department by designation ID
export const getDepartmentByDesignationId = (designationId: string): BackendDepartment | null => {
  const designation = designationCache.find(d => d.id === designationId);
  if (!designation) return null;
  
  const department = departmentCache.find(d => d.id === designation.departmentId);
  return department || null;
};

// Get department by designation title
export const getDepartmentByDesignationTitle = (designationTitle: string): BackendDepartment | null => {
  const designation = designationCache.find(d => 
    d.title.toLowerCase() === designationTitle.toLowerCase()
  );
  if (!designation) return null;
  
  const department = departmentCache.find(d => d.id === designation.departmentId);
  return department || null;
};

// Get all departments
export const getAllDepartments = (): BackendDepartment[] => {
  return departmentCache;
};

// Get all designations
export const getAllDesignations = (): BackendDesignation[] => {
  return designationCache;
};

// Refresh cache
export const refreshDepartmentCache = async (): Promise<void> => {
  cacheInitialized = false;
  await initializeDepartmentCache();
};
