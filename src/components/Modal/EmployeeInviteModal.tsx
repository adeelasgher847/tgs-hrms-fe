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
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupIcon from "@mui/icons-material/Group";

interface Employee {
  name: string;
  email: string;
  role: "Admin" | "Member";
}

interface EmployeeInviteModalProps {
  open: boolean;
  onClose: () => void;
}

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  maxWidth: "95%",
  bgcolor: "background.paper",
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
];

const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState<string>("");

  const handleSend = () => {
    if (email.trim()) {
      console.log("Send invite to:", email);
      setEmail("");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{fontSize:25,fontWeight:700}}>Employee Invitation</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Email input + Send button */}
        <Box
  display="flex"
  mb={3}
  sx={{
    borderRadius: "4px 0px 0px 4px !important", // top-left and bottom-left corners rounded
  }}
>
          <TextField
            fullWidth
            size="small"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
                    backgroundColor:"#efefef",
                    borderRadius: "4px 0px 0px 4px !important", // top-left and bottom-left corners rounded
            }}
          />
          <Button
            variant="contained"
           
            sx={{fontSize:14, backgroundColor: "var(--dark-color)", whiteSpace: "nowrap",px:0, borderRadius: "0px 4px 4px 0px", }}
            onClick={handleSend}
          >
            Send
          </Button>
        </Box>

        {/* Employee List */}
        <Box>
          <Typography variant="subtitle1" mb={1} sx={{fontSize:16, fontWeight: 700 }}>
            Employees
          </Typography>
          {employees.map((emp, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              py={1}
              px={1}
              borderRadius={2}
              bgcolor="#f9f9f9"
              mb={1}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar>{emp.name[0]}</Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize={16}>{emp.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {emp.email}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                {emp.role === "Admin" ? (
                  <AdminPanelSettingsIcon sx={{ color: "#1976d2" }} />
                ) : (
                  <GroupIcon sx={{ color: "#4caf50" }} />
                )}
                <SettingsIcon />
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Bottom Buttons */}
        <Divider sx={{ my: 3 }} />
        <Box display="flex" justifyContent="end" gap={1}>
          <Button variant="outlined" sx={{color:"white", backgroundColor:"var(--background-dark)"}} onClick={onClose}>
            Done
          </Button>
          <Button variant="contained" sx={{ backgroundColor: "var(--dark-color)" }}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EmployeeInviteModal;
