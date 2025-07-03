import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  IconButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

const employees = [
  {
    name: "Rachel Carr (you)",
    email: "rachel.carr@gmail.com",
    role: "Admin",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Lucas Baker (Resend)",
    email: "lucas.baker@gmail.com",
    role: "Members",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    name: "Una Coleman",
    email: "una.coleman@gmail.com",
    role: "Members",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
];

const InviteModal: React.FC<InviteModalProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: {
            xs: "100%",
            sm: "auto",
          },
          maxHeight: "95vh",
          width: {
            xs: "95%",
            sm: "600px",
          },
          p: 2,
        },
      }}
    >
      <DialogTitle fontWeight={600}>Employee Invitation</DialogTitle>

      <DialogContent dividers>
        {/* Input */}
        <Box display="flex" alignItems="center" mb={1} gap={1}>
          <TextField
            fullWidth
            size="small"
            variant="filled"
            placeholder="Email address"
            InputProps={{
              disableUnderline: true,
              sx: {
                height: 40, // Match button height
                backgroundColor: "#f5f5f5",
                "& input": {
                  padding: "10px 12px", // Adjust padding for better alignment
                },
                borderRadius: 1,
                px: 1.5,
              },
            }}
          />

          <Button
            variant="contained"
            sx={{
              borderRadius: 2,
              backgroundColor: "#45407A",
              color: "#fff",
              height: 40, // Match input height
              px: 0,
              minWidth: 80, // optional for consistent button width
            }}
          >
            Send
          </Button>
        </Box>

        {/* Employee List Title */}
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Employees
        </Typography>

        {/* Employee List */}
        {employees.map((emp, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={1}
            borderBottom="1px solid #f0f0f0"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={emp.avatar} />
              <Box>
                <Typography fontWeight={600}>{emp.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {emp.email}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Typography>{emp.role}</Typography>
              <IconButton size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </DialogContent>

      {/* Buttons with custom color */}
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: "gray",
            color: "white",
          }}
        >
          Done
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "#45407A",
            color: "white",
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteModal;
