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
import dotted from "../assets/dashboardIcon/dotted-down.svg";
import Clipboard from "../assets/dashboardIcon/Clipboard";
import bubbleleft from "../assets/dashboardIcon/bubble-left.svg";
import { useState } from "react";
import { NavLink } from "react-router-dom";

// 🔹 Types
interface SubItem {
  label: string;
  path: string;
}
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  subItems: SubItem[];
  color?: string;
}
interface SidebarProps {
  rtlMode: boolean;
  setRtlMode: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

// 🔹 Menu data
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <Dashboard />,
    subItems: [
      { label: "Hr Dashboard", path: "" },
      { label: "Project Dashboard", path: "" },
    ],
  },
  {
    label: "Projects",
    icon: <BusinessCenter />,
    subItems: [
      { label: "Project List", path: "" },
      { label: "Add Project", path: "" },
    ],
  },
  {
    label: "Tickets",
    icon: <ConfirmationNumber />,
    subItems: [
      { label: "All Tickets", path: "" },
      { label: "Create Ticket", path: "" },
    ],
  },
  {
    label: "Our Clients",
    icon: <People />,
    subItems: [
      { label: "Client List", path: "departments" }, // ✅ ROUTE
      { label: "Add Client", path: "departments/new" },
    ],
  },
  {
    label: "Employees",
    icon: <Group />,
    subItems: [
      { label: "Employee List", path: "" },
      { label: "Add Employee", path: "" },
    ],
  },
  {
    label: "Accounts",
    icon: <Receipt />,
    subItems: [
      { label: "Invoice", path: "" },
      { label: "Payments", path: "" },
    ],
  },
  {
    label: "Payroll",
    icon: <Payments />,
    subItems: [
      { label: "Payroll Summary", path: "" },
      { label: "Payslips", path: "" },
    ],
  },
  {
    label: "App",
    icon: <Apps />,
    subItems: [
      { label: "Chat", path: "" },
      { label: "Calendar", path: "" },
    ],
  },
  {
    label: "Other Pages",
    icon: <Code />,
    subItems: [
      { label: "Login", path: "" },
      { label: "Register", path: "" },
      { label: "Error", path: "" },
    ],
  },
  {
    label: "UI Components",
    icon: <Widgets />,
    subItems: [
      { label: "Buttons", path: "" },
      { label: "Cards", path: "" },
      { label: "Modals", path: "" },
    ],
  },
];

export default function Sidebar({
  rtlMode,
  setRtlMode,
  darkMode,
  setDarkMode,
}: SidebarProps) {
  const [openItem, setOpenItem] = useState<string>("Dashboard");

  const handleClick = (label: string): void => {
    setOpenItem(openItem === label ? "" : label);
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
        scrollbarWidth: "none",
        msOverflowStyle: "none",
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
          {menuItems.map((item) => (
            <Box key={item.label}>
              <ListItemButton
                onClick={() => handleClick(item.label)}
                sx={{
                  color: openItem === item.label ? "orange" : "white",
                  pl: 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: openItem === item.label ? "orange" : "white",
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

              {/* SubItems */}
              <Collapse in={openItem === item.label} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((sub) => (
                    <ListItemButton
                      key={sub.path + sub.label}
                      component={NavLink}
                      to={`/dashboard/${sub.path}`}
                      sx={{
                        pl: 6,
                        fontSize: "14px",
                        color: ({ isActive }: any) =>
                          isActive ? "orange" : "white",
                      }}
                    >
                      <ListItemText primary={sub.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Box>

      {/* Bottom Settings */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2">Enable Dark Mode!</Typography>
          <Switch checked={darkMode} onChange={() => setDarkMode((prev) => !prev)} />
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2">Enable RTL Mode!</Typography>
          <Switch checked={rtlMode} onChange={() => setRtlMode((prev) => !prev)} />
        </Box>

        {/* Collapse Button */}
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
