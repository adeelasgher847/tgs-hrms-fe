import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Switch,
} from "@mui/material";
import { useTheme } from "../theme";
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
} from "@mui/icons-material";
import dotted from "./../assets/dashboardIcon/dotted-down.svg";
import Clipboard from "../assets/dashboardIcon/Clipboard";
import bubbleleft from "../assets/dashboardIcon/bubble-left.svg";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

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
    label: "Dashboard",
    icon: <Dashboard />,
    subItems: [
      { label: "Hr Dashboard", path: "" },
      { label: "Project Dashboard", path: "project-dashboard" },
    ],
  },
  {
    label: "Projects",
    icon: <BusinessCenter />,
    subItems: [
      { label: "Project List", path: "project-list" },
      { label: "Add Project", path: "add-project" },
    ],
  },
  {
    label: "Tenant",
    icon: <ConfirmationNumber />,
    subItems: [
      { label: "Add Tenant", path: "tenant" },
      { label: "Create Ticket", path: "create-ticket" },
    ],
  },
  {
    label: "Department",
    icon: <People />,
    subItems: [
      { label: "Department List", path: "departments" },
      { label: "Add Designation", path: "Designations" },
      { label: "User List", path: "UserList" },
      { label: "UserProfile", path: "UserProfile" },
      { label: "User", path: "LeaveApprovalDialog" },
    ],
  },
  {
    label: "Employees",
    icon: <Group />,
    subItems: [
      { label: "Employee Profile", path: "EmployeeProfileView" },
      { label: "Employee List", path: "EmployeeManager" },
      { label: "Add Employee", path: "Add Employee" },
    ],
  },
  {
    label: "Attendance",
    icon: <Receipt />,
    subItems: [
      { label: "Attendance", path: "AttendanceCheck" },
      { label: "Attendance Table", path: "AttendanceTable" },
      { label: "Reports", path: "Reports" },
      { label: "Add Employee", path: "add-employee" },
      
      { label: "Leave Request", path: "leaves" },
    ],
  },
  {
    label: "Accounts",
    icon: <Receipt />,
    subItems: [
      { label: "Invoice", path: "invoice" },
      { label: "Payments", path: "payments" },
    ],
  },
  {
    label: "Payroll",
    icon: <Payments />,
    subItems: [
      { label: "Payroll Summary", path: "payroll-summary" },
      { label: "Payslips", path: "payslips" },
    ],
  },
  {
    label: "App",
    icon: <Apps />,
    subItems: [
      { label: "Chat", path: "chat" },
      { label: "Calendar", path: "calendar" },
    ],
  },
  {
    label: "Other Pages",
    icon: <Code />,
    subItems: [
      { label: "Login", path: "login" },
      { label: "Register", path: "register" },
      { label: "Error", path: "error" },
    ],
  },
  {
    label: "UI Components",
    icon: <Widgets />,
    subItems: [
      { label: "Buttons", path: "buttons" },
      { label: "Cards", path: "cards" },
      { label: "Modals", path: "modals" },
    ],
  },
];

export default function Sidebar({
  darkMode,
  onMenuItemClick,
}: SidebarProps) {
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const [openItem, setOpenItem] = useState<string>("");
  const [activeSubItem, setActiveSubItem] = useState<string>("");

  // Auto expand parent & highlight subitem on URL change
  useEffect(() => {
    let currentPath = location.pathname.replace("/dashboard/", "");
    if (location.pathname === "/dashboard") {
      currentPath = ""; // handle Hr Dashboard
    }

    for (const item of menuItems) {
      const matchedSub = item.subItems.find((sub) => sub.path === currentPath);
      if (matchedSub) {
        setOpenItem(item.label);
        setActiveSubItem(matchedSub.label);
        break;
      }
    }
  }, [location.pathname]);

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
        color: "white",
        borderRadius: "12px 0 0 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Open Sans, sans-serif",
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {/* Top Section */}
      <Box>
        <Box sx={{ py: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 45,
              height: 45,
              bgcolor: "white",
              color: "#464b8a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 22,
              p: 1,
            }}
          >
            <Clipboard />
          </Box>
          <Typography sx={{ mt: 1, fontWeight: "700", fontSize: "18px" }}>
            My-Task
          </Typography>
        </Box>

        {/* Sidebar Menu */}
        <List>
          {menuItems.map((item) => {
            const isParentActive = openItem === item.label;
            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => setOpenItem(isParentActive ? "" : item.label)}
                  sx={{
                    color: isParentActive ? "orange" : "white",
                    pl: 1,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isParentActive ? "orange" : "white",
                      minWidth: "36px",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  <img
                    src={dotted}
                    alt="dotted"
                    style={{
                      width: 23,
                      height: 23,
                      filter:
                        "invert(57%) sepia(9%) saturate(388%) hue-rotate(195deg) brightness(89%) contrast(85%)",
                    }}
                  />
                </ListItemButton>

                <Collapse in={isParentActive} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((sub) => (
                      <ListItemButton
                        key={sub.path}
                        component={NavLink}
                        to={`/dashboard/${sub.path}`}
                        onClick={() =>
                          handleSubItemClick(item.label, sub.label)
                        }
                        sx={{
                          pl: 6,
                          fontSize: "14px",
                          color:
                            activeSubItem === sub.label ? "orange" : "white",
                        }}
                      >
                        <ListItemText primary={sub.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Box>
      {/* Bottom Settings */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography variant="body2">Enable Dark Mode!</Typography>
          <Switch checked={darkMode} onChange={toggleTheme} />
        </Box>
        {/* <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2">Enable RTL Mode!</Typography>
          <Switch
            checked={rtlMode}
            onChange={() => setRtlMode((prev) => !prev)}
          />
        </Box> */}

        {/* Collapse Icon */}
        <Box textAlign="center" mt={2}>
          <Box
            component="img"
            src={bubbleleft}
            alt="bubble"
            sx={{
              width: 40,
              height: 40,
              cursor: "pointer",
              filter: "brightness(0) invert(1)",
              borderBottom: "4px solid white",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
