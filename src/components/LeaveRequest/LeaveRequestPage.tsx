import  { useState } from "react";
import LeaveForm, { type LeaveFormData } from "./LeaveForm";
import LeaveHistory, { type Leave } from "./LeaveHistory";
import LeaveApprovalDialog from "./LeaveApprovalDialog";


import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
 

const isAdmin = true; // Replace with actual auth logic

const initialLeaves: Leave[] = [
  {
    id: "1",
    name: "John Doe",
    from: "Aug 10, 2024",
    to: "Aug 12, 2024",
    applied: "Aug 5, 2024",
    reason: "Family vacation",
    status: "Rejected",
    type: "Vacation",
    secondaryReason: "Rejected: not allowd",
  },
  {
    id: "2",
    name: "Jane Smith",
    from: "Jul 20, 2024",
    to: "Jul 21, 2024",
    applied: "Jul 18, 2024",
    reason: "Personal emergency",
    status: "Rejected",
    type: "Emergency",
    secondaryReason: "Rejected: Insufficient notice period",
  },
];

const LeaveRequestPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"Approve" | "Reject" | null>(
    null
  );
  const [tab, setTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleApply = (data: LeaveFormData) => {
    const newLeave: Leave = {
      id: String(Date.now()),
      ...data,
      applied: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Pending",
    };
    setLeaves([newLeave, ...leaves]);
    setSnackbarOpen(true);
    // TODO: Call POST /leaves API
  };

  const handleAction = (id: string, action: "Approve" | "Reject") => {
    setSelectedId(id);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleConfirm = (reason?: string) => {
    if (selectedId && actionType) {
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === selectedId
            ? {
                ...leave,
                status: actionType === "Approve" ? "Approved" : "Rejected",
                secondaryReason:
                  actionType === "Reject"
                    ? `Rejected: ${reason || "No reason provided"}`
                    : undefined,
              }
            : leave
        )
      );
      // TODO: Call PATCH /leaves/:id API
    }
    setDialogOpen(false);
    setDialogOpen(false);
    setSelectedId(null);
    setActionType(null);
  };
  return (
    <Box sx={{ background: "", minHeight: "100vh" }}>
      <AppBar
        position="static"
        sx={{
          background: ")",
          borderRadius: "16px 16px 0 0",
          boxShadow: 0,
        }}
      >
        <Toolbar
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            py: { xs: 2, sm: 0 },
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#fff", mb: { xs: 2, sm: 0 } }}
          >
            Leave Management System
          </Typography>
          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
            }}
          >
            <Button
              startIcon={<AssignmentIcon />}
              sx={{
                color: tab === 0 ? "#fff" : "#e0e0e0",
                fontWeight: 600,
                mb: { xs: 1, sm: 0 },
                background: tab === 0 ? "rgba(255,255,255,0.12)" : "none",
                borderRadius: 2,
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={() => setTab(0)}
            >
              APPLY LEAVE
            </Button>
            <Button
              startIcon={<AccessTimeIcon />}
              sx={{
                color: tab === 1 ? "#fff" : "#e0e0e0",
                fontWeight: 600,
                background: tab === 1 ? "rgba(255,255,255,0.12)" : "none",
                borderRadius: 2,
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={() => setTab(1)}
            >
              LEAVE HISTORY
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      {tab === 0 ? (
        <Box sx={{ pt: 4 }}>
          <LeaveForm onSubmit={handleApply} />
        </Box>
      ) : (
        <Box sx={{ pt: 4 }}>
          <LeaveHistory
            leaves={leaves}
            isAdmin={isAdmin}
            onAction={handleAction}
          />
        </Box>
      )}
      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        action={actionType || "Approve"}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Leave applied successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestPage;
