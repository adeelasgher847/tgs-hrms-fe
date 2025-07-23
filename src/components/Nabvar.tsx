import * as React from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import AvatarOne from "../assets/NavbarAvatar/avatarone.jpg";
import AvatarTwo from "../assets/NavbarAvatar/avatartwo.jpg";
import AvatarThree from "../assets/NavbarAvatar/avatarthree.jpg";
import AvatarFour from "../assets/NavbarAvatar/avatarfour.jpg";
import AvatarProfile from "../assets/NavbarAvatar/ProfileAvatar.png";
import { useLanguage } from "../context/LanguageContext";
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
import { useState, useEffect } from "react";

const labels = {
  en: {
    search: "Search",
    myTask: "My Task",
    members: "Members",
    signout: "Sign Out",
    addAccount: "Add Personal Account",
    adminProfile: "Admin Profile",
    dylan: "Dylan Hunter",
    email: "Dylan.hunter@gmail.com",
  },
  ar: {
    search: "بحث",
    myTask: "مهامي",
    members: "الأعضاء",
    signout: "تسجيل الخروج",
    addAccount: "إضافة حساب",
    adminProfile: "ملف المشرف",
    dylan: "ديلان هنتر",
    email: "Dylan.hunter@gmail.com",
  },
};

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: "6px",
  backgroundColor: "#efefef",
  height: "44px",
  display: "flex",
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
  fontSize: "16px",
  "& .MuiInputBase-input": {
    padding: 0,
    "::placeholder": {
      color: "#b3b3b3",
    },
  },
}));

interface NavbarProps {
  darkMode: boolean;
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleSidebar,
  onOpenInviteModal,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = labels[language];
  const [user, setUser] = useState<{ name: string; role: string; email: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser({
          name: parsed.name || "User",
          email: parsed.email || "",
          role: parsed.role || "",
          avatarUrl: parsed.avatarUrl || undefined,
        });
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const textColor = darkMode ? "#8f8f8f" : "#000";

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "transparent",
          color: darkMode ? "white" : "black",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, md: 3 },
            gap: "10px",
            justifyContent: {xs:"center" , sm:"space-between"},
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: darkMode ? "#262727" : "#efefef",
                borderRadius: "6px",
                px: 1,
                height: "44px",
              }}
            >
              <Search sx={{ backgroundColor: "transparent", height: "100%", paddingLeft: 0 }}>
                <SearchIconWrapper>
                  <SearchIcon sx={{ color: darkMode ? "#8f8f8f" : "#000" }} />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder={lang.search}
                  inputProps={{ "aria-label": "search" }}
                  sx={{
                    transition: "all 0.3s ease-in-out",
                    color: darkMode ? "white" : "black",
                    "& input": {
                      backgroundColor: "transparent",
                      height: "43px",
                    },
                    "&:focus-within": {
                      height: "45px",
                    },
                  }}
                />
              </Search>

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
                    fontSize: "26px",
                    width: "31px",
                    height: "31px",
                  }}
                  onClick={onOpenInviteModal}
                />
              </Box>
            </Box>
          </Box>

          {/* Right Side */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.2, md: 2 } }}>
            <IconButton sx={{ backgroundColor: "#4b4f73", color: "white", width: 28, height: 28 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>

            <Stack direction="row" spacing={-1} sx={{ display: { xs: "none", sm: "flex" } }}>
              {[AvatarOne, AvatarTwo, AvatarThree, AvatarFour].map((src, index) => (
                <Avatar key={index} alt={`User ${index + 1}`} src={src} sx={{ width: 32, height: 32 }} />
              ))}
              <Avatar sx={{ width: 32, height: 32, backgroundColor: "#4b4f73" }}>
                <AddIcon sx={{ cursor: "pointer" }} onClick={onOpenInviteModal} fontSize="small" />
              </Avatar>
            </Stack>

            <IconButton>
              <Badge variant="dot" color="error">
                <NotificationsNoneOutlinedIcon sx={{ color: textColor }} />
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
                color={textColor}
              >
                {user?.name || "User"}
              </Typography>
              <Typography variant="caption" color={textColor}>
                {user?.role == "admin"
                  ? "Admin Profile"
                  : user?.role == "staff"
                  ? "Staff Profile"
                  : "User Profile"}
              </Typography>
            </Box>

            <IconButton onClick={handleMenuOpen}>
              <Avatar
                alt={user?.name || "User"}
                src={user?.avatarUrl || AvatarProfile}
                sx={{
                  width: "45px",
                  height: "45px",
                  border: "1px solid #dee2e6",
                  p: "3px",
                  "& img": { borderRadius: "50%" },
                }}
              >
                {!user?.avatarUrl && user?.name ? user.name[0] : null}
              </Avatar>
            </IconButton>

            <IconButton onClick={onToggleSidebar} sx={{ display: { xs: "block", lg: "none" } }}>
              <MenuIcon sx={{ color: textColor }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 4,
          sx: { borderRadius: "10px", width: 280, p: 2, backgroundColor: darkMode ? "#111" : "#fff" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Avatar
            alt={user?.name || "User"}
            src={user?.avatarUrl || AvatarProfile}
            sx={{ width: 50, height: 50 }}
          >
            {!user?.avatarUrl && user?.name ? user.name[0] : null}
          </Avatar>
          <Box>
            <Typography fontWeight={600} color={textColor}>{user?.name || "User"}</Typography>
            <Typography variant="body2" color={textColor}>
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><AssignmentOutlinedIcon fontSize="small" sx={{ color: textColor }} /></ListItemIcon>
          <Typography color={textColor}>{lang.myTask}</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><GroupOutlinedIcon fontSize="small" sx={{ color: textColor }} /></ListItemIcon>
          <Typography color={textColor}>{lang.members}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: textColor }} /></ListItemIcon>
          <Typography color={textColor}>{lang.signout}</Typography>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><PersonAddAltIcon fontSize="small" sx={{ color: textColor }} /></ListItemIcon>
          <Typography color={textColor}>{lang.addAccount}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar;
