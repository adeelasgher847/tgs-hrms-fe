export interface Department {
    id: string
    name: string
    nameAr: string
  }
  
  export interface Designation {
    id: string
    name: string
    nameAr: string
    departmentId: string
  }
  
  export interface FormData {
    department: string
    designation: string
  }
  
  export interface FormErrors {
    department?: string
    designation?: string
  }
  