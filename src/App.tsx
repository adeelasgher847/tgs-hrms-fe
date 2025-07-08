import  { useState } from "react";
import "./App.css";

import Box from "@mui/material/Box";
import { useTheme, useMediaQuery } from "@mui/material";

import DesignationManager from "./components/Desigantions/Designation-manager";
import Sidebar from "./components/Desigantions/Sidebar";
import Navbar from "./components/Desigantions/Navbar";
//import { DepartmentList } from "./components/department/Department-list"; // optional, if you use it

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

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
          p: { xs: 1, sm: 2 },
          mt: { xs: "2px", md: 0 },
        }}
      >
        <Navbar onToggleDrawer={toggleDrawer} />
        <DesignationManager
          direction={direction}
          onDirectionChange={setDirection}
        />
        {/* Optional: Only use DepartmentList if needed */}
        {/* <DepartmentList /> */}
      </Box>
    </Box>
  );
}

export default App;
