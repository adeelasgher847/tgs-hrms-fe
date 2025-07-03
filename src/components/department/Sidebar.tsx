import {
  Box,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
  Collapse,
  ListItemButton,
} from "@mui/material";
import {
  Home,
  ConfirmationNumber,
  People,
  AccountBalance,
  Payments,
  Apps,
  Code,
  Palette,
  ExpandLess,
  ExpandMore,
  Work,
  Person,
  CheckCircle,
} from "@mui/icons-material";
import { useState } from "react";

// ✅ Props type
type SidebarProps = {
  isMobile: boolean;
  mobileOpen: boolean;
  onToggleDrawer: () => void;
};

const drawerWidth = 270;

const Sidebar = ({ isMobile, mobileOpen, onToggleDrawer }: SidebarProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [rtlMode, setRtlMode] = useState(false);
  const [openClients, setOpenClients] = useState(true);

  const toggleClients = () => setOpenClients(!openClients);

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        backgroundColor: "#45407A",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: 2,
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <CheckCircle sx={{ fontSize: 40 }} />
        <Typography variant="h6" fontWeight="bold">
          My-Task
        </Typography>
      </Box>

      {/* Menu */}
      <List>
        <SidebarItem icon={<Home />} label="Dashboard" />
        <SidebarItem icon={<Work />} label="Projects" />
        <SidebarItem icon={<ConfirmationNumber />} label="Tickets" />
        <SidebarItem
          icon={<Person sx={{ color: "orange" }} />}
          label="Our Clients"
          expandable
          expanded={openClients}
          onClick={toggleClients}
        />
        <Collapse in={openClients} timeout="auto" unmountOnExit>
          <List disablePadding>
            <SidebarSubItem label="Clients" active />
            <SidebarSubItem label="Client Profile" />
          </List>
        </Collapse>
        <SidebarItem icon={<People />} label="Employees" />
        <SidebarItem icon={<AccountBalance />} label="Accounts" />
        <SidebarItem icon={<Payments />} label="Payroll" />
        <SidebarItem icon={<Apps />} label="App" />
        <SidebarItem icon={<Code />} label="Other Pages" />
        <SidebarItem icon={<Palette />} label="UI Components" />
      </List>

      {/* Switches */}
      <Box sx={{ mt: 6 }}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          <Typography>Enable Dark Mode!</Typography>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Switch checked={rtlMode} onChange={() => setRtlMode(!rtlMode)} />
          <Typography>Enable RTL Mode!</Typography>
        </Box>
      </Box>

      <Box mt="auto" display="flex" justifyContent="center" pt={2}>
        <ExpandLess sx={{ transform: "rotate(90deg)" }} />
      </Box>
    </Box>
  );

  return (
    <>
      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={onToggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          zIndex: 1300,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#45407A",
            color: "white",
            borderRadius: {
              xs: 0,
              md: 4,
            },
            height: {
              xs: "100%",
              md: "90%",
            },
            m: {
              xs: 0,
              md: 3,
            },
            maxHeight: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

// SidebarItem Component
type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  expandable?: boolean;
  expanded?: boolean;
};

const SidebarItem = ({
  icon,
  label,
  onClick,
  expandable = false,
  expanded = false,
}: SidebarItemProps) => (
  <ListItemButton onClick={onClick} sx={{ color: "white" }}>
    <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
    <ListItemText
      primary={label}
      primaryTypographyProps={{ fontWeight: 500 }}
    />
    {expandable && (expanded ? <ExpandLess /> : <ExpandMore />)}
  </ListItemButton>
);

// SidebarSubItem Component
type SidebarSubItemProps = {
  label: string;
  active?: boolean;
};

const SidebarSubItem = ({ label, active = false }: SidebarSubItemProps) => (
  <ListItemButton
    sx={{
      pl: 6,
      color: active ? "orange" : "white",
      fontWeight: active ? 600 : 400,
      position: "unset !important",
    }}
  >
    <ListItemText primary={label} />
  </ListItemButton>
);

export default Sidebar;
