import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Switch,
  Skeleton,
} from '@mui/material';
import {
  Dashboard,
  BusinessCenter,
  ConfirmationNumber,
  People,
  Group,
  Receipt,
  Payments,
  Apps,
  Code,
  Widgets,
  Inventory,
} from '@mui/icons-material';
import dotted from './../assets/dashboardIcon/dotted-down.svg';
import Clipboard from '../assets/dashboardIcon/Clipboard';
import bubbleleft from '../assets/dashboardIcon/bubble-left.svg';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../theme/hooks';
import { useCompany } from '../context/CompanyContext';
import companyApi from '../api/companyApi';
import {
  isMenuVisibleForRole,
  isSubMenuVisibleForRole,
} from '../utils/permissions';

//Types
interface SubItem {
  label: string;
  path: string;
}
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  subItems: SubItem[];
}
interface SidebarProps {
  rtlMode: boolean;
  setRtlMode: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onMenuItemClick?: () => void;
}

//  Menu data
const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <Dashboard />,
    subItems: [{ label: 'HR Dashboard', path: '' }],
  },
  {
    label: 'Projects',
    icon: <BusinessCenter />,
    subItems: [
      { label: 'Project List', path: 'project-list' },
      { label: 'Add Project', path: 'add-project' },
    ],
  },
  {
    label: 'Tenant',
    icon: <ConfirmationNumber />,
    subItems: [
      { label: 'Add Tenant', path: 'tenant' },
    ],
  },
  {
    label: 'Department',
    icon: <People />,
    subItems: [
      { label: 'Department List', path: 'departments' },
      { label: 'Add Designation', path: 'Designations' },
      { label: 'User List', path: 'UserList' },
      { label: 'Policies', path: 'policies' },
      { label: 'Holidays', path: 'holidays' },
    ],
  },
  {
    label: 'Employees',
    icon: <Group />,
    subItems: [{ label: 'Employee List', path: 'EmployeeManager' }],
  },
  {
    label: 'Teams',
    icon: <Group />,
    subItems: [{ label: 'Team Management', path: 'teams' }],
  },
  {
    label: 'Assets',
    icon: <Inventory />,
    subItems: [
      { label: 'Asset Inventory', path: 'assets' },
      { label: 'Asset Requests', path: 'assets/requests' },
      { label: 'Management', path: 'assets/request-management' },
    ],
  },
  {
    label: 'Attendance',
    icon: <Receipt />,
    subItems: [
      { label: 'Attendance', path: 'AttendanceCheck' },
      { label: 'Attendance Table', path: 'AttendanceTable' },
      { label: 'Reports', path: 'Reports' },
      { label: 'Leave Request', path: 'leaves' },
    ],
  },
  {
    label: 'Accounts',
    icon: <Receipt />,
    subItems: [
      { label: 'Invoice', path: 'invoice' },
      { label: 'Payments', path: 'payments' },
    ],
  },
  {
    label: 'Payroll',
    icon: <Payments />,
    subItems: [
      { label: 'Payroll Summary', path: 'payroll-summary' },
      { label: 'Payslips', path: 'payslips' },
    ],
  },
  {
    label: 'App',
    icon: <Apps />,
    subItems: [
      { label: 'Chat', path: 'chat' },
      { label: 'Calendar', path: 'calendar' },
    ],
  },
  {
    label: 'Other Pages',
    icon: <Code />,
    subItems: [
      { label: 'Login', path: 'login' },
      { label: 'Register', path: 'register' },
      { label: 'Error', path: 'error' },
    ],
  },
  {
    label: 'UI Components',
    icon: <Widgets />,
    subItems: [
      { label: 'Buttons', path: 'buttons' },
      { label: 'Cards', path: 'cards' },
      { label: 'Modals', path: 'modals' },
    ],
  },
];

