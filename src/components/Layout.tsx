import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Nabvar";
import { Outlet } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "../layout.css";
import EmployeeInviteModal from "./Modal/EmployeeInviteModal";
import { useLanguage } from "../context/LanguageContext";

const Layout = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rtlMode, setRtlMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { language, setLanguage } = useLanguage();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen); // lg+ → open by default, others → closed
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [isLargeScreen, darkMode]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    if (!isLargeScreen) {
      setSidebarOpen(false);
    }
  };

  // Handle clicks outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen &&
        !isLargeScreen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };

    if (sidebarOpen && !isLargeScreen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, isLargeScreen]);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
        overflow: "hidden",
        // flexDirection: rtlMode ? "row-reverse" : "row",
      }}
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && !isLargeScreen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          ref={sidebarRef}
          className="sidebar"
          sx={{
            width: "220px",
            backgroundColor: "var(--dark-color)",
            color: "white",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            direction: rtlMode ? "rtl" : "ltr",
            height: {
              xs: "100vh",
              lg: "calc(100vh - 90px)",
            },

            position: {
              xs: "absolute",
              lg: "fixed",
            },
            // left: 0,
            top: 0,
            left: rtlMode ? "auto" : 0,
            right: rtlMode ? 0 : "auto",
            m: {
              xs: 0,
              lg: 3,
            },
            mr: 0,
            borderRadius: {
              xs: 0,
              lg: "17.6px",
            },
            zIndex: 1000,
          }}
        >
          <Sidebar
            rtlMode={rtlMode}
            setRtlMode={setRtlMode}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onMenuItemClick={closeSidebar}
          />
        </Box>
      )}
      {/* Right Section */}
      <Box
        className="main-area content"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          height: "100%",
          // marginLeft: {
          //   xs: 0,
          //   lg: sidebarOpen ? "274px" : "0px",
          // },
          transition: "margin 0.3s ease",
          marginLeft: isLargeScreen && sidebarOpen && !rtlMode ? "274px" : 0,
          marginRight: isLargeScreen && sidebarOpen && rtlMode ? "274px" : 0,
          // bgcolor: "#fff", // 🔁 Here
          color: darkMode ? "#fff" : "#000",
          width: "100%",
          direction: rtlMode ? "rtl" : "ltr",
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
            darkMode={darkMode}
          />
          <EmployeeInviteModal
            open={inviteModalOpen}
            darkMode={darkMode}
            onClose={() => setInviteModalOpen(false)}
          />
        </Box>

        {/* Scrollable Content */}
        <Box
          // className="content"
          component="main"
          sx={{
            flex: 1,
            px: { xs: "7px", md: "26px" },
            pt: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
              mb: 1,
            }}
          >
            {/* Language Toggle */}
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={(_, value) => value && setLanguage(value)}
              size="small"
            >
              <ToggleButton
                value="en"
                sx={{
                  color: darkMode ? "#fff" : "#000",
                  "&.Mui-selected": {
                    backgroundColor: "#484c7f",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#484c7f",
                    },
                  },
                }}
              >
                EN
              </ToggleButton>

              <ToggleButton
                value="ar"
                sx={{
                  color: darkMode ? "#fff" : "#000",
                  "&.Mui-selected": {
                    backgroundColor: "#484c7f",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#484c7f",
                    },
                  },
                }}
              >
                عربي
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Outlet context={{ darkMode }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
