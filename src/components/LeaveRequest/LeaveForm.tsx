import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export interface LeaveFormData {
  from: string;
  to: string;
  reason: string;
  type: string;
}

const leaveTypes = [
  { value: "Sick", label: "Sick" },
  { value: "Casual", label: "Casual" },
  { value: "Other", label: "Other" },
];

const LeaveForm = ({
  onSubmit,
}: {
  onSubmit: (data: LeaveFormData) => void;
}) => {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [type, setType] = useState("Sick");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    onSubmit({
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
      reason,
      type,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: "background.paper",
          p: 4,
          borderRadius: 3,
          boxShadow: 1,
          maxWidth: 600,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" color="primary" mb={2}>
          Apply for Leave
        </Typography>

        <DatePicker
          label="From"
          value={from}
          onChange={(newValue) => setFrom(newValue)}
          slotProps={{
            textField: { fullWidth: true, required: true },
          }}
        />

        <DatePicker
          label="To"
          value={to}
          onChange={(newValue) => setTo(newValue)}
          slotProps={{
            textField: { fullWidth: true, required: true },
          }}
        />

        <TextField
          label="Reason"
          multiline
          minRows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <TextField
          select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {leaveTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Apply
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
