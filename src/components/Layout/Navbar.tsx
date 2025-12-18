import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { useLanguage } from '../../hooks/useLanguage';
import { useUser } from '../../hooks/useUser';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleDisplayName,
  isManager,
  isEmployee,
} from '../../utils/roleUtils';

import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button,
  Paper,
  useMediaQuery,
  useTheme,
  ClickAwayListener,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import UserAvatar from '../common/UserAvatar';
import MenuIcon from '@mui/icons-material/Menu';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import { Icons } from '../../assets/icons';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import TeamMembersAvatar from '../Teams/TeamMembersAvatar';
import TeamMembersModal from '../Teams/TeamMembersModal';
import employeeApi from '../../api/employeeApi';
import { teamApiService } from '../../api/teamApi';
import type { Team } from '../../api/teamApi';
import { assetApi } from '../../api/assetApi';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import { departmentApiService } from '../../api/departmentApi';
import { designationApiService } from '../../api/designationApi';
import benefitsApi from '../../api/benefitApi';
import { leaveApi } from '../../api/leaveApi';
import { mockPolicies } from '../../Data/HrmockData';
import { SystemTenantApi } from '../../api/systemTenantApi';
import { isSystemAdmin } from '../../utils/auth';

const labels = {
  en: {
    search: 'Search',
    members: 'Members',
    settings: 'Settings',
    signout: 'Sign Out',
    adminProfile: 'Admin Profile',
    dylan: 'Dylan Hunter',
    email: 'Dylan.hunter@gmail.com',
  },
  ar: {
    search: 'بحث',
    members: 'الأعضاء',
    settings: 'الإعدادات',
    signout: 'تسجيل الخروج',
    adminProfile: 'ملف المشرف',
    dylan: 'ديلان هنتر',
    email: 'Dylan.hunter@gmail.com',
  },
};

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: 'var(--primary-color)',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '400px',
    flexGrow: 0,
    height: '44px',
  },
}));

const StyledInputBase = styled(InputBase)(() => ({
  fontSize: 'var(--body-font-size)',
  flex: 1,
  '& .MuiInputBase-input': {
    padding: 0,
    '::placeholder': {
      color: 'var(--dark-grey-color)',
      opacity: 1,
    },
  },
}));

interface SearchResult {
  label: string;
  path: string;
  category: string;
  type:
    | 'route'
    | 'employee'
    | 'asset'
    | 'team'
    | 'department'
    | 'designation'
    | 'benefit'
    | 'leave'
    | 'policy'
    | 'holiday'
    | 'tenant'
    | 'project';
  id?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

// Optimized helper function to normalize and split text into searchable words
const normalizeText = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Replace special chars with spaces
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 0); // Remove empty strings
};

