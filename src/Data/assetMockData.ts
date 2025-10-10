import type { Asset, AssetCategory, AssetRequest, MockUser, AssetStatistics } from '../types/asset';

// Mock Asset Categories
export const mockAssetCategories: AssetCategory[] = [
  { id: '1', name: 'Laptop', nameAr: 'جهاز كمبيوتر محمول', description: 'Portable computers' },
  { id: '2', name: 'Desktop Computer', nameAr: 'جهاز كمبيوتر مكتبي', description: 'Desktop computers' },
  { id: '3', name: 'Monitor', nameAr: 'شاشة', description: 'Computer monitors' },
  { id: '4', name: 'Printer', nameAr: 'طابعة', description: 'Printing devices' },
  { id: '5', name: 'Phone', nameAr: 'هاتف', description: 'Mobile and desk phones' },
  { id: '6', name: 'Tablet', nameAr: 'جهاز لوحي', description: 'Tablet devices' },
  { id: '7', name: 'Projector', nameAr: 'جهاز عرض', description: 'Presentation projectors' },
  { id: '8', name: 'Camera', nameAr: 'كاميرا', description: 'Digital cameras' },
  { id: '9', name: 'Headset', nameAr: 'سماعات', description: 'Audio headsets' },
  { id: '10', name: 'Office Furniture', nameAr: 'أثاث مكتبي', description: 'Desks, chairs, etc.' },
];

