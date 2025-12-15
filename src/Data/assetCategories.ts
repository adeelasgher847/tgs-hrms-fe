import type { AssetCategory } from '../types/asset';

// Comprehensive Asset Categories with Subcategories
export interface AssetCategoryWithSubcategories extends AssetCategory {
  subcategories?: string[];
  color?: string;
  description: string;
}

export const assetCategories: AssetCategoryWithSubcategories[] = [
  {
    id: 'it-equipment',
    name: 'IT Equipment',
    nameAr: 'معدات تقنية المعلومات',
    color: '#1976d2',
    description: 'Most common and high-value assets in most organizations',
    subcategories: [
      'Laptop',
      'Desktop',
      'Monitor',
      'Keyboard',
      'Mouse',
      'Docking Station',
      'Headphones',
      'Mic',
      'Webcams',
      'Printers',
      'Scanners',
      'Projectors',
      'Display Screens',
      'Tablets',
      'iPads',
      'Network Devices (Routers, Switches, Access Points)',
    ],
  },
  {
    id: 'software-licenses',
    name: 'Software & Licenses',
    nameAr: 'البرمجيات والتراخيص',
    color: '#388e3c',
    description: 'Software-related resources and licenses',
    subcategories: [
      'Operating System License (Windows, macOS)',
      'Productivity Tools (MS Office, Google Workspace, Notion, Slack)',
      'Design Software (Figma, Adobe Suite, Sketch)',
      'Development Tools (GitHub, JetBrains, Visual Studio, Postman)',
      'Cloud Accounts (AWS, Azure, GCP credits)',
      'Antivirus / Security Subscriptions',
    ],
  },
  {
    id: 'office-equipment',
    name: 'Office Equipment',
    nameAr: 'معدات المكتب',
    color: '#f57c00',
    description: 'Physical workplace items and furniture',
    subcategories: [
      'Chairs',
      'Desks',
      'Monitors',
      'Stands',
      'Whiteboards',
      'Projectors',
      'Stationery Items',
      'Filing Cabinets',
      'Lighting Equipment',
    ],
  },
  {
    id: 'mobility-transport',
    name: 'Mobility / Transport',
    nameAr: 'النقل والتنقل',
    color: '#7b1fa2',
    description: 'For field staff or logistics tracking',
    subcategories: [
      'Company Vehicle',
      'Car',
      'Bike',
      'Fuel Card',
      'Transport Pass',
      'GPS Devices',
    ],
  },
  {
    id: 'employee-accessories',
    name: 'Employee Accessories',
    nameAr: 'إكسسوارات الموظفين',
    color: '#d32f2f',
    description: 'Personal-use but company-owned assets',
    subcategories: [
      'ID Cards',
      'Access Badges',
      'Uniforms',
      'Safety Gear',
      'Power Banks',
      'Cables',
      'USB Drives',
    ],
  },
  {
    id: 'facility-assets',
    name: 'Facility Assets',
    nameAr: 'أصول المرافق',
    color: '#5d4037',
    description: 'Shared or fixed office infrastructure',
    subcategories: [
      'Air Conditioners',
      'Heaters',
      'CCTV Cameras',
      'Biometric Devices',
      'UPS',
      'Power Units',
      'Office Furniture Sets',
    ],
  },
  {
    id: 'health-safety',
    name: 'Health & Safety',
    nameAr: 'الصحة والسلامة',
    color: '#c2185b',
    description: 'For companies with on-site or field staff',
    subcategories: [
      'First Aid Kits',
      'Safety Helmets',
      'Gloves',
      'Vests',
      'Fire Extinguishers',
      'Medical Devices',
      'Kits',
    ],
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous / Custom',
    nameAr: 'متنوع / مخصص',
    color: '#607d8b',
    description: 'Flexible category for tenant-specific assets',
    subcategories: [
      'Promotional Materials',
      'Event Equipment',
      'Training Devices',
      'Other (custom-defined by admin)',
    ],
  },
];

// Helper function to get category by ID
export const getCategoryById = (
  id: string
): AssetCategoryWithSubcategories | undefined => {
  return assetCategories.find(category => category.id === id);
};

// Helper function to get all subcategories for a category
export const getSubcategoriesByCategoryId = (categoryId: string): string[] => {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
};

// Helper function to search categories by name or subcategory
export const searchCategories = (
  searchTerm: string
): AssetCategoryWithSubcategories[] => {
  const term = searchTerm.toLowerCase();
  return assetCategories.filter(
    category =>
      category.name.toLowerCase().includes(term) ||
      category.nameAr.toLowerCase().includes(term) ||
      category.subcategories?.some(sub => sub.toLowerCase().includes(term))
  );
};

// Helper function to get category statistics
export const getCategoryStatistics = () => {
  return {
    totalCategories: assetCategories.length,
    totalSubcategories: assetCategories.reduce(
      (sum, cat) => sum + (cat.subcategories?.length || 0),
      0
    ),
    categoriesWithSubcategories: assetCategories.filter(
      cat => cat.subcategories && cat.subcategories.length > 0
    ).length,
  };
};

// Export for backward compatibility - converts to simple AssetCategory format
export const simpleAssetCategories: AssetCategory[] = assetCategories.map(
  cat => ({
    id: cat.id,
    name: cat.name,
    nameAr: cat.nameAr,
    description: cat.description,
  })
);

// Export all subcategories as flat list for easy selection
export const allSubcategories: string[] = assetCategories.flatMap(
  cat => cat.subcategories || []
);

// Export category options for dropdowns
export const categoryOptions = assetCategories.map(cat => ({
  value: cat.id,
  label: cat.name,
  description: cat.description,
  subcategories: cat.subcategories,
}));
