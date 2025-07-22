import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import settings from "../../assets/dashboardIcon/ui-settings.svg";

interface Employee {
  name: string;
  email: string;
  role: "Admin" | "Member";
}

interface EmployeeInviteModalProps {
  open: boolean;
  onClose: () => void;
  darkMode?: boolean; // Dark mode toggle
}

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  maxWidth: "95%",
  borderRadius: 3,
  boxShadow: 24,
  p: 2,
};

const employees: Employee[] = [
  {
    name: "Ali Raza",
    email: "ali@example.com",
    role: "Admin",
  },
  {
    name: "Fatima Khan",
    email: "fatima@example.com",
    role: "Member",
  },
    {
    name: "Fatima Khan",
    email: "fatima@example.com",
    role: "Member",
  },
];

const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({
  open,
  onClose,
  darkMode = false,
}) => {
  const [email, setEmail] = useState<string>("");

  const handleSend = () => {
    if (email.trim()) {
      console.log("Send invite to:", email);
      setEmail("");
    }
  };

  const bgColor = darkMode ? "#1e1e1e" : "#fff";
  const fieldBg = darkMode ? "#2e2e2e" : "#f1f1f1";
  const textColor = darkMode ? "#e0e0e0" : "#000";
  const cardBg = darkMode ? "#2a2a2a" : "#f9f9f9";

  return (
    <Modal open={open} onClose={onClose} sx={{ overflowY: "auto" }}>
      <Box sx={{ ...style, bgcolor: bgColor }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 25, fontWeight: 700, color: textColor }}
          >
            Employee Invitation
          </Typography>
          <IconButton onClick={onClose} sx={{ color: textColor }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Email input + Send button */}
        <Box display="flex" mb={3}>
          <TextField
            fullWidth
            size="small"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              backgroundColor: fieldBg,
              borderRadius: "4px 0px 0px 4px",
              input: { color: textColor },
              label: { color: textColor },
            }}
            InputLabelProps={{
              style: { color: textColor },
            }}
          />
          <Button
            variant="contained"
            sx={{
              fontSize: 14,
              backgroundColor: "var(--dark-color)",
              whiteSpace: "nowrap",
              px: 0,
              borderRadius: "0px 4px 4px 0px",
            }}
            onClick={handleSend}
          >
            Send
          </Button>
        </Box>

        {/* Employee List */}
        <Box>
          <Typography
            fontWeight={700}
            fontSize={16}
            mb={1}
            color={textColor}
          >
            Employee
          </Typography>
          {employees.map((emp, idx) => (
            <Box
              key={idx}
              bgcolor={cardBg}
              borderRadius={2}
              px={2}
              py={1.5}
              mb={1.2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: idx % 2 === 0 ? "#ffcd38" : "#e24c4c",
                    color: "#fff",
                  }}
                >
                  {emp.name[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize={14} color={textColor}>
                    {emp.name}
                  </Typography>
                  <Typography fontSize={13} color={textColor}>
                    {emp.email}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontSize={13} color={textColor}>
                  {emp.role}
                </Typography>
                <img
                  src={settings}
                  alt="settings"
                  style={{
                    width: 16,
                    height: 16,
                    filter: darkMode
                      ? "invert(1) brightness(0.8)"
                      : "grayscale(100%) brightness(55%)",
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Bottom Buttons */}
        <Divider sx={{ my: 3, borderColor: darkMode ? "#444" : undefined }} />
        <Box display="flex" justifyContent="end" gap={1}>
          <Button
            variant="outlined"
            sx={{
              color: "#fff",
              backgroundColor: "var(--background-dark)",
              borderColor: "#555",
            }}
            onClick={onClose}
          >
            Done
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "var(--dark-color)" }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EmployeeInviteModal;
