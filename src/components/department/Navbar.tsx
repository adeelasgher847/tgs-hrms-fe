// Navbar.tsx
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  InputBase,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  Stack,
  Fab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  Info,
  Notifications,
  Add as AddIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import InviteModal from "../department/InviteModal"; // adjust path if needed

const people = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=2",
  "https://i.pravatar.cc/150?img=3",
  "https://i.pravatar.cc/150?img=4",
];

interface NavbarProps {
  onToggleDrawer: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleDrawer }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [openInvite, setOpenInvite] = useState(false);

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, md: 4 },
          py: 2,
        }}
      >
        {/* Search Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f0f0f0",
            px: 1,
            height: 50,
            borderRadius: "2px",
            width: "100%",
            maxWidth: { sm: "100%", md: 500 },
          }}
        >
          <Search sx={{ color: "black" }} />
          <InputBase
            placeholder="Search"
            sx={{ ml: 2, flex: 1 }}
            inputProps={{ "aria-label": "search" }}
          />
          <Box>
            <AddIcon
              fontSize="small"
              onClick={() => setOpenInvite(true)}
              sx={{ display: { xs: "block", sm: "none" } }}
            />
          </Box>
        </Box>

        {/* Right Side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: { xs: 0.5, sm: 1.5 },
            width: "100%",
          }}
        >
          <Tooltip title="Info">
            <IconButton
              disableRipple
              sx={{
                backgroundColor: "#45407A",
                color: "#fff",
                borderRadius: "8px",
                width: 32,
                height: 32,
              }}
            >
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}
          >
            <Stack direction="row" spacing={-1}>
              {people.map((src, index) => (
                <Avatar
                  key={index}
                  src={src}
                  sx={{
                    width: 32,
                    height: 32,
                    border: "2px solid white",
                  }}
                />
              ))}
            </Stack>

            <Fab
              size="small"
              disableRipple
              onClick={() => setOpenInvite(true)}
              sx={{
                ml: -1.5,
                backgroundColor: "#45407A",
                color: "orange",
                width: 32,
                height: 32,
                minHeight: 0,
                boxShadow: "none",
                transition: "none",
                "&:hover": {
                  backgroundColor: "#45407A",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </Fab>
          </Box>

          <IconButton>
            <Notifications sx={{ color: "black" }} />
          </IconButton>

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body1" fontWeight="bold">
              Dylan Hunter
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Profile
            </Typography>
          </Box>

          <Avatar
            src="https://i.pravatar.cc/150?img=5"
            sx={{ width: 40, height: 40 }}
          />

          {isSmallScreen && (
            <IconButton onClick={onToggleDrawer} sx={{ color: "black" }}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
      <InviteModal open={openInvite} onClose={() => setOpenInvite(false)} />
    </AppBar>
  );
};

export default Navbar;
