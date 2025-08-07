import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from "@mui/material";

interface LeaveApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  action: "Approve" | "Reject";
}

const LeaveApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  action,
}: LeaveApprovalDialogProps) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center" }}>
        Confirm {action}
      </DialogTitle>
      <DialogContent>
        <Typography align="center" sx={{ mb: 2 }}>
          Are you sure you want to {action.toLowerCase()} this leave request?
        </Typography>
        {action === "Reject" && (
          <TextField
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            required
          />
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={() => onConfirm(action === "Reject" ? reason : undefined)}
          variant="contained"
          color={action === "Approve" ? "success" : "error"}
        >
          Yes
        </Button>
        <Button onClick={onClose} variant="outlined" color="inherit">
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveApprovalDialog;