// Mock Users
export const mockUsers: MockUser[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'IT' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'HR' },
  { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Finance' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'Marketing' },
  { id: '5', name: 'David Brown', email: 'david.brown@company.com', department: 'Operations' },
  { id: '6', name: 'Lisa Davis', email: 'lisa.davis@company.com', department: 'IT' },
  { id: '7', name: 'Tom Anderson', email: 'tom.anderson@company.com', department: 'Sales' },
  { id: '8', name: 'Emma Taylor', email: 'emma.taylor@company.com', department: 'Legal' },
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Dell Latitude 5520',
    category: mockAssetCategories[0],
    status: 'assigned',
    assignedTo: '1',
    assignedToName: 'John Doe',
    serialNumber: 'DL001234567',
    purchaseDate: '2023-01-15T00:00:00Z',
    warrantyExpiry: '2025-01-15T00:00:00Z',
    location: 'Office Floor 2',
    description: 'High-performance business laptop',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'HP EliteDesk 800',
    category: mockAssetCategories[1],
    status: 'available',
    serialNumber: 'HP001234568',
    purchaseDate: '2023-02-10T00:00:00Z',
    warrantyExpiry: '2025-02-10T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Desktop workstation',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-02-10T00:00:00Z',
  },
  {
    id: '3',
    name: 'Samsung 27" Monitor',
    category: mockAssetCategories[2],
    status: 'assigned',
    assignedTo: '2',
    assignedToName: 'Jane Smith',
    serialNumber: 'SM001234569',
    purchaseDate: '2023-03-05T00:00:00Z',
    warrantyExpiry: '2025-03-05T00:00:00Z',
    location: 'HR Office',
    description: '4K Ultra HD monitor',
    createdAt: '2023-03-05T00:00:00Z',
    updatedAt: '2023-03-05T00:00:00Z',
  },
  {
    id: '4',
    name: 'Canon PIXMA Printer',
    category: mockAssetCategories[3],
    status: 'under_maintenance',
    serialNumber: 'CN001234570',
    purchaseDate: '2022-12-01T00:00:00Z',
    warrantyExpiry: '2024-12-01T00:00:00Z',
    location: 'Main Office',
    description: 'All-in-one printer',
    createdAt: '2022-12-01T00:00:00Z',
    updatedAt: '2023-11-20T00:00:00Z',
  },
  {
    id: '5',
    name: 'iPhone 14 Pro',
    category: mockAssetCategories[4],
    status: 'assigned',
    assignedTo: '3',
    assignedToName: 'Mike Johnson',
    serialNumber: 'IP001234571',
    purchaseDate: '2023-04-15T00:00:00Z',
    warrantyExpiry: '2024-04-15T00:00:00Z',
    location: 'Finance Department',
    description: 'Company mobile phone',
    createdAt: '2023-04-15T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
  },
  {
    id: '6',
    name: 'iPad Air',
    category: mockAssetCategories[5],
    status: 'available',
    serialNumber: 'IP001234572',
    purchaseDate: '2023-05-20T00:00:00Z',
    warrantyExpiry: '2024-05-20T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Tablet for presentations',
    createdAt: '2023-05-20T00:00:00Z',
    updatedAt: '2023-05-20T00:00:00Z',
  },
  {
    id: '7',
    name: 'Epson Projector',
    category: mockAssetCategories[6],
    status: 'retired',
    serialNumber: 'EP001234573',
    purchaseDate: '2020-08-10T00:00:00Z',
    warrantyExpiry: '2022-08-10T00:00:00Z',
    location: 'Storage',
    description: 'Conference room projector (end of life)',
    createdAt: '2020-08-10T00:00:00Z',
    updatedAt: '2023-10-01T00:00:00Z',
  },
  {
    id: '8',
    name: 'Logitech Webcam',
    category: mockAssetCategories[7],
    status: 'available',
    serialNumber: 'LG001234574',
    purchaseDate: '2023-06-01T00:00:00Z',
    warrantyExpiry: '2024-06-01T00:00:00Z',
    location: 'IT Storage Room',
    description: 'HD webcam for remote work',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
  },
  {
    id: '9',
    name: 'Dell Latitude 5520',
    category: mockAssetCategories[0],
    status: 'available',
    serialNumber: 'DL001234575',
    purchaseDate: '2023-07-15T00:00:00Z',
    warrantyExpiry: '2025-07-15T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Business laptop with 16GB RAM',
    createdAt: '2023-07-15T00:00:00Z',
    updatedAt: '2023-07-15T00:00:00Z',
  },
  {
    id: '10',
    name: 'Lenovo ThinkCentre M920',
    category: mockAssetCategories[1],
    status: 'available',
    serialNumber: 'LV001234576',
    purchaseDate: '2023-08-20T00:00:00Z',
    warrantyExpiry: '2025-08-20T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Compact desktop computer',
    createdAt: '2023-08-20T00:00:00Z',
    updatedAt: '2023-08-20T00:00:00Z',
  },
  {
    id: '11',
    name: 'LG 24" Monitor',
    category: mockAssetCategories[2],
    status: 'available',
    serialNumber: 'LG001234577',
    purchaseDate: '2023-09-10T00:00:00Z',
    warrantyExpiry: '2025-09-10T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Full HD monitor for office use',
    createdAt: '2023-09-10T00:00:00Z',
    updatedAt: '2023-09-10T00:00:00Z',
  },
  {
    id: '12',
    name: 'HP LaserJet Pro',
    category: mockAssetCategories[3],
    status: 'available',
    serialNumber: 'HP001234578',
    purchaseDate: '2023-10-05T00:00:00Z',
    warrantyExpiry: '2025-10-05T00:00:00Z',
    location: 'IT Storage Room',
    description: 'High-speed laser printer',
    createdAt: '2023-10-05T00:00:00Z',
    updatedAt: '2023-10-05T00:00:00Z',
  },
  {
    id: '13',
    name: 'Samsung Galaxy S23',
    category: mockAssetCategories[4],
    status: 'available',
    serialNumber: 'SM001234579',
    purchaseDate: '2023-11-01T00:00:00Z',
    warrantyExpiry: '2024-11-01T00:00:00Z',
    location: 'IT Storage Room',
    description: 'Latest Android smartphone',
    createdAt: '2023-11-01T00:00:00Z',
    updatedAt: '2023-11-01T00:00:00Z',
  },
  {
    id: '14',
    name: 'Microsoft Surface Pro',
    category: mockAssetCategories[5],
    status: 'available',
    serialNumber: 'MS001234580',
    purchaseDate: '2023-11-15T00:00:00Z',
    warrantyExpiry: '2025-11-15T00:00:00Z',
    location: 'IT Storage Room',
    description: '2-in-1 tablet laptop',
    createdAt: '2023-11-15T00:00:00Z',
    updatedAt: '2023-11-15T00:00:00Z',
  },
];

