import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useTheme } from '../../theme/hooks';
import {
  isMenuVisibleForRole,
  isSubMenuVisibleForRole,
} from '../../utils/permissions';
import { clearAuthData } from '../../utils/authValidation';
import { Icons } from '../../assets/icons';

interface SubItem {
  label: string;
  path: string;
}
interface MenuItem {
  label: string;
  icon: string;
  iconFill: string;
  path?: string;
  subItems?: SubItem[];
}

const MenuIcon: React.FC<{
  src: string;
  srcFill?: string;
  isActive?: boolean;
  size?: number;
  useOriginalColor?: boolean;
}> = ({
  src,
  srcFill,
  isActive = false,
  size = 24,
  useOriginalColor = false,
}) => {
  // CSS filter to convert fill icon to primary color (#3083dc)
  const primaryColorFilter =
    'brightness(0) saturate(100%) invert(48%) sepia(95%) saturate(2476%) hue-rotate(195deg) brightness(98%) contrast(101%)';

  // CSS filter for inactive icons (black)
  const inactiveFilter = 'brightness(0) saturate(100%)';

  const iconSrc = isActive && srcFill ? srcFill : src;

  const iconFilter = useOriginalColor
    ? 'none'
    : isActive && srcFill
      ? primaryColorFilter
      : inactiveFilter;

  return (
    <Box
      component='img'
      src={iconSrc}
      alt=''
      sx={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        objectFit: 'contain',
        filter: iconFilter,
        transition: 'filter 0.2s ease',
      }}
    />
  );
};
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
    icon: Icons.dashboard,
    iconFill: Icons.dashboardFill,
    subItems: [{ label: 'Dashboard', path: '' }],
  },
  {
    label: 'Department',
    icon: Icons.department,
    iconFill: Icons.departmentFill,
    subItems: [
      { label: 'Department List', path: 'departments' },
      { label: 'Designation', path: 'Designations' },
      { label: 'User List', path: 'UserList' },
      { label: 'Policies', path: 'policies' },
      { label: 'Holidays', path: 'holidays' },
    ],
  },
  {
    label: 'Employees',
    icon: Icons.employee,
    iconFill: Icons.employeeFill,
    subItems: [
      { label: 'Employee List', path: 'EmployeeManager' },
      { label: 'Tenant Employees', path: 'TenantEmployees' },
    ],
  },
  {
    label: 'Teams',
    icon: Icons.teams,
    iconFill: Icons.teamsFill,
    subItems: [{ label: 'Team Management', path: 'teams' }],
  },
  {
    label: 'Assets',
    icon: Icons.assets,
    iconFill: Icons.assetsFill,
    subItems: [
      { label: 'Asset Inventory', path: 'assets' },
      { label: 'Asset Requests', path: 'assets/requests' },
      { label: 'Management', path: 'assets/request-management' },
      { label: 'Assets Overview', path: 'assets/system-admin' },
    ],
  },
  {
    label: 'Attendance',
    icon: Icons.attendance,
    iconFill: Icons.attendanceFill,
    subItems: [
      { label: 'Attendance', path: 'AttendanceCheck' },
      { label: 'Daily Attendance', path: 'AttendanceTable' },
      { label: 'Report', path: 'attendance-summary' },
      { label: 'Leave Request', path: 'leaves' },
    ],
  },
  {
    label: 'Leave Analytics',
    icon: Icons.leaveAnalytics,
    iconFill: Icons.leaveAnalyticsFill,
    subItems: [
      { label: 'Reports', path: 'Reports' },
      { label: 'Cross Tenant Leaves', path: 'cross-tenant-leaves' },
    ],
  },
  {
    label: 'Benefits',
    icon: Icons.benefits,
    iconFill: Icons.benefitsFill,
    subItems: [
      { label: 'Benefits List', path: 'benefits-list' },
      { label: 'Employee Benefits', path: 'employee-benefit' },
      { label: 'Benefit Details', path: 'benefit-details' },
      { label: 'Benefits Report', path: 'benefit-report' },
    ],
  },
  {
    label: 'Payroll',
    icon: Icons.payroll,
    iconFill: Icons.payrollFill,
    subItems: [
      { label: 'Payroll Configuration', path: 'payroll-configuration' },
      { label: 'Employee Salary', path: 'employee-salary' },
      { label: 'Payroll Records', path: 'payroll-records' },
      { label: 'Payroll Reports', path: 'payroll-reports' },
      { label: 'My Salary', path: 'my-salary' },
    ],
  },
];

