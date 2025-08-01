import { Box, useMediaQuery, useTheme as useMuiTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Nabvar";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "../layout.css";
import EmployeeInviteModal from "./Modal/EmployeeInviteModal";
import { useLanguage } from "../context/LanguageContext";
import { useTheme, } from "../theme";
const Layout = () => {
  const muiTheme = useMuiTheme();
  const { mode: themeMode } = useTheme();
  const isLargeScreen = useMediaQuery(muiTheme.breakpoints.up("lg"));
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rtlMode, setRtlMode] = useState(false);
  const darkMode = themeMode === "dark";
  const { language, setLanguage } = useLanguage();

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
        // flexDirection: rtlMode ? "row-reverse" : "row",
      }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          className="sidebar"
          sx={{
            width: "240px",
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
          />
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
          // marginLeft: {
          //   xs: 0,
          //   lg: sidebarOpen ? "274px" : "0px",
          // },
          transition: "margin 0.3s ease",
          marginLeft: isLargeScreen && sidebarOpen && !rtlMode ? "274px" : 0,
          marginRight: isLargeScreen && sidebarOpen && rtlMode ? "274px" : 0,
          // bgcolor: "#fff", // 🔁 Here
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
          className="content"
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
              justifyContent: "flex-end",
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
