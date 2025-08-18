export interface Department {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export interface DepartmentFormData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export interface DepartmentFormErrors {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export interface Tenant {
  id: string;
  name: string;
  nameAr?: string;
}

export interface TenantFormData {
  name: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
