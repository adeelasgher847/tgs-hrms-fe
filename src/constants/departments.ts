// Department and Designation constants
export interface Department {
  id: string;
  label: {
    en: string;
    ar: string;
  };
}

export interface Designation {
  id: string;
  label: {
    en: string;
    ar: string;
  };
}

export const DEPARTMENTS: Department[] = [
  { id: "hr", label: { en: "Human Resources", ar: "الموارد البشرية" } },
  { id: "eng", label: { en: "Engineering", ar: "الهندسة" } },
  { id: "sales", label: { en: "Sales", ar: "المبيعات" } },
];

export const DESIGNATIONS: Record<string, Designation[]> = {
  hr: [
    { id: "hr-mgr", label: { en: "HR Manager", ar: "مدير الموارد البشرية" } },
    { id: "hr-exec", label: { en: "HR Executive", ar: "تنفيذي الموارد البشرية" } },
  ],
  eng: [
    { id: "eng-fe", label: { en: "Frontend Engineer", ar: "مهندس الواجهة الأمامية" } },
    { id: "eng-be", label: { en: "Backend Engineer", ar: "مهندس الواجهة الخلفية" } },
  ],
  sales: [
    { id: "sales-ex", label: { en: "Sales Executive", ar: "تنفيذي المبيعات" } },
    { id: "sales-mgr", label: { en: "Sales Manager", ar: "مدير المبيعات" } },
  ],
};

// Helper functions
export const getDepartmentLabel = (id: string, language: 'en' | 'ar' = 'en'): string => {
  const dept = DEPARTMENTS.find(d => d.id === id);
  return dept ? dept.label[language] : '—';
};

export const getDesignationLabel = (id: string, language: 'en' | 'ar' = 'en'): string => {
  for (const deptDesignations of Object.values(DESIGNATIONS)) {
    const designation = deptDesignations.find(d => d.id === id);
    if (designation) {
      return designation.label[language];
    }
  }
  return '—';
};

export const getDepartmentById = (id: string): Department | undefined => {
  return DEPARTMENTS.find(d => d.id === id);
};

export const getDesignationById = (id: string): Designation | undefined => {
  for (const deptDesignations of Object.values(DESIGNATIONS)) {
    const designation = deptDesignations.find(d => d.id === id);
    if (designation) {
      return designation;
    }
  }
  return undefined;
};

export const getDesignationsByDepartment = (departmentId: string): Designation[] => {
  return DESIGNATIONS[departmentId] || [];
}; 