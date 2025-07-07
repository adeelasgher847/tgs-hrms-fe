import React from "react";
import "./App.css";

import Box from "@mui/material/Box";
import { useTheme, useMediaQuery } from "@mui/material";
import { DepartmentList } from "./components/department/Department-list";
import Sidebar from "./components/department/Sidebar";
import Navbar from "./components/department/Navbar";

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // ✅ Safe media query detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const toggleDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onToggleDrawer={toggleDrawer}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: { xs: 1, sm: 2 }, // Add padding on small screen
          mt: { xs: "2px", md: 0 }, // Add space on small screen
        }}
      >
        <Navbar onToggleDrawer={toggleDrawer} />
        <DepartmentList />
      </Box>
    </Box>
  );
}

export default App;
