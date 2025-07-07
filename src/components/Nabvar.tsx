// Navbar.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Avatar,
  Stack,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: "6px",
  backgroundColor: "#efefef",
  height: "44px",
  display: "flex",
  gap: "40px",
  alignItems: "center",
  paddingLeft: theme.spacing(1),
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "300px",
    flexGrow: 0,
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#000",
  marginRight: theme.spacing(1),
}));

const StyledInputBase = styled(InputBase)(() => ({
  color: "black",
  fontSize: "16px",
  "& .MuiInputBase-input": {
    padding: 0,
    "::placeholder": {
      color: "#b3b3b3",
    },
  },
}));

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenInviteModal,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    navigate("/");
  };
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ backgroundColor: "#f8fafc", color: "black" }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, md: 3 },
            gap: "10px",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#efefef",
                borderRadius: "6px",
                px: 1,
                height: "44px",
                
              }}
            >
              <Search
                sx={{
                  backgroundColor: "transparent",
                  height: "100%",
                  paddingLeft: 0,
                }}
              >
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search"
                  inputProps={{ "aria-label": "search" }}
                />
              </Search>

              {/* Add Icon with same bg and alignment */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: { xs: "block", sm: "none" },
                    borderRadius: "6px",
                    p: "6px",
                  }}
                >
                  <AddIcon
                    sx={{
                      cursor: "pointer",
                      color: "#555",
                      fontSize: "26px", // font size of the icon
                      width: "31px",
                      height: "31px",
                    }}
                    onClick={onOpenInviteModal}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right Side Icons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
            }}
          >
            <IconButton
              sx={{
                backgroundColor: "#4b4f73",
                color: "white",
                width: 28,
                height: 28,
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>

            <Stack
              direction="row"
              spacing={-1}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              <Avatar
                alt="User 1"
                src="/avatars/user1.png"
                sx={{ width: 32, height: 32 }}
              />
              <Avatar
                alt="User 2"
                src="/avatars/user2.png"
                sx={{ width: 32, height: 32 }}
              />
              <Avatar
                alt="User 3"
                src="/avatars/user3.png"
                sx={{ width: 32, height: 32 }}
              />
              <Avatar
                alt="User 4"
                src="/avatars/user4.png"
                sx={{ width: 32, height: 32 }}
              />
              <Avatar
                sx={{ width: 32, height: 32, backgroundColor: "#4b4f73" }}
              >
                <AddIcon
                  sx={{ cursor: "pointer" }}
                  onClick={onOpenInviteModal}
                  fontSize="small"
                />
              </Avatar>
            </Stack>

            <IconButton>
              <Badge variant="dot" color="error">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, fontSize: "14px" }}
              >
                Dylan Hunter
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Admin Profile
              </Typography>
            </Box>

            <IconButton onClick={handleMenuOpen}>
              <Avatar
                alt="Dylan Hunter"
                src="/avatars/dylan.png"
                sx={{ width: 42, height: 42 }}
              />
            </IconButton>
          </Box>
          {/* Toggle Sidebar Button */}
          <IconButton
            onClick={onToggleSidebar}
            sx={{
              display: {
                xs: "block",
                lg: "none", 
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: "10px",
            width: 280,
            p: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Avatar
            alt="Dylan Hunter"
            src="/avatars/dylan.png"
            sx={{ width: 50, height: 50 }}
          />
          <Box>
            <Typography fontWeight={600}>Dylan Hunter</Typography>
            <Typography variant="body2" color="text.secondary">
              Dylan.hunter@gmail.com
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <MenuItem>
          <ListItemIcon>
            <AssignmentOutlinedIcon fontSize="small" />
          </ListItemIcon>
          My Task
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <GroupOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Members
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Signout
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem>
          <ListItemIcon>
            <PersonAddAltIcon fontSize="small" />
          </ListItemIcon>
          Add personal account
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar;
