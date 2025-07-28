export interface Department {
  id: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
    subtitle?: string
  subtitleAr?: string
}

export interface DepartmentFormData {
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
   subtitle?: string
  subtitleAr?: string
}

export interface DepartmentFormErrors {
  name?: string
  nameAr?: string
  description?: string
  descriptionAr?: string
   subtitle?: string
  subtitleAr?: string
}
