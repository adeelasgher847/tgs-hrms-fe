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
  AppBar,
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
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import UserAvatar from '../common/UserAvatar';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AddIcon from '@mui/icons-material/Add';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';
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
  borderRadius: '6px',
  backgroundColor: '#efefef',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '300px',
    flexGrow: 0,
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000',
  marginRight: theme.spacing(1),
}));

const StyledInputBase = styled(InputBase)(() => ({
  fontSize: '16px',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: '0 !important',
    '&::placeholder': {
      color: '#b3b3b3',
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
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position='static'
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          color: darkMode ? 'white' : 'black',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, md: 3 },
            gap: '10px',
            display: { xs: 'block', sm: 'flex' },
            justifyContent: { xs: 'center', sm: 'space-between' },
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 0 }}>
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box
                ref={searchContainerRef}
                sx={{
                  position: 'relative',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: darkMode ? '#262727' : '#efefef',
                    borderRadius: '6px',
                    px: 1,
                    height: '44px',
                  }}
                >
                  <Search
                    sx={{
                      backgroundColor: 'transparent',
                      height: '100%',
                      paddingLeft: 0,
                    }}
                  >
                    <SearchIconWrapper>
                      <SearchIcon
                        sx={{
                          color: darkMode ? '#8f8f8f' : '#000',
                        }}
                      />
                    </SearchIconWrapper>
                    <StyledInputBase
                      inputRef={searchInputRef}
                      fullWidth
                      placeholder={lang.search}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSearchResults(true);
                        }
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (searchQuery.trim()) {
                          setShowSearchResults(true);
                        }
                      }}
                      inputProps={{
                        'aria-label': 'search',
                        type: 'text',
                        autoComplete: 'off',
                      }}
                      sx={{
                        transition: 'all 0.3s ease-in-out',
                        color: darkMode ? 'white' : 'black',
                        width: '100%',
                        flex: 1,
                        minWidth: 0,
                        cursor: 'text',
                        '& .MuiInputBase-input': {
                          padding: '0 !important',
                          height: '43px',
                          backgroundColor: 'transparent',
                          cursor: 'text',
                          '&::placeholder': {
                            color: darkMode ? '#8f8f8f' : '#b3b3b3',
                            opacity: 1,
                          },
                        },
                        '&:focus-within': {
                          '& .MuiInputBase-input': {
                            height: '45px',
                          },
                        },
                      }}
                    />
                  </Search>

                  <Box
                    sx={{
                      display: { xs: 'block', sm: 'none' },
                      borderRadius: '6px',
                      p: '6px',
                    }}
                  >
                    <IconButton
                      onClick={handleOpenTeamMembersModal}
                      aria-label='Open team members modal'
                      size='small'
                      sx={{
                        p: '6px',
                      }}
                    >
                      <AddIcon
                        sx={{
                          color: '#555',
                          fontSize: '26px',
                          width: '31px',
                          height: '31px',
                        }}
                        aria-hidden='true'
                      />
                    </IconButton>
                  </Box>
                </Box>

                {/* Search Results Dropdown */}
                {(showSearchResults || isSearching) && (
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
                      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    {isSearching ? (
                      <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            color: darkMode ? '#8f8f8f' : '#666',
                          }}
                        >
                          Searching...
                        </Typography>
                      </Box>
                    ) : searchResults.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {searchResults.map((result, index) => {
                          const IconComponent =
                            result.icon ||
                            (result.type === 'route' ? (
                              <FolderIcon fontSize='small' />
                            ) : result.type === 'employee' ? (
                              <PersonIcon fontSize='small' />
                            ) : result.type === 'team' ? (
                              <GroupIcon fontSize='small' />
                            ) : result.type === 'asset' ? (
                              <InventoryIcon fontSize='small' />
                            ) : (
                              <FolderIcon fontSize='small' />
                            ));

                          return (
                            <ListItemButton
                              key={`${result.type}-${result.id || result.path}-${index}`}
                              selected={index === selectedResultIndex}
                              onClick={() => handleSearchResultClick(result)}
                              sx={{
                                py: 1.5,
                                px: 2,
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255, 255, 255, 0.15)'
                                    : 'rgba(0, 0, 0, 0.08)',
                                  '&:hover': {
                                    backgroundColor: darkMode
                                      ? 'rgba(255, 255, 255, 0.2)'
                                      : 'rgba(0, 0, 0, 0.12)',
                                  },
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 36,
                                  color: darkMode ? '#8f8f8f' : '#666',
                                }}
                              >
                                {IconComponent}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      color: darkMode ? '#fff' : '#000',
                                    }}
                                  >
                                    {result.label}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    sx={{
                                      fontSize: '12px',
                                      color: darkMode ? '#8f8f8f' : '#666',
                                      mt: 0.5,
                                    }}
                                  >
                                    {result.subtitle || result.category}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    ) : null}
                  </Paper>
                )}

                {/* No Results Message */}
                {showSearchResults &&
                  searchQuery.trim() &&
                  searchResults.length === 0 && (
                    <Paper
                      elevation={4}
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        zIndex: 1300,
                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        p: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: darkMode ? '#8f8f8f' : '#666',
                          textAlign: 'center',
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
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 3, md: 2 },
              }}
            >
              {/* <IconButton
                sx={{
                  backgroundColor: '#4b4f73',
                  color: 'white',
                  width: 28,
                  height: 28,
                }}
              >
                <InfoOutlinedIcon fontSize='small' />
              </IconButton> */}
              <Button
                variant='text'
                size='small'
                onClick={e => setLangAnchorEl(e.currentTarget)}
                sx={{
                  minWidth: 0,
                  px: 0,
                  color: textColor,
                  fontWeight: 600,
                }}
                aria-label={`Current language: ${language === 'en' ? 'English' : 'Arabic'}. Click to change language`}
                aria-haspopup='true'
                aria-expanded={langMenuOpen}
              >
                {language === 'en' ? 'EN' : 'عربي'}
              </Button>
              <TeamMembersAvatar
                maxAvatars={5}
                onOpenInviteModal={onOpenInviteModal}
                darkMode={darkMode}
              />

              <IconButton
                sx={{ xs: { padding: '8px' }, md: { padding: '0px' } }}
                aria-label='Notifications'
                aria-describedby='notifications-badge'
              >
                <Badge variant='dot' color='error' id='notifications-badge'>
                  <NotificationsNoneOutlinedIcon
                    sx={{ color: textColor }}
                    aria-hidden='true'
                  />
                </Badge>
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  variant='subtitle2'
                  sx={{ fontWeight: 600, fontSize: '14px' }}
                  color={textColor}
                >
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </Typography>
                <Typography variant='caption' color={textColor}>
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
              <IconButton
                onClick={handleMenuOpen}
                aria-label={`User menu for ${user ? `${user.first_name} ${user.last_name}` : 'user'}`}
                aria-haspopup='true'
                aria-expanded={open}
              >
                {user ? (
                  <UserAvatar user={user} size={50} clickable={false} />
                ) : (
                  <img
                    src='./avatar.png'
                    alt=''
                    aria-hidden='true'
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </IconButton>
              {/* Language Toggle */}
              {/* <ToggleButtonGroup
                value={language}
                exclusive
                onChange={(_, value) => value && setLanguage(value)}
                size='small'
              >
                <ToggleButton
                  value='en'
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: COLORS.PRIMARY,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                >
                  EN
                </ToggleButton>

                <ToggleButton
                  value='ar'
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: COLORS.PRIMARY,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                >
                  عربي
                </ToggleButton>
              </ToggleButtonGroup> */}
              <Menu
                anchorEl={langAnchorEl}
                open={langMenuOpen}
                onClose={() => setLangAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    borderRadius: '8px',
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
            </Box>
            <Box>
              <IconButton
                onClick={onToggleSidebar}
                sx={{ display: { xs: 'block', lg: 'none' } }}
                aria-label='Toggle sidebar menu'
                aria-expanded='false'
              >
                <MenuIcon sx={{ color: textColor }} aria-hidden='true' />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

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