// Mock Asset Requests
export const mockAssetRequests: AssetRequest[] = [
  {
    id: '1',
    employeeId: '4',
    employeeName: 'Sarah Wilson',
    category: mockAssetCategories[0],
    remarks: 'Need laptop for remote work setup',
    status: 'pending',
    requestedDate: '2023-12-01T10:00:00Z',
  },
  {
    id: '2',
    employeeId: '5',
    employeeName: 'David Brown',
    category: mockAssetCategories[2],
    remarks: 'Current monitor is not working properly',
    status: 'approved',
    requestedDate: '2023-11-28T14:30:00Z',
    processedDate: '2023-11-29T09:15:00Z',
    processedBy: '1',
    processedByName: 'John Doe',
    assignedAssetId: '3',
    assignedAssetName: 'Samsung 27" Monitor',
  },
  {
    id: '3',
    employeeId: '6',
    employeeName: 'Lisa Davis',
    category: mockAssetCategories[4],
    remarks: 'Need mobile phone for field work',
    status: 'rejected',
    requestedDate: '2023-11-25T16:45:00Z',
    processedDate: '2023-11-26T11:20:00Z',
    processedBy: '1',
    processedByName: 'John Doe',
    rejectionReason: 'Budget constraints for this quarter',
  },
  {
    id: '4',
    employeeId: '7',
    employeeName: 'Tom Anderson',
    category: mockAssetCategories[5],
    remarks: 'Tablet needed for client presentations',
    status: 'pending',
    requestedDate: '2023-12-02T08:30:00Z',
  },
  {
    id: '5',
    employeeId: '8',
    employeeName: 'Emma Taylor',
    category: mockAssetCategories[3],
    remarks: 'Printer needed for legal document printing',
    status: 'cancelled',
    requestedDate: '2023-11-20T13:15:00Z',
    processedDate: '2023-11-21T10:00:00Z',
  },
];

// Helper functions
export const getAssetById = (id: string): Asset | undefined => {
  return mockAssets.find(asset => asset.id === id);
};

export const getAssetsByStatus = (status: string): Asset[] => {
  return mockAssets.filter(asset => asset.status === status);
};

export const getAssetsByCategory = (categoryId: string): Asset[] => {
  return mockAssets.filter(asset => asset.category.id === categoryId);
};

export const getAvailableAssetsByCategory = (categoryId: string): Asset[] => {
  return mockAssets.filter(asset => 
    asset.category.id === categoryId && asset.status === 'available'
  );
};

export const getRequestById = (id: string): AssetRequest | undefined => {
  return mockAssetRequests.find(request => request.id === id);
};

export const getRequestsByStatus = (status: string): AssetRequest[] => {
  return mockAssetRequests.filter(request => request.status === status);
};

export const getRequestsByEmployee = (employeeId: string): AssetRequest[] => {
  return mockAssetRequests.filter(request => request.employeeId === employeeId);
};

// Statistics
export const getAssetStatistics = (): AssetStatistics => {
  const totalAssets = mockAssets.length;
  const availableAssets = mockAssets.filter(a => a.status === 'available').length;
  const assignedAssets = mockAssets.filter(a => a.status === 'assigned').length;
  const underMaintenanceAssets = mockAssets.filter(a => a.status === 'under_maintenance').length;
  const retiredAssets = mockAssets.filter(a => a.status === 'retired').length;
  
  const totalRequests = mockAssetRequests.length;
  const pendingRequests = mockAssetRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = mockAssetRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = mockAssetRequests.filter(r => r.status === 'rejected').length;

  return {
    totalAssets,
    availableAssets,
    assignedAssets,
    underMaintenanceAssets,
    retiredAssets,
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
  };
};