export default function Sidebar({ darkMode, onMenuItemClick }: SidebarProps) {
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const role = user?.role;

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const [openItem, setOpenItem] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');

  const filteredMenuItems = useMemo(() => {
    const userRole =
      typeof role === 'string'
        ? role
        : (role as unknown as { name?: string })?.name || '';

    const filtered = menuItems
      .filter(item => {
        const isVisible = isMenuVisibleForRole(item.label, userRole);
        return isVisible;
      })
      .map(item => ({
        ...item,
        subItems: (item.subItems || []).filter(sub => {
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

  return (
    <Box
      sx={{
        backgroundColor: 'var(--white-color)',
        color: 'var(--text-color)',
        borderRadius: 'var(--border-radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'SF Pro Rounded, sans-serif',
        height: '100%',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Box sx={{ position: 'sticky', top: 0, zIndex: 20, px: 3, py: 5, mb: 1 }}>
          <Box
            sx={{
            position: 'absolute',
            top: '40px',
            bottom: '40px',
              display: 'flex',
              alignItems: 'center',
            gap: 1,
          }}
        >
              <Box
                component='img'
            src={Icons.logoSidebar}
            alt='Logo'
                sx={{
              height: 'auto',
              width: 'auto',
            }}
          />
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
            const hasSingleSubItem =
              item.subItems && item.subItems.length === 1;
            const isDirectLink = !hasSubMenu && item.path;

            if (hasSingleSubItem) {
              const singleSubItem = item.subItems[0];
              const linkPath =
                singleSubItem.path === ''
                  ? '/dashboard'
                  : `/dashboard/${singleSubItem.path}`;
              const isActive =
                location.pathname === linkPath ||
                (singleSubItem.path === '' &&
                  location.pathname === '/dashboard');

              return (
                <Box key={item.label}>
                  <ListItemButton
                    component={NavLink}
                    to={linkPath}
                    onClick={() => {
                      setOpenItem(item.label);
                      setActiveSubItem(singleSubItem.label);
                      onMenuItemClick?.();
                    }}
                    sx={{
                      color: isActive
                        ? 'var(--primary-dark-color)'
                        : 'var(--text-color)',
                      pl: 2,
                      py: 1.5,
                      mx: 1.5,
                      mb: 0.5,
                      backgroundColor: isActive
                        ? 'var(--light-grey-200-color)'
                        : 'transparent',
                      borderRadius: isActive ? 'var(--border-radius-lg)' : 0,
                      '&:hover': {
                        backgroundColor: isActive
                          ? 'var(--light-grey-200-color)'
                          : 'var(--white-100-color)',
                        borderRadius: 'var(--border-radius-lg)',
                      },
                    }}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-hidden='true'
                    >
                      <MenuIcon
                        src={item.icon}
                        srcFill={item.iconFill}
                        isActive={isActive}
                        size={24}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 'var(--body-font-size)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </Box>
              );
            }

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
                      color:
                        item.path && location.pathname.includes(item.path)
                          ? 'var(--primary-dark-color)'
                          : 'var(--text-color)',
                      pl: 2,
                      py: 1.5,
                      mx: 1.5,
                      mb: 0.5,
                      backgroundColor:
                        item.path && location.pathname.includes(item.path)
                          ? 'var(--light-grey-200-color)'
                          : 'transparent',
                      borderRadius:
                        item.path && location.pathname.includes(item.path)
                          ? 'var(--border-radius-lg)'
                          : 0,
                      '&:hover': {
                        backgroundColor:
                          item.path && location.pathname.includes(item.path)
                            ? 'var(--light-grey-200-color)'
                            : 'var(--white-100-color)',
                        borderRadius: 'var(--border-radius-lg)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MenuIcon
                        src={item.icon}
                        srcFill={item.iconFill}
                        isActive={
                          !!(item.path && location.pathname.includes(item.path))
                        }
                        size={24}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 'var(--body-font-size)',
                        fontWeight:
                          item.path && location.pathname.includes(item.path)
                            ? 600
                            : 400,
                      }}
                    />
                  </ListItemButton>
                ) : (
                  <>
                    <ListItemButton
                      onClick={() =>
                        setOpenItem(isParentActive ? '' : item.label)
                      }
                      sx={{
                        color: isParentActive
                          ? 'var(--primary-dark-color)'
                          : 'var(--text-color)',
                        pl: 2,
                        py: 1.5,
                        mx: 1.5,
                        mb: 0.5,
                        backgroundColor: isParentActive
                          ? 'var(--light-grey-200-color)'
                          : 'transparent',
                        borderRadius: isParentActive
                          ? 'var(--border-radius-lg)'
                          : 0,
                        '&:hover': {
                          backgroundColor: isParentActive
                            ? 'var(--light-grey-200-color)'
                            : 'var(--white-100-color)',
                          borderRadius: 'var(--border-radius-lg)',
                        },
                      }}
                      aria-label={`${item.label} menu`}
                      aria-expanded={isParentActive}
                      aria-controls={`${item.label}-submenu`}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-hidden='true'
                      >
                        <MenuIcon
                          src={item.icon}
                          srcFill={item.iconFill}
                          isActive={isParentActive}
                          size={24}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 'var(--body-font-size)',
                          fontWeight: isParentActive ? 600 : 400,
                        }}
                      />
                      {item.subItems && item.subItems.length > 1 && (
                        <Box
                          component='img'
                          src={Icons.arrowUp}
                          alt=''
                          sx={{
                            width: 16,
                            height: 16,
                            transform: isParentActive
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            filter: 'brightness(0) saturate(100%)',
                          }}
                        />
                      )}
                    </ListItemButton>

                    <Collapse
                      in={isParentActive}
                      timeout='auto'
                      unmountOnExit
                      id={`${item.label}-submenu`}
                    >
                      <List component='div' disablePadding role='menu'>
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
                              py: 1,
                              fontSize: 'var(--body-font-size)',
                              color:
                                activeSubItem === sub.label
                                  ? 'var(--primary-dark-color)'
                                  : 'var(--text-color)',
                              '&:hover': {
                                backgroundColor: 'var(--white-100-color)',
                                borderRadius: 'var(--border-radius-lg)',
                              },
                            }}
                            role='menuitem'
                            aria-label={`Navigate to ${sub.label}`}
                          >
                            <ListItemText
                              primary={sub.label}
                              primaryTypographyProps={{
                                fontSize: 'var(--body-font-size)',
                                fontWeight:
                                  activeSubItem === sub.label ? 600 : 400,
                              }}
                            />
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

      <Box sx={{ px: 3, pb: 3, pt: 2, bottom: 0, zIndex: 10 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={2}
        >
          <Typography
            variant='body2'
            component='label'
            htmlFor='dark-mode-switch'
            sx={{
              color: 'var(--text-color)',
              fontSize: 'var(--body-font-size)',
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            Dark Mode
          </Typography>
          <Box
            component='button'
            id='dark-mode-switch'
            onClick={toggleTheme}
            aria-label='Toggle dark mode'
            role='switch'
            aria-checked={darkMode}
            sx={{
              position: 'relative',
              width: 50,
              height: 20,
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              outline: 'none',
              '&:focus-visible': {
                outline: '2px solid var(--primary-dark-color)',
                outlineOffset: '2px',
                borderRadius: '12px',
              },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                backgroundColor: darkMode
                  ? 'var(--primary-dark-color)'
                  : 'var(--light-grey-color)',
                transition: 'background-color 300ms ease',
              }}
            />
            <Box
            sx={{
                position: 'absolute',
                top: '2px',
                left: darkMode ? '22px' : '2px',
                width: 25,
                height: 16,
                borderRadius: '40%',
                backgroundColor: 'var(--white-color)',
                // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'left 300ms ease',
            }}
          />
        </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: 'var(--secondary-color)',
            pl: 0.25,
            py: 1.5,
            borderRadius: 'var(--border-radius-lg)',
            '&:hover': {
              backgroundColor: 'rgba(198, 25, 82, 0.1)',
              borderRadius: 'var(--border-radius-lg)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: 'var(--secondary-color)',
              minWidth: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
            }}
          >
            <Box
              component='img'
              src={Icons.logout}
              alt=''
              sx={{
                width: 24,
                height: 24,
                filter:
                  'brightness(0) saturate(100%) invert(20%) sepia(95%) saturate(5000%) hue-rotate(320deg) brightness(90%) contrast(90%)',
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary='Logout'
            primaryTypographyProps={{
              fontSize: 'var(--body-font-size)',
              fontWeight: 500,
              color: 'var(--secondary-color)',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}