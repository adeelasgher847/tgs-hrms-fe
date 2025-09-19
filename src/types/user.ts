export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  nameAr?: string;
}

export interface Designation {
  id: string;
  name: string;
  nameAr?: string;
  departmentId: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  designation: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: string;
  department: string;
  designation: string;
}

export interface UserFilters {
  department: string;
  designation: string;
  search: string;
}
