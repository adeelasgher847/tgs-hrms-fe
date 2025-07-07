import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Nabvar";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import "../layout.css";
import EmployeeInviteModal from "./Modal/EmployeeInviteModal";

const Layout = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen); // lg+ → open by default, others → closed
  }, [isLargeScreen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          className="sidebar"
          sx={{
            width: "220px",
            backgroundColor: "var(--dark-color)",
            color: "white",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            height: {
              xs: "100vh",
              lg: "calc(100vh - 90px)",
            },

            position: {
              xs: "absolute",
              lg: "fixed",
            },
            left: 0,
            top: 0,
            m: {
              xs: 0,
              lg: 3,
            },

            mr: 0,
            borderRadius: {
              xs: 0,
              lg: "24px",
            },
            zIndex: 1000,
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Right Section */}
      <Box
        className="main-area"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          height: "100%",
          marginLeft: {
            xs: 0,
            lg: sidebarOpen ? "274px" : "0px",
          },
          transition: "margin 0.3s ease",
          width: "100%",
        }}
      >
        {/* Navbar */}
        <Box
          sx={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            // padding: "0 20px",
            flexShrink: 0,
            mt: 3,
            mb: 3,
          }}
        >
          <Navbar
            onOpenInviteModal={() => setInviteModalOpen(true)}
            onToggleSidebar={toggleSidebar}
          />
          <EmployeeInviteModal
            open={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
          />
        </Box>

        {/* Scrollable Content */}
        <Box
          className="content"
          component="main"
          sx={{
            flex: 1,

            backgroundColor: "#fff",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
