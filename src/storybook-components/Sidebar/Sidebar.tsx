import React, { useState, useMemo } from 'react';
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
  useMediaQuery,
  useTheme,
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
import AttendanceDatePickerComponent from '../AttendanceDatePicker/AttendanceDatePicker';
import DateNavigationComponent from '../DateNavigation/DateNavigation';
import dotted from '../../assets/dashboardIcon/dotted-down.svg';
import bubbleleft from '../../assets/dashboardIcon/bubble-left.svg';

// Mock company data
const mockCompanyData = {
  companyName: 'TechCorp Solutions',
  companyLogo: 'https://via.placeholder.com/60x60/464b8a/ffffff?text=TC',
};



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

export interface SidebarProps {
  darkMode?: boolean;
  onMenuItemClick?: () => void;
  responsive?: boolean;
  showAttendanceComponents?: boolean;
  companyName?: string;
  companyLogo?: string;
}

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
    subItems: [{ label: 'Employee List', path: 'EmployeeManager' }],
  },
  {
    label: 'Benefits',
    icon: <Payments />,
    subItems: [
      { label: 'Benefit List', path: 'benefits' },
      { label: 'Assign Benefits', path: 'benefits/assign' },
      { label: 'Reporting', path: 'benefits/reporting' },
      { label: 'My Benefits', path: 'my-benefits' },
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

const SidebarComponent: React.FC<SidebarProps> = ({
  darkMode = false,
  onMenuItemClick,
  responsive = false,
  showAttendanceComponents = false,
  companyName = mockCompanyData.companyName,
  companyLogo = mockCompanyData.companyLogo,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [openItem, setOpenItem] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');
  const [attendanceDateRange, setAttendanceDateRange] = useState<string[]>([]);
  const [attendanceSingleDate, setAttendanceSingleDate] = useState<string>('');
  const [dateNavigationCurrent, setDateNavigationCurrent] = useState('2024-01-15');

  const handleSubItemClick = (parent: string, subLabel: string) => {
    setOpenItem(parent);
    setActiveSubItem(subLabel);
    onMenuItemClick?.();
  };

  const getResponsiveStyles = () => {
    if (!responsive) {
      return {
        sidebar: {
          borderRadius: '12px 0 0 12px',
          px: 2,
        },
        logo: {
          width: 60,
          height: 60,
          fontSize: 22,
        },
        companyName: {
          fontSize: 18,
        },
        menuItem: {
          pl: 1,
        },
        subMenuItem: {
          pl: 6,
          fontSize: '14px',
        },
      };
    }

    if (isMobile) {
      return {
        sidebar: {
          borderRadius: '8px 0 0 8px',
          px: 1,
        },
        logo: {
          width: 40,
          height: 40,
          fontSize: 16,
        },
        companyName: {
          fontSize: 14,
        },
        menuItem: {
          pl: 0.5,
        },
        subMenuItem: {
          pl: 4,
          fontSize: '12px',
        },
      };
    }

    if (isTablet) {
      return {
        sidebar: {
          borderRadius: '10px 0 0 10px',
          px: 1.5,
        },
        logo: {
          width: 50,
          height: 50,
          fontSize: 18,
        },
        companyName: {
          fontSize: 16,
        },
        menuItem: {
          pl: 0.75,
        },
        subMenuItem: {
          pl: 5,
          fontSize: '13px',
        },
      };
    }

    return {
      sidebar: {
        borderRadius: '12px 0 0 12px',
        px: 2,
      },
      logo: {
        width: 60,
        height: 60,
        fontSize: 22,
      },
      companyName: {
        fontSize: 18,
      },
      menuItem: {
        pl: 1,
      },
      subMenuItem: {
        pl: 6,
        fontSize: '14px',
      },
    };
  };

  const styles = getResponsiveStyles();

  return (
    <Box
      sx={{
        color: 'white',
        ...styles.sidebar,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Open Sans, sans-serif',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#484c7f',
        minWidth: responsive ? (isMobile ? 200 : isTablet ? 250 : 280) : 280,
        maxWidth: responsive ? (isMobile ? 200 : isTablet ? 250 : 280) : 280,
      }}
    >
      {/* Header with Company Logo and Name */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              ...styles.logo,
              minWidth: styles.logo.width,
              minHeight: styles.logo.height,
              bgcolor: 'white',
              color: '#464b8a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
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
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                ...styles.companyName,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={companyName}
            >
              {companyName}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          px: 1,
        }}
      >
        <List>
          {menuItems.map(item => {
            const isParentActive = openItem === item.label;
            const hasSubMenu = item.subItems && item.subItems.length > 0;
            const isDirectLink = !hasSubMenu && item.path;

            return (
              <Box key={item.label}>
                {isDirectLink ? (
                  <ListItemButton
                    onClick={() => {
                      setOpenItem(item.label);
                      setActiveSubItem('');
                      onMenuItemClick?.();
                    }}
                    sx={{
                      color: 'white',
                      ...styles.menuItem,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: 'white',
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
                        ...styles.menuItem,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
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
                            onClick={() =>
                              handleSubItemClick(item.label, sub.label)
                            }
                            sx={{
                              ...styles.subMenuItem,
                              color:
                                activeSubItem === sub.label
                                  ? 'orange'
                                  : 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
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

      {/* Attendance Components Section */}
      {showAttendanceComponents && (
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontSize: '0.75rem' }}>
            Attendance Tools
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <AttendanceDatePickerComponent 
              value={attendanceDateRange}
              onChange={(value) => setAttendanceDateRange(value as string[])}
              placeholder="Date Range"
              range={true}
              responsive={responsive}
            />
            <DateNavigationComponent 
              currentDate={dateNavigationCurrent}
              onDateChange={setDateNavigationCurrent}
              responsive={responsive}
            />
          </Box>
        </Box>
      )}

      {/* Footer with Dark Mode Toggle */}
      <Box sx={{ px: 2, pb: 2, pt: 1, bottom: 0, zIndex: 10 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={1}
        >
          <Typography variant='body2' sx={{ fontSize: responsive ? (isMobile ? '0.7rem' : '0.8rem') : '0.875rem' }}>
            Enable Dark Mode!
          </Typography>
          <Switch 
            checked={darkMode} 
            onChange={() => console.log('Dark mode toggled')}
            size={responsive && isMobile ? 'small' : 'medium'}
          />
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
};

export default SidebarComponent;
