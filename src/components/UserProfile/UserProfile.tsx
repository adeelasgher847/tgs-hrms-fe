import type React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import {
  Person,
  Email,
  Business,
  Work,
  AdminPanelSettings,
} from "@mui/icons-material";

interface UserInfo {
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  avatar?: string;
}

interface UserProfileProps {
  user?: UserInfo;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user = {
    name: "John Doe",
    email: "john.doe@company.com",
    department: "Engineering",
    designation: "Senior Software Engineer",
    role: "Admin",
  },
}) => {
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getRoleColor = (
    role: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (role.toLowerCase()) {
      case "admin":
        return "error";
      case "manager":
        return "warning";
      case "user":
        return "primary";
      default:
        return "default";
    }
  };

  const profileItems = [
    {
      icon: <Person sx={{ color: "primary.main" }} />,
      label: "Full Name",
      value: user.name,
    },
    {
      icon: <Email sx={{ color: "primary.main" }} />,
      label: "Email Address",
      value: user.email,
    },
    {
      icon: <Business sx={{ color: "primary.main" }} />,
      label: "Department",
      value: user.department,
    },
    {
      icon: <Work sx={{ color: "primary.main" }} />,
      label: "Designation",
      value: user.designation,
    },
    {
      icon: <AdminPanelSettings sx={{ color: "primary.main" }} />,
      label: "Role",
      value: user.role,
    },
  ];

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: "transparent",
          // backgroundColor: "grey.50",
          alignItems: "flex-start",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ mb: 4, fontWeight: 600 }}
        >
          User Profile
        </Typography>

        <Card
          elevation={1}
          sx={{ borderRadius: 3, border: "none", bgcolor: "transparent" }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header Section with Avatar */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <Avatar
                src={user.avatar}
                sx={{
                  width: 80,
                  height: 80,
                  mr: 1,
                  fontSize: "2rem",
                  bgcolor: "primary.main",
                }}
              >
                {!user.avatar && getInitials(user.name)}
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  {user.name}
                </Typography>
                <Chip
                  label={user.role}
                  color={getRoleColor(user.role)}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Profile Info Replaced Grid with Flex Box */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              {profileItems.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: { xs: "1 1 100%", sm: "1 1 48%" },
                    p: 2,
                    borderRadius: 2,
                    // bgcolor: "grey.100",
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ mr: 2, mt: 0.5 }}>{item.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 400, wordBreak: "break-word" }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Additional Info Section */}
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
};

export default UserProfile;
