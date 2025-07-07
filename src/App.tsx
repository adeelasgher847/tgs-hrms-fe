import DesignationManager from "./components/Desigantions/Designation-manager";
import { useState } from "react";
import Box from "@mui/material/Box";
import Navbar from "../src/components/Desigantions/Navbar";
import Sidebar from "../src/components/Desigantions/Sidebar";

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = window.innerWidth < 600;
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

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
        <DesignationManager
          direction={direction}
          onDirectionChange={setDirection}
        />
      </Box>
    </Box>
  );
}

export default App;
