import type { Department } from '../types';

export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Human Resources',
    nameAr: 'الموارد البشرية',
    // subtitle: "People & Culture",
    // subtitleAr: "الأفراد والثقافة",
    description:
      'Manages employee relations, recruitment, and organizational development',
    descriptionAr: 'إدارة علاقات الموظفين والتوظيف والتطوير التنظيمي',
  },
  {
    id: '2',
    name: 'Information Technology',
    nameAr: 'تكنولوجيا المعلومات',
    // subtitle: "IT Services",
    // subtitleAr: "خدمات تقنية المعلومات",
    description:
      'Handles all technology infrastructure and software development',
    descriptionAr: 'إدارة جميع البنية التحتية التقنية وتطوير البرمجيات',
  },
  {
    id: '3',
    name: 'Finance',
    nameAr: 'المالية',
    // subtitle: "Financial Planning",
    // subtitleAr: "التخطيط المالي",
    description:
      'Manages financial planning, budgeting, and accounting operations',
    descriptionAr: 'إدارة التخطيط المالي والميزانية والعمليات المحاسبية',
  },
  {
    id: '4',
    name: 'Marketing',
    nameAr: 'التسويق',
    // subtitle: "Brand & Communications",
    // subtitleAr: "العلامة التجارية والاتصالات",
    description:
      'Develops marketing strategies and manages brand communications',
    descriptionAr: 'تطوير استراتيجيات التسويق وإدارة اتصالات العلامة التجارية',
  },
  {
    id: '5',
    name: 'Operations',
    nameAr: 'العمليات',
    // subtitle: "Business Operations",
    // subtitleAr: "العمليات التجارية",
    description: 'Oversees daily business operations and process optimization',
    descriptionAr: 'الإشراف على العمليات التجارية اليومية وتحسين العمليات',
  },
  {
    id: '6',
    name: 'Sales',
    nameAr: 'المبيعات',
    //subtitle: "Revenue Generation",
    // subtitleAr: "توليد الإيرادات",
    description: 'Manages customer relationships and revenue generation',
    descriptionAr: 'إدارة علاقات العملاء وتوليد الإيرادات',
  },
];