// Optimized helper function to search through all text fields of an object
// Now supports multi-word matching - all query words must match
const searchInObject = (
  obj: Record<string, unknown> | unknown,
  query: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): boolean => {
  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) return false;

  // Split query into individual words
  const queryWords = normalizeText(query);
  if (queryWords.length === 0) return false;

  const visited = new WeakSet<object>(); // Prevent circular reference issues
  const allTextFields: string[] = []; // Collect all text fields for matching

  // Optimized recursive search to collect all text fields
  const collectTextFields = (value: unknown, depth: number): void => {
    if (value === null || value === undefined || depth >= maxDepth) return;

    // Handle circular references for objects only
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (visited.has(value)) return;
      visited.add(value);
    }

    // Collect string values
    if (typeof value === 'string' && value.trim().length > 0) {
      allTextFields.push(value);
      return;
    }

    // Collect number values as strings
    if (typeof value === 'number') {
      allTextFields.push(value.toString());
      return;
    }

    // Skip non-objects
    if (typeof value !== 'object') return;

    // Array search
    if (Array.isArray(value)) {
      for (const item of value) {
        collectTextFields(item, depth + 1);
      }
      return;
    }

    // Object search - prioritize common fields but search all
    const valueObj = value as Record<string, unknown>;
    const priorityFields = [
      'name',
      'title',
      'label',
      'description',
      'email',
      'phone',
      'firstName',
      'lastName',
      'first_name',
      'last_name',
      'department',
      'designation',
      'category',
      'subcategory',
      'status',
      'type',
      'code',
      'id',
    ];
    const allFields = Object.keys(valueObj);

    // Search priority fields first
    for (const key of priorityFields) {
      if (key in valueObj) {
        collectTextFields(valueObj[key], depth + 1);
      }
    }

    // Then search remaining fields
    for (const key of allFields) {
      if (!priorityFields.includes(key)) {
        collectTextFields(valueObj[key], depth + 1);
      }
    }
  };

  // Collect all text fields from the object
  collectTextFields(obj, currentDepth);

  // Combine all text fields into one searchable string
  const combinedText = allTextFields.join(' ').toLowerCase();

  // Check if all query words are found in the combined text
  // This allows words to match across different fields
  return queryWords.every(queryWord => {
    // Direct substring match (fastest)
    if (combinedText.includes(queryWord)) return true;

    // Word boundary match for better accuracy
    const wordRegex = new RegExp(
      `\\b${queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i'
    );
    return wordRegex.test(combinedText);
  });
};

// Flattened list of all searchable routes - includes all menu items from sidebar
const searchableRoutes: SearchResult[] = [
  {
    label: 'Dashboard',
    path: '',
    category: 'Main',
    type: 'route',
  },
  {
    label: 'Project List',
    path: 'project-list',
    category: 'Projects',
    type: 'route',
  },
  {
    label: 'Add Project',
    path: 'add-project',
    category: 'Projects',
    type: 'route',
  },
  { label: 'Add Tenant', path: 'tenant', category: 'Tenant', type: 'route' },
  {
    label: 'Department List',
    path: 'departments',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Designation',
    path: 'Designations',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'User List',
    path: 'UserList',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Policies',
    path: 'policies',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Holidays',
    path: 'holidays',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Employee List',
    path: 'EmployeeManager',
    category: 'Employees',
    type: 'route',
  },
  {
    label: 'Tenant Employees',
    path: 'TenantEmployees',
    category: 'Employees',
    type: 'route',
  },
  {
    label: 'Team Management',
    path: 'teams',
    category: 'Teams',
    type: 'route',
  },
  {
    label: 'Asset Inventory',
    path: 'assets',
    category: 'Assets',
    type: 'route',
  },
  {
    label: 'Asset Requests',
    path: 'assets/requests',
    category: 'Assets',
    type: 'route',
  },
  {
    label: 'Request Management',
    path: 'assets/request-management',
    category: 'Assets',
    type: 'route',
  },
  {
    label: 'Assets Overview',
    path: 'assets/system-admin',
    category: 'Assets',
    type: 'route',
  },
  {
    label: 'Attendance',
    path: 'AttendanceCheck',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Daily Attendance',
    path: 'AttendanceTable',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Attendance Report',
    path: 'attendance-summary',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Leave Request',
    path: 'leaves',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Reports',
    path: 'Reports',
    category: 'Leave Analytics',
    type: 'route',
  },
  {
    label: 'Cross Tenant Leaves',
    path: 'cross-tenant-leaves',
    category: 'Leave Analytics',
    type: 'route',
  },
  {
    label: 'Benefits List',
    path: 'benefits-list',
    category: 'Benefits',
    type: 'route',
  },
  {
    label: 'Employee Benefits',
    path: 'employee-benefit',
    category: 'Benefits',
    type: 'route',
  },
  {
    label: 'Benefit Details',
    path: 'benefit-details',
    category: 'Benefits',
    type: 'route',
  },
  {
    label: 'Benefits Report',
    path: 'benefit-report',
    category: 'Benefits',
    type: 'route',
  },
  {
    label: 'Employee Performance',
    path: 'performance-dashboard',
    category: 'Performance',
    type: 'route',
  },
  { label: 'Invoice', path: 'invoice', category: 'Accounts', type: 'route' },
  { label: 'Payments', path: 'payments', category: 'Accounts', type: 'route' },
  {
    label: 'Payroll Configuration',
    path: 'payroll-configuration',
    category: 'Payroll',
    type: 'route',
  },
  {
    label: 'Employee Salary',
    path: 'employee-salary',
    category: 'Payroll',
    type: 'route',
  },
  {
    label: 'Payroll Records',
    path: 'payroll-records',
    category: 'Payroll',
    type: 'route',
  },
  {
    label: 'Payroll Reports',
    path: 'payroll-reports',
    category: 'Payroll',
    type: 'route',
  },
  { label: 'My Salary', path: 'my-salary', category: 'Payroll', type: 'route' },
  { label: 'Audit Logs', path: 'audit-logs', category: 'Audit', type: 'route' },
  { label: 'Settings', path: 'settings', category: 'Settings', type: 'route' },
  {
    label: 'User Profile',
    path: 'UserProfile',
    category: 'Profile',
    type: 'route',
  },
  // App routes
  { label: 'Chat', path: 'chat', category: 'App', type: 'route' },
  { label: 'Calendar', path: 'calendar', category: 'App', type: 'route' },
  // Other Pages
  { label: 'Login', path: 'login', category: 'Other Pages', type: 'route' },
  {
    label: 'Register',
    path: 'register',
    category: 'Other Pages',
    type: 'route',
  },
  { label: 'Error', path: 'error', category: 'Other Pages', type: 'route' },
  // UI Components
  {
    label: 'Buttons',
    path: 'buttons',
    category: 'UI Components',
    type: 'route',
  },
  { label: 'Cards', path: 'cards', category: 'UI Components', type: 'route' },
  { label: 'Modals', path: 'modals', category: 'UI Components', type: 'route' },
];

interface NavbarProps {
  darkMode: boolean;
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleSidebar,
  onOpenInviteModal,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = React.useState(-1);
  const [isSearching, setIsSearching] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Cache for API responses to avoid redundant calls
  const dataCacheRef = React.useRef<{
    employees: unknown[] | null;
    teams: Team[] | null;
    assets: unknown[] | null;
    departments: unknown[] | null;
    designations: unknown[] | null;
    benefits: unknown[] | null;
    leaves: unknown[] | null;
    policies: unknown[] | null;
    tenants: unknown[] | null;
    cacheTime: number;
  }>({
    employees: null,
    teams: null,
    assets: null,
    departments: null,
    designations: null,
    benefits: null,
    leaves: null,
    policies: null,
    tenants: null,
    cacheTime: 0,
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const lang = labels[language];
  const { user, clearUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();

  // Get current user's tenantId for tenant-specific search
  const getCurrentTenantId = React.useCallback((): string | null => {
    try {
      // Try localStorage first
      const storedTenantId = localStorage.getItem('tenant_id');
      if (storedTenantId) {
        return String(storedTenantId).trim();
      }

      // Fallback to user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userFromStorage = JSON.parse(userStr);
        const tenantId =
          userFromStorage?.tenant_id ||
          userFromStorage?.tenantId ||
          userFromStorage?.tenant?.id ||
          '';
        if (tenantId) return String(tenantId).trim();
      }

      // Last fallback: user context
      if (user) {
        const userWithTenant = user as {
          tenant_id?: string;
          tenantId?: string;
          tenant?: { id?: string };
        };
        const tenantId =
          userWithTenant.tenant_id ||
          userWithTenant.tenantId ||
          userWithTenant.tenant?.id ||
          '';
        if (tenantId) return String(tenantId).trim();
      }
    } catch {
      // Ignore errors
    }
    return null;
  }, [user]);

  // Initialize profile picture state when user data loads
  React.useEffect(() => {
    if (user?.profile_pic) {
      const profilePicUrl = user.profile_pic.startsWith('http')
        ? user.profile_pic
        : `${env.apiBaseUrl}/users/${user.id}/profile-picture`;
      updateProfilePicture(profilePicUrl);
    }
  }, [user?.profile_pic, user?.id, updateProfilePicture]);

  // Language dropdown state
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const langMenuOpen = Boolean(langAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear all authentication and signup data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('rememberedLogin');
    localStorage.removeItem('companyDetails');
    localStorage.removeItem('signupSessionId');

    // Clear user context
    clearUser();

    // Navigate to login page with replace to prevent back navigation
    navigate('/', { replace: true });
  };

  const handleOpenTeamMembersModal = () => {
    setTeamMembersModalOpen(true);
  };

  const handleCloseTeamMembersModal = () => {
    setTeamMembersModalOpen(false);
  };

  // Memoized route search with optimized multi-word matching
  // All query words must match in any of the route's searchable fields
  const searchRoutes = React.useCallback((query: string): SearchResult[] => {
    const queryWords = normalizeText(query);
    if (queryWords.length === 0) return [];

    return searchableRoutes
      .filter(route => {
        // Collect all searchable text from the route
        const searchableTexts = [
          route.label,
          route.category,
          route.path,
          route.subtitle,
        ]
          .filter((text): text is string => Boolean(text))
          .map(text => text.toLowerCase());

        // Combine all text into one searchable string
        const combinedText = searchableTexts.join(' ');
        if (!combinedText) return false;

        // Check if all query words are found in the combined text
        // This allows words to match across different fields (e.g., "employee" in label, "list" in category)
        return queryWords.every(queryWord => {
          // Direct substring match (fastest)
          if (combinedText.includes(queryWord)) return true;

          // Word boundary match for better accuracy
          const wordRegex = new RegExp(
            `\\b${queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            'i'
          );
          return wordRegex.test(combinedText);
        });
      })
      .slice(0, 5);
  }, []);

  // Optimized search functionality with caching and request cancellation
  React.useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedResultIndex(-1);
      setIsSearching(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Create new AbortController for this search
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Optimized debounce: 400ms for better performance (reduces API calls)
    searchTimeoutRef.current = setTimeout(async () => {
      // Check if request was cancelled
      if (abortController.signal.aborted) return;

      setIsSearching(true);
      const results: SearchResult[] = [];
      const MAX_RESULTS = 15;
      const startTime = performance.now();

      try {
        // 1. Search routes (instant, no API call) - use memoized function
        const routeResults = searchRoutes(query);
        results.push(...routeResults);

        // Early exit if we have enough results
        if (
          results.length >= MAX_RESULTS &&
          abortController.signal.aborted === false
        ) {
          setSearchResults(results.slice(0, MAX_RESULTS));
          setShowSearchResults(true);
          setSelectedResultIndex(-1);
          setIsSearching(false);
          return;
        }

        // Check cache validity
        const now = Date.now();
        const cacheValid =
          now - dataCacheRef.current.cacheTime < CACHE_DURATION;

        // 2. Search employees - with caching and tenant filtering
        if (!abortController.signal.aborted) {
          try {
            let allEmployees = dataCacheRef.current.employees;
            const currentTenantId = getCurrentTenantId();

            if (!allEmployees || !cacheValid) {
              allEmployees =
                await employeeApi.getAllEmployeesWithoutPagination();
              dataCacheRef.current.employees = allEmployees;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              // Filter by tenant if tenantId is available (tenant-specific search)
              let filteredEmployees = allEmployees || [];
              if (currentTenantId && allEmployees) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredEmployees = allEmployees.filter((emp: any) => {
                  const empTenantId =
                    emp.tenantId || emp.tenant_id || emp.tenant?.id || '';
                  return String(empTenantId).trim() === currentTenantId;
                });
              }

              const employeeMatches = filteredEmployees
                .filter(emp => searchInObject(emp, query))
                .slice(0, 5)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((emp: any) => {
                  const fullName =
                    `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
                    emp.name ||
                    emp.email ||
                    'Employee';
                  const subtitle = [
                    emp.email,
                    emp.phone,
                    emp.department?.name,
                    emp.designation?.title,
                    emp.department?.description,
                  ]
                    .filter(Boolean)
                    .join(' • ');

                  return {
                    label: fullName,
                    path: 'EmployeeManager',
                    category:
                      emp.department?.name ||
                      emp.designation?.title ||
                      'Employee',
                    type: 'employee' as const,
                    id: emp.id,
                    icon: <PersonIcon fontSize='small' />,
                    subtitle: subtitle || 'Employee',
                  };
                });

              results.push(...employeeMatches);

              // Early exit check
              if (
                results.length >= MAX_RESULTS &&
                !abortController.signal.aborted
              ) {
                setSearchResults(results.slice(0, MAX_RESULTS));
                setShowSearchResults(true);
                setSelectedResultIndex(-1);
                setIsSearching(false);
                return;
              }
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching employees:', error);
            }
          }
        }

        // 3. Search teams - with caching, tenant filtering, and parallel execution
        if (!abortController.signal.aborted) {
          try {
            let teams = dataCacheRef.current.teams;
            const currentTenantId = getCurrentTenantId();

            if (!teams || !cacheValid) {
              const teamsResponse = await teamApiService.getAllTeams(null);
              teams = teamsResponse.items || [];
              dataCacheRef.current.teams = teams;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              // Filter by tenant if tenantId is available (tenant-specific search)
              // Note: Teams API may already filter by tenant, but we ensure it here
              let filteredTeams = teams;
              if (currentTenantId) {
                // Teams might not have direct tenantId, so we rely on API filtering
                // But we can still filter if the data includes tenant info
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredTeams = teams.filter((team: any) => {
                  // If team has tenant_id, filter by it
                  if (team.tenant_id || team.tenantId) {
                    const teamTenantId =
                      team.tenant_id || team.tenantId || team.tenant?.id || '';
                    return String(teamTenantId).trim() === currentTenantId;
                  }
                  // If no tenant info, include it (API likely already filtered)
                  return true;
                });
              }

              const teamMatches = filteredTeams
                .filter((team: Team) => searchInObject(team, query))
                .slice(0, 3)
                .map((team: Team) => ({
                  label: team.name || 'Team',
                  path: 'teams',
                  category: 'Team',
                  type: 'team' as const,
                  id: team.id,
                  icon: <GroupIcon fontSize='small' />,
                  subtitle: team.description || 'Team',
                }));

              results.push(...teamMatches);

              // Early exit check
              if (
                results.length >= MAX_RESULTS &&
                !abortController.signal.aborted
              ) {
                setSearchResults(results.slice(0, MAX_RESULTS));
                setShowSearchResults(true);
                setSelectedResultIndex(-1);
                setIsSearching(false);
                return;
              }
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching teams:', error);
            }
          }
        }

        // 4. Search assets - optimized with caching, tenant filtering, and early exit
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let allAssets = dataCacheRef.current.assets;
            const currentTenantId = getCurrentTenantId();

            if (!allAssets || !cacheValid) {
              // Fetch only first page for better performance (50 assets)
              const assetsResponse = await assetApi.getAllAssets({
                page: 1,
                limit: 50,
              });
              allAssets = assetsResponse.assets || [];
              dataCacheRef.current.assets = allAssets;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted && allAssets) {
              // Filter by tenant if tenantId is available (tenant-specific search)
              let filteredAssets = allAssets;
              if (currentTenantId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredAssets = allAssets.filter((asset: any) => {
                  const assetTenantId =
                    asset.tenantId ||
                    asset.tenant_id ||
                    asset.tenant?.id ||
                    asset.category?.tenantId ||
                    asset.category?.tenant_id ||
                    '';
                  return String(assetTenantId).trim() === currentTenantId;
                });
              }

              const assetMatches = filteredAssets
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((asset: any) => searchInObject(asset, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((asset: any) => {
                  const categoryName =
                    asset.category?.name || asset.categoryName || 'Asset';
                  const subcategoryName =
                    asset.subcategory?.name || asset.subcategoryName || '';
                  const assignedToName =
                    asset.assignedToUser?.name || asset.assignedToName || '';

                  const subtitle = [
                    categoryName,
                    subcategoryName,
                    assignedToName,
                    asset.category?.description,
                    asset.subcategory?.description,
                  ]
                    .filter(Boolean)
                    .join(' • ');

                  return {
                    label: asset.name || 'Asset',
                    path: 'assets',
                    category: 'Asset',
                    type: 'asset' as const,
                    id: asset.id,
                    icon: <InventoryIcon fontSize='small' />,
                    subtitle: subtitle || 'Asset',
                  };
                });

              results.push(...assetMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching assets:', error);
            }
          }
        }

        // 5. Search departments - with caching and tenant filtering
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let departments = dataCacheRef.current.departments;
            const currentTenantId = getCurrentTenantId();

            if (!departments || !cacheValid) {
              departments = await departmentApiService.getAllDepartments();
              dataCacheRef.current.departments = departments;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              let filteredDepartments = departments;
              if (currentTenantId) {
                filteredDepartments = (departments || []).filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (dept: any) => {
                    const deptTenantId = dept.tenantId || dept.tenant_id || '';
                    return String(deptTenantId).trim() === currentTenantId;
                  }
                );
              }

              const departmentMatches = (filteredDepartments || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((dept: any) => searchInObject(dept, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((dept: any) => ({
                  label: dept.name || 'Department',
                  path: 'departments',
                  category: 'Department',
                  type: 'department' as const,
                  id: dept.id,
                  icon: <BusinessIcon fontSize='small' />,
                  subtitle: dept.description || 'Department',
                }));

              results.push(...departmentMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching departments:', error);
            }
          }
        }

        // 6. Search designations - with caching and tenant filtering
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let designations = dataCacheRef.current.designations;
            const currentTenantId = getCurrentTenantId();

            if (!designations || !cacheValid) {
              designations = await designationApiService.getAllDesignations();
              dataCacheRef.current.designations = designations;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              let filteredDesignations = designations;
              if (currentTenantId) {
                filteredDesignations = (designations || []).filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (desig: any) => {
                    const desigTenantId =
                      desig.tenantId || desig.tenant_id || '';
                    return String(desigTenantId).trim() === currentTenantId;
                  }
                );
              }

              const designationMatches = (filteredDesignations || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((desig: any) => searchInObject(desig, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((desig: any) => ({
                  label: desig.title || 'Designation',
                  path: 'Designations',
                  category: 'Designation',
                  type: 'designation' as const,
                  id: desig.id,
                  icon: <WorkIcon fontSize='small' />,
                  subtitle: desig.department?.name || 'Designation',
                }));

              results.push(...designationMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching designations:', error);
            }
          }
        }

        // 7. Search benefits - with caching and tenant filtering
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let benefits = dataCacheRef.current.benefits;
            const currentTenantId = getCurrentTenantId();

            if (!benefits || !cacheValid) {
              benefits = await benefitsApi.getBenefits(null);
              dataCacheRef.current.benefits = benefits;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              let filteredBenefits = benefits;
              if (currentTenantId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredBenefits = (benefits || []).filter((benefit: any) => {
                  const benefitTenantId =
                    benefit.tenant_id || benefit.tenantId || '';
                  return String(benefitTenantId).trim() === currentTenantId;
                });
              }

              const benefitMatches = (filteredBenefits || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((benefit: any) => searchInObject(benefit, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((benefit: any) => ({
                  label: benefit.name || 'Benefit',
                  path: 'benefits-list',
                  category: 'Benefit',
                  type: 'benefit' as const,
                  id: benefit.id,
                  icon: <CardGiftcardIcon fontSize='small' />,
                  subtitle:
                    `${benefit.type || ''} • ${benefit.status || ''}`.trim(),
                }));

              results.push(...benefitMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching benefits:', error);
            }
          }
        }

        // 8. Search leave requests - with caching and tenant filtering
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let leaves = dataCacheRef.current.leaves;
            const currentTenantId = getCurrentTenantId();

            if (!leaves || !cacheValid) {
              const leavesResponse = await leaveApi.getAllLeaves(1);
              leaves = leavesResponse.items || [];
              dataCacheRef.current.leaves = leaves;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted && leaves) {
              let filteredLeaves = leaves;
              if (currentTenantId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredLeaves = (leaves || []).filter((leave: any) => {
                  const leaveTenantId = leave.tenantId || leave.tenant_id || '';
                  return String(leaveTenantId).trim() === currentTenantId;
                });
              }

              const leaveMatches = (filteredLeaves || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((leave: any) => searchInObject(leave, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((leave: any) => {
                  const userName =
                    leave.user?.name ||
                    `${leave.user?.first_name || ''} ${leave.user?.last_name || ''}`.trim() ||
                    'Employee';
                  return {
                    label: `${userName} - Leave Request`,
                    path: 'leaves',
                    category: 'Leave Request',
                    type: 'leave' as const,
                    id: leave.id,
                    icon: <EventIcon fontSize='small' />,
                    subtitle:
                      `${leave.status || ''} • ${leave.startDate || ''} to ${leave.endDate || ''}`.trim(),
                  };
                });

              results.push(...leaveMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching leaves:', error);
            }
          }
        }

        // 9. Search policies - from mock data (no API yet)
        if (!abortController.signal.aborted && results.length < MAX_RESULTS) {
          try {
            let policies = dataCacheRef.current.policies;

            if (!policies || !cacheValid) {
              policies = mockPolicies;
              dataCacheRef.current.policies = policies;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              const policyMatches = (policies || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((policy: any) => searchInObject(policy, query))
                .slice(0, 2)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((policy: any) => ({
                  label: policy.name || 'Policy',
                  path: 'policies',
                  category: 'Policy',
                  type: 'policy' as const,
                  id: policy.id,
                  icon: <DescriptionIcon fontSize='small' />,
                  subtitle:
                    `${policy.type || ''} • ${policy.effectiveDate || ''}`.trim(),
                }));

              results.push(...policyMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching policies:', error);
            }
          }
        }

        // 10. Search tenants (only for system admin)
        if (
          !abortController.signal.aborted &&
          results.length < MAX_RESULTS &&
          isSystemAdmin()
        ) {
          try {
            let tenants = dataCacheRef.current.tenants;

            if (!tenants || !cacheValid) {
              const tenantsResponse = await SystemTenantApi.getAll({
                page: 1,
                limit: 50,
              });
              tenants = tenantsResponse.data || [];
              dataCacheRef.current.tenants = tenants;
              dataCacheRef.current.cacheTime = now;
            }

            if (!abortController.signal.aborted) {
              const tenantMatches = (tenants || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((tenant: any) => searchInObject(tenant, query))
                .slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((tenant: any) => ({
                  label: tenant.name || 'Tenant',
                  path: 'tenant',
                  category: 'Tenant',
                  type: 'tenant' as const,
                  id: tenant.id,
                  icon: <BusinessIcon fontSize='small' />,
                  subtitle:
                    `${tenant.status || ''} • ${tenant.domain || ''}`.trim(),
                }));

              results.push(...tenantMatches);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error searching tenants:', error);
            }
          }
        }

        // Only update if request wasn't cancelled
        if (!abortController.signal.aborted) {
          const endTime = performance.now();
          console.log(
            `Search completed in ${(endTime - startTime).toFixed(2)}ms`
          );

          setSearchResults(results.slice(0, MAX_RESULTS));
          setShowSearchResults(results.length > 0);
          setSelectedResultIndex(-1);
          setIsSearching(false);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Search error:', error);
          setIsSearching(false);
        }
      }
    }, 400); // Increased debounce to 400ms for better performance

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchRoutes, getCurrentTenantId]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setShowSearchResults(true);
  };

  // Handle search result click - navigates to specific item in the module
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);

    if (result.type === 'employee' && result.id) {
      // Navigate to employee manager and open the specific employee view
      navigate('/dashboard/EmployeeManager', {
        state: { employeeId: result.id, viewEmployee: true },
      });
    } else if (result.type === 'team' && result.id) {
      // Navigate to teams page and highlight/select the specific team
      navigate('/dashboard/teams', {
        state: { teamId: result.id, viewTeam: true },
      });
    } else if (result.type === 'asset' && result.id) {
      // Navigate to assets page and open the specific asset view/edit modal
      navigate('/dashboard/assets', {
        state: { assetId: result.id, viewAsset: true },
      });
    } else if (result.type === 'department' && result.id) {
      // Navigate to departments page
      navigate('/dashboard/departments');
    } else if (result.type === 'designation' && result.id) {
      // Navigate to designations page
      navigate('/dashboard/Designations');
    } else if (result.type === 'benefit' && result.id) {
      // Navigate to benefits list page
      navigate('/dashboard/benefits-list');
    } else if (result.type === 'leave' && result.id) {
      // Navigate to leave requests page
      navigate('/dashboard/leaves');
    } else if (result.type === 'policy' && result.id) {
      // Navigate to policies page
      navigate('/dashboard/policies');
    } else if (result.type === 'tenant' && result.id) {
      // Navigate to tenant page
      navigate('/dashboard/tenant');
    } else {
      // Navigate to route
      navigate(`/dashboard/${result.path}`);
    }
  };

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
        handleSearchResultClick(searchResults[selectedResultIndex]);
      } else if (searchResults.length > 0) {
        handleSearchResultClick(searchResults[0]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedResultIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedResultIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (event.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  // Close search results when clicking outside
  const handleClickAway = () => {
    setShowSearchResults(false);
  };

  // Close search results on route change
  React.useEffect(() => {
    setShowSearchResults(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Clear cache periodically to ensure fresh data
  React.useEffect(() => {
    const cacheRef = dataCacheRef.current;
    const cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      if (now - cacheRef.cacheTime > CACHE_DURATION) {
        cacheRef.employees = null;
        cacheRef.teams = null;
        cacheRef.assets = null;
        cacheRef.departments = null;
        cacheRef.designations = null;
        cacheRef.benefits = null;
        cacheRef.leaves = null;
        cacheRef.policies = null;
        cacheRef.tenants = null;
      }
    }, CACHE_DURATION);

    return () => {
      clearInterval(cacheCleanupInterval);
      // Clear cache on unmount
      cacheRef.employees = null;
      cacheRef.teams = null;
      cacheRef.assets = null;
      cacheRef.departments = null;
      cacheRef.designations = null;
      cacheRef.benefits = null;
      cacheRef.leaves = null;
      cacheRef.policies = null;
      cacheRef.tenants = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textColor = darkMode ? '#8f8f8f' : '#000';
  // Language context available if needed

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: 'var(--white-100-color)',
        py: { xs: 0, md: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          backgroundColor: { xs: 'transparent', md: 'var(--white-color)' },
          borderRadius: { xs: 0, md: '20px' },
          boxShadow: { xs: 'none', md: '0 1px 3px rgba(0,0,0,0.1)' },
          px: { xs: 1.5, md: 3 },
          py: { xs: 0.75, md: 1.5 },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            minHeight: 'auto',
          }}
        >
          {/* Left Side - Search (Desktop) / Menu Toggle (Mobile) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Mobile Menu Toggle - Left Side */}
            <IconButton
              onClick={onToggleSidebar}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: 'var(--text-color)',
                padding: { xs: '6px', md: '8px' },
              }}
              aria-label='Toggle sidebar menu'
              aria-expanded='false'
            >
              <MenuIcon
                sx={{ fontSize: { xs: '20px', md: '24px' } }}
                aria-hidden='true'
              />
            </IconButton>

            {/* Desktop Search */}
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box
                ref={searchContainerRef}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  maxWidth: '400px',
                  position: 'relative',
                }}
              >
                <Search>
                  <StyledInputBase
                    ref={searchInputRef}
                    placeholder={lang.search}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    sx={{
                      color: 'var(--text-color)',
                      '& input': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  />
                  {isSearching && (
                    <CircularProgress
                      size={16}
                      sx={{
                        position: 'absolute',
                        right: '50px',
                        color: 'var(--text-color)',
                      }}
                    />
                  )}
                </Search>
                <IconButton
                  onClick={() => {
                    if (searchResults.length > 0) {
                      handleSearchResultClick(searchResults[0]);
                    }
                  }}
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    color: 'var(--white-color)',
                    borderRadius: '16px',
                    width: { xs: '36px', md: '44px' },
                    height: { xs: '36px', md: '44px' },
                    minWidth: { xs: '36px', md: '44px' },
                    '&:hover': {
                      backgroundColor: 'var(--primary-light-color)',
                    },
                  }}
                  aria-label='Search'
                >
                  <Box
                    component='img'
                    src={Icons.search}
                    alt='Search'
                    sx={{
                      width: { xs: 16, md: 20 },
                      height: { xs: 16, md: 20 },
                      filter: 'brightness(0) saturate(100%) invert(1)',
                    }}
                  />
                </IconButton>
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      maxHeight: '400px',
                      overflow: 'auto',
                      zIndex: 1300,
                      borderRadius: '12px',
                      backgroundColor: 'var(--white-color)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {searchResults.map((result, index) => (
                        <ListItem
                          key={`${result.type}-${result.id || result.path}-${index}`}
                          disablePadding
                        >
                          <ListItemButton
                            selected={selectedResultIndex === index}
                            onClick={() => handleSearchResultClick(result)}
                            sx={{
                              px: 2,
                              py: 1.5,
                              '&:hover': {
                                backgroundColor: 'var(--primary-color)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'var(--primary-dark-color)',
                                color: 'var(--white-color)',
                                '&:hover': {
                                  backgroundColor: 'var(--primary-dark-color)',
                                },
                              },
                            }}
                          >
                            {result.icon && (
                              <Box
                                sx={{
                                  mr: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {result.icon}
                              </Box>
                            )}
                            <ListItemText
                              primary={result.label}
                              secondary={result.subtitle || result.category}
                              primaryTypographyProps={{
                                fontSize: 'var(--body-font-size)',
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{
                                fontSize: 'var(--label-font-size)',
                                color:
                                  selectedResultIndex === index
                                    ? 'rgba(255,255,255,0.7)'
                                    : 'var(--dark-grey-color)',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
                {showSearchResults &&
                  searchQuery.trim() &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <Paper
                      elevation={4}
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        zIndex: 1300,
                        borderRadius: '12px',
                        backgroundColor: 'var(--white-color)',
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 'var(--body-font-size)',
                          color: 'var(--dark-grey-color)',
                        }}
                      >
                        No results found
                      </Typography>
                    </Paper>
                  )}
              </Box>
            </ClickAwayListener>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, lg: 1 },
            }}
          >
            <Button
              variant='text'
              size='small'
              onClick={e => setLangAnchorEl(e.currentTarget)}
              sx={{
                minWidth: 0,
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.5, md: 1 },
                color: 'var(--text-color)',
                fontWeight: 600,
                fontSize: { xs: '12px', md: 'var(--body-font-size)' },
              }}
              aria-label={`Current language: ${language === 'en' ? 'English' : 'Arabic'}. Click to change language`}
              aria-haspopup='true'
              aria-expanded={langMenuOpen}
            >
              {language === 'en' ? 'EN' : 'عربي'}
            </Button>

            {/* Team Members Avatar */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
              }}
            >
              <TeamMembersAvatar maxAvatars={5} darkMode={darkMode} />
            </Box>

            {/* Mobile Team Members Button */}
            <IconButton
              onClick={handleOpenTeamMembersModal}
              sx={{
                display: { xs: 'flex', md: 'none' },
                backgroundColor: {
                  xs: 'transparent',
                  md: 'var(--white-color)',
                },
                borderRadius: 'var(--border-radius-lg)',
                p: { xs: 0.75, md: 1 },
              }}
              aria-label='Open team members modal'
            >
              <GroupOutlinedIcon
                sx={{
                  color: 'var(--text-color)',
                  fontSize: { xs: '18px', md: '24px' },
                }}
              />
            </IconButton>

            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'var(--light-grey-200-color)',
                borderRadius: '16px',
                p: { xs: 0.25, md: 0.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                sx={{
                  padding: { xs: '6px', md: '8px' },
                }}
                aria-label='Notifications'
                aria-describedby='notifications-badge'
              >
                <Badge
                  variant='dot'
                  sx={{
                    '& .MuiBadge-dot': {
                      backgroundColor: 'var(--secondary-color)',
                      width: { xs: 6, md: 8 },
                      height: { xs: 6, md: 8 },
                    },
                  }}
                  id='notifications-badge'
                >
                  <Box
                    component='img'
                    src={Icons.notification}
                    alt='Notifications'
                    sx={{
                      width: { xs: 18, md: 24 },
                      height: { xs: 18, md: 24 },
                      filter: 'brightness(0) saturate(100%)',
                    }}
                    aria-hidden='true'
                  />
                </Badge>
              </IconButton>
            </Paper>

            <Divider
              orientation='vertical'
              flexItem
              sx={{
                height: { xs: '32px', md: '40px' },
                alignSelf: 'center',
                borderColor: 'var(--light-grey-color)',
                display: { xs: 'flex', md: 'flex' },
              }}
            />

            {/* User Profile */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: {
                  xs: 'transparent',
                  md: 'var(--white-color)',
                },
                borderRadius: 'var(--border-radius-lg)',
                px: { xs: 0, md: 2 },
                py: { xs: 0, md: 1 },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, md: 1.5 },
              }}
            >
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0 }}
                aria-label={`User menu for ${user ? `${user.first_name} ${user.last_name}` : 'user'}`}
                aria-haspopup='true'
                aria-expanded={open}
              >
                {user ? (
                  <UserAvatar
                    user={user}
                    size={isMobile ? 32 : 40}
                    clickable={false}
                  />
                ) : (
                  <img
                    src='./avatar.png'
                    alt=''
                    aria-hidden='true'
                    style={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: {
                      xs: '11px',
                      sm: '12px',
                      md: 'var(--body-font-size)',
                    },
                    color: 'var(--black-color)',
                    lineHeight: 1.2,
                  }}
                >
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: {
                      xs: '9px',
                      sm: '10px',
                      md: 'var(--label-font-size)',
                    },
                    color: 'var(--dark-grey-500-color)',
                    lineHeight: 1.2,
                    fontWeight: 400,
                  }}
                >
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Language Menu */}
          <Menu
            anchorEl={langAnchorEl}
            open={langMenuOpen}
            onClose={() => setLangAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 4,
              sx: {
                borderRadius: 'var(--border-radius-lg)',
                minWidth: 80,
                p: 0,
              },
            }}
          >
            {language === 'en' ? (
              <MenuItem
                onClick={() => {
                  setLanguage('ar');
                  setLangAnchorEl(null);
                }}
              >
                عربي
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => {
                  setLanguage('en');
                  setLangAnchorEl(null);
                }}
              >
                EN
              </MenuItem>
            )}
          </Menu>
        </Toolbar>

        {/* Mobile Search Bar - Below Navbar */}
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            ref={searchContainerRef}
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              mt: 1.5,
              px: { xs: 0 },
              position: 'relative',
            }}
          >
            <Search
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                mt: 1.5,
                px: { xs: 0 },
                position: 'relative',
              }}
            >
              <StyledInputBase
                ref={searchInputRef}
                placeholder={lang.search}
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                sx={{
                  color: 'var(--text-color)',
                  fontSize: { xs: '12px', md: 'var(--body-font-size)' },
                  pr: { xs: '40px', md: '16px' },
                  '& input': {
                    backgroundColor: 'transparent',
                  },
                }}
              />
              {isSearching && (
                <CircularProgress
                  size={14}
                  sx={{
                    position: 'absolute',
                    right: '40px',
                    color: 'var(--text-color)',
                  }}
                />
              )}
              <IconButton
                onClick={() => {
                  if (searchResults.length > 0) {
                    handleSearchResultClick(searchResults[0]);
                  }
                }}
                sx={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'var(--primary-dark-color)',
                  color: 'var(--white-color)',
                  borderRadius: '12px',
                  width: { xs: '28px', md: '36px' },
                  height: { xs: '28px', md: '36px' },
                  minWidth: { xs: '28px', md: '36px' },
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'var(--primary-light-color)',
                  },
                }}
                aria-label='Search'
              >
                <Box
                  component='img'
                  src={Icons.search}
                  alt='Search'
                  sx={{
                    width: { xs: 14, md: 18 },
                    height: { xs: 14, md: 18 },
                    filter: 'brightness(0) saturate(100%) invert(1)',
                  }}
                />
              </IconButton>
            </Search>
            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: '300px',
                  overflow: 'auto',
                  zIndex: 1300,
                  borderRadius: '12px',
                  backgroundColor: 'var(--white-color)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                <List sx={{ p: 0 }}>
                  {searchResults.map((result, index) => (
                    <ListItem
                      key={`${result.type}-${result.id || result.path}-${index}`}
                      disablePadding
                    >
                      <ListItemButton
                        selected={selectedResultIndex === index}
                        onClick={() => handleSearchResultClick(result)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'var(--primary-color)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-dark-color)',
                            color: 'var(--white-color)',
                            '&:hover': {
                              backgroundColor: 'var(--primary-dark-color)',
                            },
                          },
                        }}
                      >
                        {result.icon && (
                          <Box
                            sx={{
                              mr: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {result.icon}
                          </Box>
                        )}
                        <ListItemText
                          primary={result.label}
                          secondary={result.subtitle || result.category}
                          primaryTypographyProps={{
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            fontSize: '10px',
                            color:
                              selectedResultIndex === index
                                ? 'rgba(255,255,255,0.7)'
                                : 'var(--dark-grey-color)',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {showSearchResults &&
              searchQuery.trim() &&
              searchResults.length === 0 &&
              !isSearching && (
                <Paper
                  elevation={4}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    zIndex: 1300,
                    borderRadius: '12px',
                    backgroundColor: 'var(--white-color)',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: 'var(--dark-grey-color)',
                    }}
                  >
                    No results found
                  </Typography>
                </Paper>
              )}
          </Box>
        </ClickAwayListener>
      </Paper>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: '10px',
            width: 280,
            p: 2,
            backgroundColor: darkMode ? '#111' : '#fff',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {user && <UserAvatar user={user} size={40} clickable={false} />}
          <Box>
            <Typography fontWeight={600} color={textColor}>
              {user ? `${user.first_name} ${user.last_name}` : 'User'}
            </Typography>
            <Typography variant='body2' color={textColor}>
              {user?.email || ''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1 }} />

        {!isManager(user?.role) && !isEmployee(user?.role) && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/dashboard/EmployeeManager');
            }}
            aria-label='Navigate to employee manager'
          >
            <ListItemIcon>
              <GroupOutlinedIcon
                fontSize='small'
                sx={{ color: textColor }}
                aria-hidden='true'
              />
            </ListItemIcon>
            <Typography color={textColor}>{lang.members}</Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/UserProfile');
          }}
          aria-label='Navigate to user profile'
        >
          <ListItemIcon>
            <AdminPanelSettings
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>Profile</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/settings');
          }}
          aria-label='Navigate to settings'
        >
          <ListItemIcon>
            <SettingsIcon
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>{lang.settings}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} aria-label='Sign out'>
          <ListItemIcon>
            <LogoutIcon
              fontSize='small'
              sx={{ color: textColor }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography color={textColor}>{lang.signout}</Typography>
        </MenuItem>
        {/* <Divider sx={{ my: 1 }} /> */}
      </Menu>

      {/* Team Members Modal for Mobile */}
      <TeamMembersModal
        open={teamMembersModalOpen}
        onClose={handleCloseTeamMembersModal}
        onOpenInviteModal={onOpenInviteModal}
        darkMode={darkMode}
      />
    </Box>
  );
};

export default Navbar;
