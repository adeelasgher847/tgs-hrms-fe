import type { Department, Designation } from "../type/employee"

export const departments: Department[] = [
  { id: "hr", name: "Human Resources", nameAr: "الموارد البشرية" },
  { id: "it", name: "Information Technology", nameAr: "تكنولوجيا المعلومات" },
  { id: "finance", name: "Finance", nameAr: "المالية" },
  { id: "marketing", name: "Marketing", nameAr: "التسويق" },
  { id: "operations", name: "Operations", nameAr: "العمليات" },
  { id: "sales", name: "Sales", nameAr: "المبيعات" },
]

export const designations: Designation[] = [
  // HR Designations
  { id: "hr-manager", name: "HR Manager", nameAr: "مدير الموارد البشرية", departmentId: "hr" },
  { id: "hr-specialist", name: "HR Specialist", nameAr: "أخصائي موارد بشرية", departmentId: "hr" },
  { id: "recruiter", name: "Recruiter", nameAr: "مسؤول التوظيف", departmentId: "hr" },
  { id: "hr-assistant", name: "HR Assistant", nameAr: "مساعد موارد بشرية", departmentId: "hr" },

  // IT Designations
  { id: "it-manager", name: "IT Manager", nameAr: "مدير تكنولوجيا المعلومات", departmentId: "it" },
  { id: "software-engineer", name: "Software Engineer", nameAr: "مهندس برمجيات", departmentId: "it" },
  { id: "system-admin", name: "System Administrator", nameAr: "مدير النظام", departmentId: "it" },
  { id: "ui-ux-designer", name: "UI/UX Designer", nameAr: "مصمم واجهات المستخدم", departmentId: "it" },
  { id: "qa-engineer", name: "QA Engineer", nameAr: "مهندس ضمان الجودة", departmentId: "it" },

  // Finance Designations
  { id: "finance-manager", name: "Finance Manager", nameAr: "مدير المالية", departmentId: "finance" },
  { id: "accountant", name: "Accountant", nameAr: "محاسب", departmentId: "finance" },
  { id: "financial-analyst", name: "Financial Analyst", nameAr: "محلل مالي", departmentId: "finance" },
  { id: "accounts-payable", name: "Accounts Payable Clerk", nameAr: "كاتب الحسابات المستحقة", departmentId: "finance" },

  // Marketing Designations
  { id: "marketing-manager", name: "Marketing Manager", nameAr: "مدير التسويق", departmentId: "marketing" },
  {
    id: "digital-marketer",
    name: "Digital Marketing Specialist",
    nameAr: "أخصائي التسويق الرقمي",
    departmentId: "marketing",
  },
  { id: "content-creator", name: "Content Creator", nameAr: "منشئ المحتوى", departmentId: "marketing" },
  {
    id: "social-media",
    name: "Social Media Manager",
    nameAr: "مدير وسائل التواصل الاجتماعي",
    departmentId: "marketing",
  },

  // Operations Designations
  { id: "operations-manager", name: "Operations Manager", nameAr: "مدير العمليات", departmentId: "operations" },
  { id: "project-manager", name: "Project Manager", nameAr: "مدير المشروع", departmentId: "operations" },
  { id: "operations-analyst", name: "Operations Analyst", nameAr: "محلل العمليات", departmentId: "operations" },
  { id: "logistics-coordinator", name: "Logistics Coordinator", nameAr: "منسق اللوجستيات", departmentId: "operations" },

  // Sales Designations
  { id: "sales-manager", name: "Sales Manager", nameAr: "مدير المبيعات", departmentId: "sales" },
  { id: "sales-executive", name: "Sales Executive", nameAr: "تنفيذي مبيعات", departmentId: "sales" },
  { id: "account-manager", name: "Account Manager", nameAr: "مدير الحساب", departmentId: "sales" },
  { id: "sales-representative", name: "Sales Representative", nameAr: "مندوب مبيعات", departmentId: "sales" },
]
