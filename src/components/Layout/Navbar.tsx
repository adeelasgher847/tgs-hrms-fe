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
} from '@mui/material';
import UserAvatar from '../Common/UserAvatar';
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
  type: 'route' | 'employee' | 'asset' | 'team' | 'department';
  id?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

// Flattened list of all searchable routes
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
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const lang = labels[language];
  const { user, clearUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();

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

  // Search functionality - searches routes and entities
  React.useEffect(() => {
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

    // Debounce the search for entity queries (wait 300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results: SearchResult[] = [];

      // 1. Search routes (instant, no API call)
      const routeResults = searchableRoutes
        .filter(
          route =>
            route.label.toLowerCase().includes(query) ||
            route.category.toLowerCase().includes(query) ||
            route.path.toLowerCase().includes(query)
        )
        .slice(0, 5); // Limit route results to 5

      results.push(...routeResults);

      // 2. Search employees (API call)
      try {
        // Fetch employees without pagination for search
        const allEmployees =
          await employeeApi.getAllEmployeesWithoutPagination();

        const employeeMatches = allEmployees
          .filter(emp => {
            const firstName = (
              emp.firstName ||
              emp.name?.split(' ')[0] ||
              ''
            ).toLowerCase();
            const lastName = (
              emp.lastName ||
              emp.name?.split(' ').slice(1).join(' ') ||
              ''
            ).toLowerCase();
            const fullName =
              `${firstName} ${lastName}`.trim() ||
              emp.name?.toLowerCase() ||
              '';
            const email = (emp.email || '').toLowerCase();
            const department = (emp.department?.name || '').toLowerCase();
            const designation = (emp.designation?.title || '').toLowerCase();

            return (
              firstName.includes(query) ||
              lastName.includes(query) ||
              fullName.includes(query) ||
              emp.name?.toLowerCase().includes(query) ||
              email.includes(query) ||
              department.includes(query) ||
              designation.includes(query)
            );
          })
          .slice(0, 5) // Limit to 5 employee results
          .map(emp => ({
            label:
              `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
              emp.name ||
              emp.email ||
              'Employee',
            path: 'EmployeeManager',
            category:
              emp.department?.name || emp.designation?.title || 'Employee',
            type: 'employee' as const,
            id: emp.id,
            icon: <PersonIcon fontSize='small' />,
            subtitle:
              emp.email || emp.designation?.title || emp.department?.name,
          }));

        results.push(...employeeMatches);
      } catch (error) {
        console.error('Error searching employees:', error);
      }

      // 3. Search teams (if needed)
      try {
        const teamsResponse = await teamApiService.getAllTeams(null);
        const teams = teamsResponse.items || [];

        const teamMatches = teams
          .filter((team: Team) => {
            const name = (team.name || '').toLowerCase();
            const description = (team.description || '').toLowerCase();
            return name.includes(query) || description.includes(query);
          })
          .slice(0, 3) // Limit to 3 team results
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
      } catch (error) {
        console.error('Error searching teams:', error);
      }

      // Limit total results to 10
      setSearchResults(results.slice(0, 10));
      setShowSearchResults(results.length > 0);
      setSelectedResultIndex(-1);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle search input change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);

    if (result.type === 'employee' && result.id) {
      // Navigate to employee manager with employee ID in state or query param
      // Note: You may need to adjust this based on how your EmployeeManager handles viewing specific employees
      navigate('/dashboard/EmployeeManager', {
        state: { employeeId: result.id, viewEmployee: true },
      });
    } else if (result.type === 'team' && result.id) {
      // Navigate to teams page
      navigate('/dashboard/teams', {
        state: { teamId: result.id },
      });
    } else {
      // Navigate to route
      navigate(`/dashboard/${result.path}`);
    }
  };

  // Handle keyboard navigation in search
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSearchKeyDown = (
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleClickAway = (event: MouseEvent | TouchEvent) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.target as Node)
    ) {
      setShowSearchResults(false);
    }
  };

  // Close search results on route change
  React.useEffect(() => {
    setShowSearchResults(false);
    setSearchQuery('');
  }, [location.pathname]);

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
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                flex: 1,
                maxWidth: '300px',
              }}
            >
              <Search>
                <StyledInputBase
                  placeholder={lang.search}
                  inputProps={{ 'aria-label': 'search' }}
                  sx={{
                    color: 'var(--text-color)',
                    '& input': {
                      backgroundColor: 'transparent',
                    },
                  }}
                />
              </Search>
              <IconButton
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
            </Box>
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
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            mt: 1.5,
            px: { xs: 0 },
          }}
        >
          <Search
            sx={{
              flex: 1,
              height: { xs: '36px', md: '44px' },
              position: 'relative',
            }}
          >
            <StyledInputBase
              placeholder={lang.search}
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                color: 'var(--text-color)',
                fontSize: { xs: '12px', md: 'var(--body-font-size)' },
                pr: { xs: '40px', md: '16px' },
                '& input': {
                  backgroundColor: 'transparent',
                },
              }}
            />
            <IconButton
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
        </Box>
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
