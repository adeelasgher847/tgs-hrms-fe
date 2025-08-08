import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export interface Leave {
  id: string;
  name: string; // Employee name
  from: string;
  to: string;
  applied: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  type: string;
  secondaryReason?: string;
}

const typeColor: Record<
  string,
  "success" | "error" | "info" | "warning" | "default"
> = {
  Vacation: "success",
  Emergency: "error",
  Sick: "info",
  Casual: "warning",
  Other: "default",
};

const statusConfig: Record<
  string,
  { color: "success" | "error" | "warning"; icon: React.ReactElement }
> = {
  Pending: {
    color: "warning",
    icon: <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />,
  },
  Approved: {
    color: "success",
    icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />,
  },
  Rejected: {
    color: "error",
    icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />,
  },
};

const LeaveHistory = ({
  leaves,
  isAdmin,
  onAction,
}: {
  leaves: Leave[];
  isAdmin: boolean;
  onAction: (id: string, action: "Approve" | "Reject") => void;
}) => (
  <Box
  // sx={{
  //   p: 3,
  //   borderRadius: 4,
  //   boxShadow: 2,
  //   background: "#fff",
  //   maxWidth: "900px",
  //   mx: "auto",
  //   mt: 4,
  // }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <AccessTimeIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
      <Typography variant="h5" fontWeight={600}>
        My Leave History
      </Typography>
    </Box>
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Applied</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reason</TableCell>
            {isAdmin && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell>{leave.name}</TableCell>
              <TableCell>
                <Chip
                  label={leave.type}
                  color={typeColor[leave.type] || "default"}
                  sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              </TableCell>
              <TableCell>{leave.from}</TableCell>
              <TableCell>{leave.to}</TableCell>
              <TableCell>{leave.applied}</TableCell>
              <TableCell>
                <Chip
                  icon={statusConfig[leave.status].icon}
                  label={leave.status}
                  color={statusConfig[leave.status].color}
                  sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              </TableCell>
              <TableCell>
                <Typography>{leave.reason}</Typography>
                {leave.status === "Rejected" && leave.secondaryReason && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    {leave.secondaryReason}
                  </Typography>
                )}
              </TableCell>
              {isAdmin && leave.status === "Pending" && (
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip
                      label="Approve"
                      color="success"
                      clickable
                      onClick={() => onAction(leave.id, "Approve")}
                    />
                    <Chip
                      label="Reject"
                      color="error"
                      clickable
                      onClick={() => onAction(leave.id, "Reject")}
                    />
                  </Box>
                </TableCell>
              )}
              {isAdmin && leave.status !== "Pending" && <TableCell />}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default LeaveHistory;
