import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { useLanguage } from '../../hooks/useLanguage';
import { useUser } from '../../hooks/useUser';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleDisplayName,
  getRoleName,
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
import {
  isDashboardPathAllowedForRole,
  isMenuVisibleForRole,
  isSubMenuVisibleForRole,
} from '../../utils/permissions';
import { normalizeRole } from '../../utils/permissions';
import { isSystemAdmin as roleIsSystemAdmin } from '../../utils/roleUtils';
import { searchApiService, type SearchResultItem } from '../../api/searchApi';

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
    | 'project'
    | 'asset-request'
    | 'attendance'
    | 'payroll';
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

// Enhanced search function that returns a relevance score for better matching
interface SearchMatch {
  matches: boolean;
  score: number; // Higher score = better match
}

// Optimized helper function to search through all text fields of an object
// Returns both match status and relevance score for better sorting
const searchInObject = (
  obj: Record<string, unknown> | unknown,
  query: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): SearchMatch => {
  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) {
    return { matches: false, score: 0 };
  }

  // Split query into individual words
  const queryWords = normalizeText(query);
  if (queryWords.length === 0) return { matches: false, score: 0 };

  const visited = new WeakSet<object>(); // Prevent circular reference issues
  const priorityTextFields: string[] = []; // High priority fields (name, title, email, etc.)
  const secondaryTextFields: string[] = []; // Other fields

  // Optimized recursive search to collect all text fields
  const collectTextFields = (
    value: unknown,
    depth: number,
    isPriority: boolean
  ): void => {
    if (value === null || value === undefined || depth >= maxDepth) return;

    // Handle circular references for objects only
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (visited.has(value)) return;
      visited.add(value);
    }

    // Collect string values
    if (typeof value === 'string' && value.trim().length > 0) {
      if (isPriority) {
        priorityTextFields.push(value);
      } else {
        secondaryTextFields.push(value);
      }
      return;
    }

    // Collect number values as strings
    if (typeof value === 'number') {
      const numStr = value.toString();
      if (isPriority) {
        priorityTextFields.push(numStr);
      } else {
        secondaryTextFields.push(numStr);
      }
      return;
    }

    // Skip non-objects
    if (typeof value !== 'object') return;

    // Array search
    if (Array.isArray(value)) {
      for (const item of value) {
        collectTextFields(item, depth + 1, isPriority);
      }
      return;
    }

    // Object search - prioritize common fields but search all
    const valueObj = value as Record<string, unknown>;
    const priorityFields = [
      'name',
      'title',
      'label',
      'email',
      'phone',
      'firstName',
      'lastName',
      'first_name',
      'last_name',
    ];
    const secondaryFields = [
      'description',
      'department',
      'designation',
      'category',
      'subcategory',
      'status',
      'type',
      'code',
    ];
    const allFields = Object.keys(valueObj);

    // Search priority fields first
    for (const key of priorityFields) {
      if (key in valueObj) {
        collectTextFields(valueObj[key], depth + 1, true);
      }
    }

    // Search secondary fields
    for (const key of secondaryFields) {
      if (key in valueObj) {
        collectTextFields(valueObj[key], depth + 1, false);
      }
    }

    // Then search remaining fields
    for (const key of allFields) {
      if (!priorityFields.includes(key) && !secondaryFields.includes(key)) {
        collectTextFields(valueObj[key], depth + 1, false);
      }
    }
  };

  // Collect all text fields from the object
  collectTextFields(obj, currentDepth, false);

  // Combine priority and secondary text fields
  const priorityText = priorityTextFields.join(' ').toLowerCase();
  const secondaryText = secondaryTextFields.join(' ').toLowerCase();
  const combinedText = `${priorityText} ${secondaryText}`.toLowerCase();

  // Calculate relevance score
  let score = 0;
  let allWordsMatch = true;

  // Check if all query words are found
  for (const queryWord of queryWords) {
    const wordRegex = new RegExp(
      `\\b${queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i'
    );

    // Check priority fields first (higher score)
    if (wordRegex.test(priorityText)) {
      score += 10; // High score for priority field match
    } else if (wordRegex.test(secondaryText)) {
      score += 5; // Lower score for secondary field match
    } else if (combinedText.includes(queryWord)) {
      score += 2; // Lowest score for substring match
    } else {
      allWordsMatch = false;
    }
  }

  // Bonus for exact match in priority fields
  const exactQuery = query.toLowerCase().trim();
  if (priorityText.includes(exactQuery)) {
    score += 20; // Big bonus for exact match
  }

  return {
    matches: allWordsMatch,
    score: score,
  };
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

  // Get current user role for permission checking
  // Role can be a string or an object with name property
  const currentUserRole = React.useMemo(() => {
    if (!user) return '';

    // Try to get role from user object
    const role = user.role || (user as any)?.role_name;

    if (!role) return '';

    // Use getRoleName utility to properly extract role name
    return getRoleName(role);
  }, [user]);

  // Helper function to check if a route is allowed for current user
  const isRouteAllowed = React.useCallback(
    (route: SearchResult): boolean => {
      // If no role, deny access (user not logged in)
      if (
        !currentUserRole ||
        currentUserRole.trim() === '' ||
        currentUserRole === 'Unknown'
      ) {
        return false;
      }

      if (!route.path) {
        // Dashboard route - check if allowed
        return isDashboardPathAllowedForRole('', currentUserRole);
      }

      // Check if path is allowed for current role
      return isDashboardPathAllowedForRole(route.path, currentUserRole);
    },
    [currentUserRole]
  );

  // Helper functions to check if user can search specific data types
  const canSearchEmployees = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    // Check if employees menu is visible for role
    return isMenuVisibleForRole('employees', currentUserRole);
  }, [currentUserRole]);

  const canSearchTeams = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    return isMenuVisibleForRole('teams', currentUserRole);
  }, [currentUserRole]);

  const canSearchAssets = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    return isMenuVisibleForRole('assets', currentUserRole);
  }, [currentUserRole]);

  const canSearchDepartments = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    return isMenuVisibleForRole('department', currentUserRole);
  }, [currentUserRole]);

  const canSearchBenefits = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    return isMenuVisibleForRole('benefits', currentUserRole);
  }, [currentUserRole]);

  const canSearchLeaves = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    // Leaves are part of attendance/leave-analytics
    return (
      isMenuVisibleForRole('attendance', currentUserRole) ||
      isMenuVisibleForRole('leave-analytics', currentUserRole)
    );
  }, [currentUserRole]);

  const canSearchTenants = React.useCallback((): boolean => {
    // If no role, deny access
    if (
      !currentUserRole ||
      currentUserRole.trim() === '' ||
      currentUserRole === 'Unknown'
    ) {
      return false;
    }
    // Only system-admin can search tenants
    return roleIsSystemAdmin(currentUserRole);
  }, [currentUserRole]);

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

  // Memoized route search with relevance scoring for better matching
  // Only searches routes that are allowed for current user role
  const searchRoutes = React.useCallback(
    (query: string): SearchResult[] => {
      const queryWords = normalizeText(query);
      if (queryWords.length === 0) return [];

      const exactQuery = query.toLowerCase().trim();
      const normalizedQuery = queryWords.join(' '); // Normalized query phrase

      return searchableRoutes
        .filter(route => isRouteAllowed(route)) // Filter by permissions first
        .map(route => {
          // Collect all searchable text from the route
          const label = (route.label || '').toLowerCase();
          const category = (route.category || '').toLowerCase();
          const path = (route.path || '').toLowerCase();
          const subtitle = (route.subtitle || '').toLowerCase();

          // Priority fields (label gets highest priority)
          const priorityText = label;
          const secondaryText = `${category} ${path} ${subtitle}`.trim();
          const combinedText = `${priorityText} ${secondaryText}`.toLowerCase();

          if (!combinedText) return { route, score: 0, matches: false };

          // Calculate relevance score
          let score = 0;
          let allWordsMatch = true;

          // Check for exact phrase match first (highest priority)
          if (label.includes(normalizedQuery)) {
            score += 30; // Very high score for phrase match in label
          } else if (combinedText.includes(normalizedQuery)) {
            score += 20; // High score for phrase match anywhere
          }

          // Check each word individually
          for (const queryWord of queryWords) {
            const wordRegex = new RegExp(
              `\\b${queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              'i'
            );

            // Check priority field (label) first
            if (wordRegex.test(label)) {
              score += 15; // High score for label match
            } else if (wordRegex.test(category)) {
              score += 10; // Medium score for category match
            } else if (wordRegex.test(path)) {
              score += 8; // Lower score for path match
            } else if (wordRegex.test(subtitle)) {
              score += 5; // Lower score for subtitle match
            } else if (combinedText.includes(queryWord)) {
              score += 2; // Lowest score for substring match
            } else {
              allWordsMatch = false;
            }
          }

          // Bonus for exact match in label
          if (label === exactQuery) {
            score += 40; // Maximum bonus for exact label match
          } else if (label.includes(exactQuery)) {
            score += 25; // Big bonus for exact label match
          } else if (label.startsWith(exactQuery)) {
            score += 20; // Bonus for label starting with query
          }

          // Bonus for consecutive word matches in label (phrase matching)
          if (queryWords.length > 1) {
            const labelWords = normalizeText(label);
            let consecutiveMatches = 0;
            let queryIndex = 0;
            for (
              let i = 0;
              i < labelWords.length && queryIndex < queryWords.length;
              i++
            ) {
              if (
                labelWords[i].includes(queryWords[queryIndex]) ||
                queryWords[queryIndex].includes(labelWords[i])
              ) {
                consecutiveMatches++;
                queryIndex++;
              }
            }
            if (consecutiveMatches === queryWords.length) {
              score += 15; // Bonus for all words matching in order
            }
          }

          // Penalty for Dashboard route if query doesn't match well
          // This prevents Dashboard from appearing when searching for specific items
          // Only show Dashboard if query is very short (1-2 chars) or explicitly matches "dashboard"
          if (label === 'dashboard') {
            const isDashboardQuery =
              exactQuery === 'dashboard' ||
              exactQuery === 'dash' ||
              exactQuery.length <= 2;
            if (!isDashboardQuery && score < 15) {
              score = 0; // Don't show Dashboard if query doesn't match well
              allWordsMatch = false;
            }
          }

          return { route, score, matches: allWordsMatch };
        })
        .filter(({ matches }) => matches)
        .sort((a, b) => b.score - a.score) // Sort by relevance (highest first)
        .slice(0, 5)
        .map(({ route }) => route);
    },
    [isRouteAllowed]
  );

  // Helper function to map API search results to SearchResult format
  const mapApiResultToSearchResult = (
    item: SearchResultItem,
    module: string
  ): SearchResult | null => {
    const metadata = item.metadata || {};

    switch (module) {
      case 'employees': {
        return {
          label: item.title,
          path: 'EmployeeManager',
          category: (metadata.designation as string) || 'Employee',
          type: 'employee',
          id: item.id,
          icon: <PersonIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'leaves': {
        return {
          label: item.title,
          path: 'leaves',
          category: 'Leave Request',
          type: 'leave',
          id: item.id,
          icon: <EventIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'assets': {
        return {
          label: item.title,
          path: 'assets',
          category: 'Asset',
          type: 'asset',
          id: item.id,
          icon: <InventoryIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'asset-requests': {
        return {
          label: item.title,
          path: 'assets/requests',
          category: 'Asset Request',
          type: 'asset-request',
          id: item.id,
          icon: <InventoryIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'teams': {
        return {
          label: item.title,
          path: 'teams',
          category: 'Team',
          type: 'team',
          id: item.id,
          icon: <GroupIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'attendance': {
        return {
          label: item.title,
          path: 'AttendanceCheck',
          category: 'Attendance',
          type: 'attendance',
          id: item.id,
          icon: <EventIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'benefits': {
        return {
          label: item.title,
          path: 'benefits-list',
          category: 'Benefit',
          type: 'benefit',
          id: item.id,
          icon: <CardGiftcardIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      case 'payroll': {
        return {
          label: item.title,
          path: 'payroll-records',
          category: 'Payroll',
          type: 'payroll',
          id: item.id,
          icon: <DescriptionIcon fontSize='small' />,
          subtitle: item.description,
        };
      }
      default:
        return null;
    }
  };

  // Optimized search functionality with backend API integration
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

    const query = searchQuery.trim();

    // Minimum 2 characters for API search (as per API requirements)
    if (query.length < 2) {
      // For queries less than 2 characters, only search routes
      const routeResults = searchRoutes(query.toLowerCase());
      setSearchResults(routeResults.slice(0, 15));
      setShowSearchResults(routeResults.length > 0);
      setSelectedResultIndex(-1);
      setIsSearching(false);
      return;
    }

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
        // Routes are always searchable (frontend-only) and filtered by permissions
        const routeResults = searchRoutes(query.toLowerCase());
        if (routeResults.length > 0) {
          results.push(...routeResults);
        }

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

        // 2. Call backend search API
        if (!abortController.signal.aborted) {
          try {
            const currentTenantId = getCurrentTenantId();
            const searchParams: {
              query: string;
              limit?: number;
              tenantId?: string;
            } = {
              query: query,
              limit: 10, // Default limit per module
            };

            // Add tenantId only if user is system admin and tenantId is available
            if (canSearchTenants() && currentTenantId) {
              searchParams.tenantId = currentTenantId;
            }

            const apiResponse = await searchApiService.search(searchParams);

            // Map API results to SearchResult format
            if (apiResponse.results) {
              // Employees
              if (apiResponse.results.employees) {
                apiResponse.results.employees.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'employees');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Leaves
              if (apiResponse.results.leaves && canSearchLeaves()) {
                apiResponse.results.leaves.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'leaves');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Assets
              if (apiResponse.results.assets && canSearchAssets()) {
                apiResponse.results.assets.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'assets');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Asset Requests
              if (apiResponse.results.assetRequests && canSearchAssets()) {
                apiResponse.results.assetRequests.forEach(item => {
                  const mapped = mapApiResultToSearchResult(
                    item,
                    'asset-requests'
                  );
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Teams
              if (apiResponse.results.teams && canSearchTeams()) {
                apiResponse.results.teams.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'teams');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Attendance
              if (apiResponse.results.attendance && canSearchLeaves()) {
                apiResponse.results.attendance.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'attendance');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Benefits
              if (apiResponse.results.benefits && canSearchBenefits()) {
                apiResponse.results.benefits.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'benefits');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }

              // Payroll
              if (apiResponse.results.payroll) {
                apiResponse.results.payroll.forEach(item => {
                  const mapped = mapApiResultToSearchResult(item, 'payroll');
                  if (mapped && results.length < MAX_RESULTS) {
                    results.push(mapped);
                  }
                });
              }
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error('Error calling search API:', error);
              // Continue with route results even if API fails
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
    }, 400); // Debounce: 400ms for better performance

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    searchRoutes,
    getCurrentTenantId,
    canSearchEmployees,
    canSearchTeams,
    canSearchAssets,
    canSearchDepartments,
    canSearchBenefits,
    canSearchLeaves,
    canSearchTenants,
  ]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setShowSearchResults(true);
  };

  // Handle search result click - navigates to specific item in the module
  const handleSearchResultClick = (result: SearchResult) => {
    // Clear search state
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedResultIndex(-1);

    // Ensure we have a valid result
    if (!result) return;

    // Navigate based on result type with proper state for opening exact records
    if (result.type === 'employee' && result.id) {
      // Navigate to employee manager and open the specific employee view
      navigate('/dashboard/EmployeeManager', {
        state: {
          employeeId: result.id,
          viewEmployee: true,
          fromSearch: true, // Flag to indicate navigation from search
        },
        replace: false, // Allow back navigation
      });
    } else if (result.type === 'team' && result.id) {
      // Navigate to teams page and highlight/select the specific team
      navigate('/dashboard/teams', {
        state: {
          teamId: result.id,
          viewTeam: true,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'asset' && result.id) {
      // Navigate to assets page and open the specific asset view/edit modal
      navigate('/dashboard/assets', {
        state: {
          assetId: result.id,
          viewAsset: true,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'department' && result.id) {
      // Navigate to departments page with department ID
      navigate('/dashboard/departments', {
        state: {
          departmentId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'designation' && result.id) {
      // Navigate to designations page with designation ID
      navigate('/dashboard/Designations', {
        state: {
          designationId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'benefit' && result.id) {
      // Navigate to benefits list page with benefit ID
      navigate('/dashboard/benefits-list', {
        state: {
          benefitId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'leave' && result.id) {
      // Navigate to leave requests page with leave ID
      navigate('/dashboard/leaves', {
        state: {
          leaveId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'policy' && result.id) {
      // Navigate to policies page with policy ID
      navigate('/dashboard/policies', {
        state: {
          policyId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'tenant' && result.id) {
      // Navigate to tenant page with tenant ID
      navigate('/dashboard/tenant', {
        state: {
          tenantId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'asset-request' && result.id) {
      // Navigate to asset requests page with request ID
      navigate('/dashboard/assets/requests', {
        state: {
          requestId: result.id,
          viewRequest: true,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'attendance' && result.id) {
      // Navigate to attendance page with attendance ID
      navigate('/dashboard/AttendanceCheck', {
        state: {
          attendanceId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'payroll' && result.id) {
      // Navigate to payroll records page with payroll ID
      navigate('/dashboard/payroll-records', {
        state: {
          payrollId: result.id,
          viewPayroll: true,
          fromSearch: true,
        },
        replace: false,
      });
    } else {
      // Navigate to route (for route-type results)
      // Handle empty path (Dashboard route)
      let path = '/dashboard';
      if (result.path && result.path.trim() !== '') {
        path = `/dashboard/${result.path}`;
      }
      navigate(path, {
        state: { fromSearch: true },
        replace: false,
      });
    }
  };

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Only navigate if user has selected a result or there's exactly one result
      // Don't auto-navigate if there are multiple results - let user choose
      if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
        handleSearchResultClick(searchResults[selectedResultIndex]);
      } else if (searchResults.length === 1) {
        // Only auto-navigate if there's exactly one result
        handleSearchResultClick(searchResults[0]);
      } else if (searchResults.length > 1) {
        // If multiple results, just show them (don't navigate)
        setShowSearchResults(true);
      }
      // If no results, do nothing (don't navigate to dashboard)
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
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
    if (
      searchContainerRef.current &&
      event.target instanceof Node &&
      searchContainerRef.current.contains(event.target)
    ) {
      return;
    }
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
                  display: { xs: 'none', sm: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  maxWidth: { md: '350px', lg: '400px', xl: '450px' },
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
                    // Only navigate if there's exactly one result
                    // Otherwise, just show the results dropdown
                    if (searchResults.length === 1) {
                      handleSearchResultClick(searchResults[0]);
                    } else if (searchResults.length > 1) {
                      // Show results dropdown if multiple results
                      setShowSearchResults(true);
                    }
                    // If no results, do nothing (don't navigate)
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
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      maxHeight: { md: '350px', lg: '400px', xl: '450px' },
                      overflow: 'auto',
                      zIndex: 1300,
                      borderRadius: '12px',
                      backgroundColor: 'var(--white-color)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      width: '100%',
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
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSearchResultClick(result);
                            }}
                            onMouseDown={e => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onTouchEnd={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSearchResultClick(result);
                            }}
                            onTouchStart={e => {
                              e.stopPropagation();
                            }}
                            sx={{
                              px: 2,
                              py: 1.5,
                              cursor: 'pointer',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                              '&:hover': {
                                backgroundColor: 'var(--primary-color)',
                              },
                              '&:active': {
                                backgroundColor: 'var(--primary-dark-color)',
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
              display: { xs: 'flex', sm: 'flex', md: 'none' },
              alignItems: 'center',
              mt: 1.5,
              px: { xs: 0, sm: 0 },
              position: 'relative',
              width: '100%',
            }}
          >
            <Search
              sx={{
                display: { xs: 'flex', sm: 'flex', md: 'none' },
                alignItems: 'center',
                width: '100%',
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
                  // Only navigate if there's exactly one result
                  // Otherwise, just show the results dropdown
                  if (searchResults.length === 1) {
                    handleSearchResultClick(searchResults[0]);
                  } else if (searchResults.length > 1) {
                    // Show results dropdown if multiple results
                    setShowSearchResults(true);
                  }
                  // If no results, do nothing (don't navigate)
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
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: { xs: '250px', sm: '300px' },
                  overflow: 'auto',
                  zIndex: 1300,
                  borderRadius: '12px',
                  backgroundColor: 'var(--white-color)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  width: '100%',
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
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearchResultClick(result);
                        }}
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchEnd={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearchResultClick(result);
                        }}
                        onTouchStart={e => {
                          e.stopPropagation();
                        }}
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'var(--primary-color)',
                          },
                          '&:active': {
                            backgroundColor: 'var(--primary-dark-color)',
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