export default function Sidebar({ darkMode, onMenuItemClick }: SidebarProps) {
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const { user } = useUser();
  const { companyName } = useCompany();
  const [sidebarLogo, setSidebarLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const role = user?.role;
  const [openItem, setOpenItem] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');

  // Filter menu items based on role
  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item =>
        isMenuVisibleForRole(
          item.label,
          typeof role === 'string' ? role : (role as unknown)?.name
        )
      )
      .map(item => ({
        ...item,
        subItems: item.subItems.filter(sub =>
          isSubMenuVisibleForRole(
            item.label,
            sub.label,
            typeof role === 'string' ? role : (role as unknown)?.name
          )
        ),
      }));
  }, [role]);

  // Fetch company logo using same API as company details modal
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user) return;
      
      setLogoLoading(true);
      try {
        const details = await companyApi.getCompanyDetails();
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setSidebarLogo(logoUrl);
      } catch (err) {
        console.error('Failed to fetch company logo for sidebar:', err);
        setSidebarLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    // Only fetch if user exists (after login)
    if (user) {
      fetchCompanyLogo();
    } else {
      // console.log('Sidebar: No user found, skipping logo fetch');
    }
  }, [user]);

  // Listen for logo updates from other components
  useEffect(() => {
    const handleLogoUpdate = async () => {
      if (!user) return;
      
      setLogoLoading(true);
      try {
        const details = await companyApi.getCompanyDetails();
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setSidebarLogo(logoUrl);
      } catch (err) {
        console.error('Failed to fetch company logo for sidebar:', err);
        setSidebarLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    // Listen for custom event when logo is updated
    window.addEventListener('logoUpdated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, [user]);

  // Auto expand parent & highlight subitem on URL change
  useEffect(() => {
    let currentPath = location.pathname.replace('/dashboard/', '');
    if (location.pathname === '/dashboard') {
      currentPath = ''; // handle Hr Dashboard
    }

    for (const item of filteredMenuItems) {
      const matchedSub = item.subItems.find(sub => sub.path === currentPath);
      if (matchedSub) {
        setOpenItem(item.label);
        setActiveSubItem(matchedSub.label);
        break;
      }
    }
  }, [location.pathname, filteredMenuItems]);

  const handleSubItemClick = (parent: string, subLabel: string) => {
    setOpenItem(parent);
    setActiveSubItem(subLabel);
    // Close sidebar on mobile when menu item is clicked
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  return (
    <Box
      sx={{
        color: 'white',
        borderRadius: '12px 0 0 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Open Sans, sans-serif',
        height: '100%',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {/* Top Section */}
      <Box>
        <Box sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'white',
              color: '#464b8a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 22,
              // p: 1,
              overflow: 'hidden',
            }}
          >
            {logoLoading ? (
              <Skeleton
                variant="circular"
                width="100%"
                height="100%"
                borderRadius="50%"
              />
            ) : sidebarLogo ? (
              <Box
                component="img"
                src={sidebarLogo}
                alt="Company Logo"
                loading="lazy"
                width="100%"
                height="100%"
                borderRadius="50%"
              />
            ) : (
              <Clipboard />
            )}
          </Box>
          <Typography sx={{ mt: 1, fontWeight: '700', fontSize: '18px' }}>
            {companyName}
          </Typography>
        </Box>

        {/* Sidebar Menu */}
        <List>
          {filteredMenuItems.map(item => {
            const isParentActive = openItem === item.label;
            const isDirectLink =
              item.subItems.length === 1 && item.subItems[0].path === '';

            return (
              <Box key={item.label}>
                {isDirectLink ? (
                  // Direct link for single sub-item with empty path (like HR Dashboard)
                  <ListItemButton
                    component={NavLink}
                    to='/dashboard'
                    onClick={() => {
                      handleSubItemClick(item.label, item.subItems[0].label);
                    }}
                    sx={{
                      color:
                        activeSubItem === item.subItems[0].label
                          ? 'orange'
                          : 'white',
                      pl: 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          activeSubItem === item.subItems[0].label
                            ? 'orange'
                            : 'white',
                        minWidth: '36px',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                ) : (
                  // Collapsible menu for multiple sub-items
                  <>
                    <ListItemButton
                      onClick={() =>
                        setOpenItem(isParentActive ? '' : item.label)
                      }
                      sx={{
                        color: isParentActive ? 'orange' : 'white',
                        pl: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isParentActive ? 'orange' : 'white',
                          minWidth: '36px',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                      <img
                        src={dotted}
                        alt='dotted'
                        style={{
                          width: 23,
                          height: 23,
                          filter:
                            'invert(57%) sepia(9%) saturate(388%) hue-rotate(195deg) brightness(89%) contrast(85%)',
                        }}
                      />
                    </ListItemButton>

                    <Collapse in={isParentActive} timeout='auto' unmountOnExit>
                      <List component='div' disablePadding>
                        {item.subItems.map(sub => (
                          <ListItemButton
                            key={sub.path}
                            component={NavLink}
                            to={`/dashboard/${sub.path}`}
                            onClick={() =>
                              handleSubItemClick(item.label, sub.label)
                            }
                            sx={{
                              pl: 6,
                              fontSize: '14px',
                              color:
                                activeSubItem === sub.label
                                  ? 'orange'
                                  : 'white',
                            }}
                          >
                            <ListItemText primary={sub.label} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
      {/* Bottom Settings */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={1}
        >
          <Typography variant='body2'>Enable Dark Mode!</Typography>
          <Switch checked={darkMode} onChange={toggleTheme} />
        </Box>
       

        {/* Collapse Icon */}
        <Box textAlign='center' mt={2}>
          <Box
            component='img'
            src={bubbleleft}
            alt='bubble'
            sx={{
              width: 40,
              height: 40,
              filter: 'brightness(0) invert(1)',
              borderBottom: '4px solid white',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
