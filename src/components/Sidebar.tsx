import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Switch,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  ExpandLess,
  ExpandMore,
  BusinessCenter,
  ConfirmationNumber,
  People,
  Group,
  Receipt,
  Payments,
  Apps,
  Code,
  Widgets,
  ChevronLeft,
} from "@mui/icons-material";
import dotted from "../assets/dashboardIcon/dotted-down.svg";
import Clipboard from "../assets/dashboardIcon/Clipboard";
import { useState } from "react";

// ✅ Menu item type
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  subItems: string[];
  color?: string;
}

// ✅ Menu data with type safety
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <Dashboard />,
    subItems: ["Hr Dashboard", "Project Dashboard"],
    color: "orange",
  },
  {
    label: "Projects",
    icon: <BusinessCenter />,
    subItems: ["Project List", "Add Project"],
  },
  {
    label: "Tickets",
    icon: <ConfirmationNumber />,
    subItems: ["All Tickets", "Create Ticket"],
  },
  {
    label: "Our Clients",
    icon: <People />,
    subItems: ["Client List", "Add Client"],
  },
  {
    label: "Employees",
    icon: <Group />,
    subItems: ["Employee List", "Add Employee"],
  },
  {
    label: "Accounts",
    icon: <Receipt />,
    subItems: ["Invoice", "Payments"],
  },
  {
    label: "Payroll",
    icon: <Payments />,
    subItems: ["Payroll Summary", "Payslips"],
  },
  {
    label: "App",
    icon: <Apps />,
    subItems: ["Chat", "Calendar"],
  },
  {
    label: "Other Pages",
    icon: <Code />,
    subItems: ["Login", "Register", "Error"],
  },
  {
    label: "UI Components",
    icon: <Widgets />,
    subItems: ["Buttons", "Cards", "Modals"],
  },
];

export default function Sidebar() {
  const [openItem, setOpenItem] = useState<string>("Dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [rtlMode, setRtlMode] = useState<boolean>(false);

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

              <Collapse
                in={openItem === item.label}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.subItems.map((sub, index) => (
                    <ListItemButton
                      key={index}
                      sx={{
                        pl: 6,
                        color:
                          item.label === "Dashboard" && index === 0
                            ? "orange"
                            : "white",
                        fontSize: "14px",
                      }}
                    >
                      <ListItemText primary={sub} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Box>
      {/* Bottom Controls */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography variant="body2">Enable Dark Mode!</Typography>
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode((prev: boolean) => !prev)}
          />
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2">Enable RTL Mode!</Typography>
          <Switch
            checked={rtlMode}
            onChange={() => setRtlMode((prev: boolean) => !prev)}
          />
        </Box>

        {/* Sidebar Collapse Icon */}
        <Box textAlign="center" mt={2}>
          <ChevronLeft sx={{ color: "white", cursor: "pointer" }} />
        </Box>
      </Box>
    </Box>
  );
}
