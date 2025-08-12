import { useState, useEffect } from "react";
import LeaveForm from "./LeaveForm";
import LeaveHistory from "./LeaveHistory";
import LeaveApprovalDialog from "./LeaveApprovalDialog";
import { leaveApi, type CreateLeaveRequest } from "../../api/leaveApi";
import type { Leave } from "../../type/levetypes";
import {
  isAdmin,
  isUser,
  getCurrentUser,
  getUserName,
  getUserRole,
} from "../../utils/auth";

import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Error interface for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const LeaveRequestPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Get current user role
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();
  const userIsUser = isUser();

  // Initialize tab based on user role
  const [tab, setTab] = useState(userIsUser ? 0 : 0);

  // Debug: Log current state
  console.log("🔍 Current state:", {
    currentUser,
    userIsAdmin,
    userIsUser,
    hasUser: !!currentUser,
    userRole: currentUser?.role,
    localStorage: {
      user: localStorage.getItem("user"),
      token: localStorage.getItem("accessToken"),
    },
  });

  // Load leaves on component mount
  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      let leavesData: Leave[];

      if (userIsAdmin) {
        // Admin gets all leaves with user info
        console.log("Loading leaves as admin...");
        const response = await leaveApi.getAllLeaves();
        leavesData = response.map((leave) => ({
          id: leave.id,
          userId: leave.user_id || leave.userId,
          name: leave.user?.first_name
            ? `${leave.user.first_name} ${leave.user.last_name || ""}`.trim()
            : leave.user?.name || "N/A",
          fromDate: leave.from_date,
          toDate: leave.to_date,
          reason: leave.reason,
          type: leave.type,
          status: leave.status,
          applied:
            leave.applied ||
            new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          created_at: leave.created_at,
        }));
      } else if (userIsUser) {
        // Regular user gets their own leaves
        console.log("Loading leaves as user...");
        const currentUserId = currentUser?.id;
        if (!currentUserId) {
          console.error("No user ID found for current user");
          leavesData = [];
        } else {
          console.log("Fetching leaves for user ID:", currentUserId);
          const response = await leaveApi.getUserLeaves(currentUserId);
          leavesData = response.map((leave) => ({
            id: leave.id,
            userId: leave.user_id || leave.userId,
            name: "You", // Show "You" for current user's own leaves
            fromDate: leave.from_date,
            toDate: leave.to_date,
            reason: leave.reason,
            type: leave.type,
            status: leave.status,
            applied:
              leave.applied ||
              new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            created_at: leave.created_at,
          }));
        }
      } else {
        // No valid role, show empty
        console.log("No valid role found, showing empty list");
        leavesData = [];
      }

      // Sort leaves by creation date (newest first) for better admin experience
      leavesData.sort((a, b) => {
        // Sort by created_at if available, otherwise by applied date, then by ID
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : a.applied
          ? new Date(a.applied).getTime()
          : new Date(a.id).getTime();
        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : b.applied
          ? new Date(b.applied).getTime()
          : new Date(b.id).getTime();
        return dateB - dateA; // Newest first
      });

      console.log("Loaded leaves:", leavesData);
      setLeaves(leavesData);
    } catch (error: unknown) {
      console.error("Error loading leaves:", error);
      setError("Failed to load leave history");
      const apiError = error as ApiError;
      if (apiError?.response?.status === 403) {
        setSnackbarMessage("Access denied. Please check your permissions.");
      } else if (apiError?.response?.status === 401) {
        setSnackbarMessage("Authentication failed. Please login again.");
      } else {
        setSnackbarMessage("Failed to load leave history");
      }
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (data: CreateLeaveRequest) => {
    try {
      console.log("Submitting leave request:", data);
      const newLeave = await leaveApi.createLeave(data);
      console.log("API response:", newLeave);

      const leaveWithDisplay: Leave = {
        id: newLeave.id,
        userId: newLeave.user_id || newLeave.userId,
        name: userIsAdmin ? getUserName() : "You",
        fromDate: newLeave.from_date,
        toDate: newLeave.to_date,
        reason: newLeave.reason,
        type: newLeave.type,
        status: newLeave.status,
        applied:
          newLeave.applied ||
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        created_at: newLeave.created_at || new Date().toISOString(),
      };

      console.log("Formatted leave for display:", leaveWithDisplay);
      setLeaves([leaveWithDisplay, ...leaves]);
      setSnackbarMessage("Leave applied successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: unknown) {
      console.error("Error applying leave:", error);
      const apiError = error as ApiError;
      if (apiError?.response) {
        console.error("API Error details:", apiError.response.data);
        if (apiError.response.status === 403) {
          setSnackbarMessage(
            "Access denied. You don't have permission to apply leaves."
          );
        } else if (apiError.response.status === 401) {
          setSnackbarMessage("Authentication failed. Please login again.");
        } else {
          setSnackbarMessage(
            `Failed to apply leave: ${
              apiError.response.data?.message || "Unknown error"
            }`
          );
        }
      } else {
        setSnackbarMessage("Failed to apply leave - Network error");
      }
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleAction = (id: string, action: "approved" | "rejected") => {
    if (!userIsAdmin) {
      setSnackbarMessage("Only admins can approve/reject leaves");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    setSelectedId(id);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleConfirm = async (reason?: string) => {
    if (selectedId && actionType && userIsAdmin) {
      try {
        await leaveApi.updateLeaveStatus(selectedId, actionType);

        setLeaves((prev) =>
          prev.map((leave) =>
            leave.id === selectedId
              ? {
                  ...leave,
                  status: actionType,
                  secondaryReason:
                    actionType === "rejected"
                      ? `Rejected: ${reason || "No reason provided"}`
                      : undefined,
                }
              : leave
          )
        );

        setSnackbarMessage(`Leave ${actionType} successfully!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error: unknown) {
        console.error("Error updating leave status:", error);
        const apiError = error as ApiError;
        if (apiError?.response?.status === 403) {
          setSnackbarMessage(
            "Access denied. You don't have permission to update leave status."
          );
        } else {
          setSnackbarMessage("Failed to update leave status");
        }
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
    setDialogOpen(false);
    setSelectedId(null);
    setActionType(null);
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Error Loading Leave Management
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  // Show setup message if no valid role found
  if (!currentUser && !userIsAdmin && !userIsUser) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Authentication Required
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          No valid user role found. Please login or set up a test user.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={() => {
              localStorage.setItem("setupTestUser", "true");
              window.location.reload();
            }}
          >
            Setup Test User
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              localStorage.setItem("setupTestUser", "true");
              const testAdmin = {
                id: "test-admin-1",
                email: "test-admin@example.com",
                first_name: "Test",
                last_name: "Admin",
                role: "admin",
              };
              localStorage.setItem("user", JSON.stringify(testAdmin));
              localStorage.setItem("accessToken", "test-admin-token");
              window.location.reload();
            }}
          >
            Setup Test Admin
          </Button>
          <Button
            variant="text"
            onClick={() => {
              const testUser = {
                id: "test-user-1",
                email: "test@example.com",
                first_name: "Test",
                last_name: "User",
                role: "user",
              };
              localStorage.setItem("user", JSON.stringify(testUser));
              localStorage.setItem("accessToken", "test-token");
              console.log("✅ Quick test user set up:", testUser);
              window.location.reload();
            }}
          >
            Quick Test User
          </Button>
        </Box>
        <Typography variant="caption" sx={{ mt: 2, opacity: 0.7 }}>
          Or use browser console: setupTestUser('user') or setupTestAdmin()
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            const testUser = {
              id: "test-user-1",
              email: "test@example.com",
              first_name: "Test",
              last_name: "User",
              role: "user",
            };
            localStorage.setItem("user", JSON.stringify(testUser));
            localStorage.setItem("accessToken", "test-token");
            console.log("✅ Force test user set up:", testUser);
            window.location.reload();
          }}
          sx={{ mt: 1 }}
        >
          Force Test User Setup
        </Button>
      </Box>
    );
  }

  // Main component render
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
            {currentUser && (
              <Typography
                variant="caption"
                sx={{ display: "block", opacity: 0.8 }}
              >
                Logged in as: {getUserName()} ({getUserRole()})
              </Typography>
            )}
          </Typography>
          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
            }}
          >
            {/* Only show Apply Leave button for regular users */}
            {userIsUser && (
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
            )}
            <Button
              startIcon={<AccessTimeIcon />}
              sx={{
                color: tab === (userIsUser ? 1 : 0) ? "#fff" : "#e0e0e0",
                fontWeight: 600,
                background:
                  tab === (userIsUser ? 1 : 0)
                    ? "rgba(255,255,255,0.12)"
                    : "none",
                borderRadius: 2,
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={() => setTab(userIsUser ? 1 : 0)}
            >
              LEAVE HISTORY
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Show Apply Leave form only for regular users */}
      {userIsUser && tab === 0 ? (
        <Box sx={{ pt: 4 }}>
          <LeaveForm onSubmit={handleApply} />
        </Box>
      ) : (
        <Box sx={{ pt: 4 }}>
          <LeaveHistory
            leaves={leaves}
            isAdmin={userIsAdmin}
            onAction={handleAction}
          />
        </Box>
      )}
      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        action={actionType || "approved"}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestPage;
