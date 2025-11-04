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
  CardGiftcard,
  History,
  Insights,
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

interface SubItem {
  label: string;
  path: string;
}
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
}
interface SidebarProps {
  rtlMode: boolean;
  setRtlMode: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onMenuItemClick?: () => void;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <Dashboard />,
    subItems: [{ label: 'Dashboard', path: '' }],
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
    subItems: [{ label: 'Add Tenant', path: 'tenant' }],
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
    subItems: [
      { label: 'Employee List', path: 'EmployeeManager' },
      { label: 'Tenant Employees', path: 'TenantEmployees' },
    ],
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
      { label: 'System Assets Overview', path: 'assets/system-admin' },
    ],
  },
  {
    label: 'Attendance',
    icon: <Receipt />,
    subItems: [
      { label: 'Attendance', path: 'AttendanceCheck' },
      { label: 'Daily Attendance', path: 'AttendanceTable' },
      { label: 'Reports', path: 'Reports' },
      { label: 'Report', path: 'attendance-summary' },
      { label: 'Leave Request', path: 'leaves' },
    ],
  },
  {
    label: 'Benefits',
    icon: <CardGiftcard />,
    subItems: [
      { label: 'Benefits List', path: 'benefits-list' },
      { label: 'Employee Benefits', path: 'employee-benefit' },
      { label: 'Benefit Details', path: 'benefit-details' },
      { label: 'Benefits Report', path: 'benefit-report' },
    ],
  },
  {
    label: 'Performance',
    icon: <Insights />,
    subItems: [
      { label: 'Employee Performance', path: 'performance-dashboard' },
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
    label: 'Audit Logs',
    icon: <History />,
    subItems: [{ label: 'Audit Logs', path: 'audit-logs' }],
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
  const { companyDetails, companyLogo, setCompanyDetails, setCompanyLogo } =
    useCompany();
  const role = user?.role;

  const [openItem, setOpenItem] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const filteredMenuItems = useMemo(() => {
    const userRole = typeof role === 'string' ? role : (role as unknown)?.name;

    const filtered = menuItems
      .filter(item => {
        const isVisible = isMenuVisibleForRole(item.label, userRole);
        return isVisible;
      })
      .map(item => ({
        ...item,
        subItems: item.subItems.filter(sub => {
          const isSubVisible = isSubMenuVisibleForRole(
            item.label,
            sub.label,
            userRole
          );

          return isSubVisible;
        }),
      }));
    return filtered;
  }, [role]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const details = await companyApi.getCompanyDetails();
        setCompanyDetails(details);

        if (details.tenant_id) {
          const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
          setCompanyLogo(logoUrl);
        } else {
          setCompanyLogo(null);
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [setCompanyDetails, setCompanyLogo]);

  useEffect(() => {
    let currentPath = location.pathname.replace('/dashboard/', '');
    if (location.pathname === '/dashboard') currentPath = '';

    let matched = false;
    for (const item of filteredMenuItems) {
      const matchedSub = item.subItems?.find(sub => sub.path === currentPath);
      if (matchedSub) {
        setOpenItem(item.label);
        setActiveSubItem(matchedSub.label);
        matched = true;
        break;
      }
      if (item.path === currentPath) {
        setOpenItem(item.label);
        setActiveSubItem('');
        matched = true;
        break;
      }
    }
    if (!matched) {
      setOpenItem('');
      setActiveSubItem('');
    }
  }, [location.pathname, filteredMenuItems]);

  const handleSubItemClick = (parent: string, subLabel: string) => {
    setOpenItem(parent);
    setActiveSubItem(subLabel);
    onMenuItemClick?.();
  };

  const companyName = companyDetails?.company_name || 'Trans Global Services';

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
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              minWidth: 60,
              minHeight: 60,
              bgcolor: 'white',
              color: '#464b8a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 22,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {loading ? (
              <Skeleton
                variant='circular'
                width='100%'
                height='100%'
                sx={{ borderRadius: '50%' }}
              />
            ) : companyLogo ? (
              <Box
                component='img'
                src={companyLogo}
                alt='Company Logo'
                loading='lazy'
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Clipboard />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 18,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={companyName || 'HRMS'}
            >
              {companyName.length > 15
                ? companyName.slice(0, 18) + '...'
                : companyName}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          px: 1,
        }}
      >
        <List>
          {filteredMenuItems.map(item => {
            const isParentActive = openItem === item.label;
            const hasSubMenu = item.subItems && item.subItems.length > 0;
            const isDirectLink = !hasSubMenu && item.path;

            return (
              <Box key={item.label}>
                {isDirectLink ? (
                  <ListItemButton
                    component={NavLink}
                    to={`/dashboard/${item.path}`}
                    onClick={() => {
                      setOpenItem(item.label);
                      setActiveSubItem('');
                      onMenuItemClick?.();
                    }}
                    sx={{
                      color: location.pathname.includes(item.path)
                        ? 'orange'
                        : 'white',
                      pl: 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname.includes(item.path)
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
                      {item.subItems && (
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
                      )}
                    </ListItemButton>

                    <Collapse in={isParentActive} timeout='auto' unmountOnExit>
                      <List component='div' disablePadding>
                        {item.subItems?.map(sub => (
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

      <Box sx={{ px: 2, pb: 2, pt: 1, bottom: 0, zIndex: 10 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={1}
        >
          <Typography variant='body2'>Enable Dark Mode!</Typography>
          <Switch checked={darkMode} onChange={toggleTheme} />
        </Box>
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
