import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { attendanceApiService } from "../../api/AttendanceApiService";

// Use a string union type to avoid TS enum issues in some configs
type AttendanceStatus = "Not Checked In" | "Checked In" | "Checked Out";

const AttendanceCheck = () => {
  const [status, setStatus] = useState<AttendanceStatus>("Not Checked In");
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live clock for current time display
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist today's check-in/out on refresh using daily summary endpoint
  useEffect(() => {
    const syncToday = async () => {
      try {
        const today = await attendanceApiService.getTodaySummary();
        if (today) {
          const checkIn = today.checkIn ? new Date(today.checkIn).toLocaleTimeString() : null;
          const checkOut = today.checkOut ? new Date(today.checkOut).toLocaleTimeString() : null;
          setPunchInTime(checkIn);
          setPunchOutTime(checkOut);
          if (checkIn && !checkOut) setStatus("Checked In");
          else if (checkOut) setStatus("Checked Out");
          else setStatus("Not Checked In");
        } else {
          setPunchInTime(null);
          setPunchOutTime(null);
          setStatus("Not Checked In");
        }
      } catch (e) {
        console.error("Failed to sync today summary", e);
      }
    };
    syncToday();
  }, []);

  const handlePunch = async () => {
    try {
      // Always re-read today's summary before action to prevent duplicates
      const today = await attendanceApiService.getTodaySummary();

      // Prevent same-day duplicate records: if already checked out today, do nothing
      if (today?.checkIn && today?.checkOut) {
        return;
      }

      // If trying to check-in but there is already a check-in without checkout, block duplicate check-in
      if (
        (!today || !today.checkIn || today.checkOut) &&
        (status === "Not Checked In" || status === "Checked Out")
      ) {
        const res = await attendanceApiService.createAttendance({ type: "check-in" });
        const timeStr = new Date(res.timestamp).toLocaleTimeString();
        setPunchInTime(timeStr);
        setPunchOutTime(null);
        setStatus("Checked In");
      } else if (status === "Checked In") {
        const res = await attendanceApiService.createAttendance({ type: "check-out" });
        const timeStr = new Date(res.timestamp).toLocaleTimeString();
        setPunchOutTime(timeStr);
        setStatus("Checked Out");
      }

      // Re-sync from server to reflect persisted values
      const latest = await attendanceApiService.getTodaySummary();
      if (latest) {
        setPunchInTime(latest.checkIn ? new Date(latest.checkIn).toLocaleTimeString() : null);
        setPunchOutTime(latest.checkOut ? new Date(latest.checkOut).toLocaleTimeString() : null);
        if (latest.checkIn && !latest.checkOut) setStatus("Checked In");
        else if (latest.checkOut) setStatus("Checked Out");
        else setStatus("Not Checked In");
      }
    } catch (error) {
      console.error("Error punching attendance:", error);
    }
  };

  return (
    <Box py={3}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color={status === "Checked In" ? "warning" : "success"}
          onClick={handlePunch}
          sx={{ minWidth: 120 }}
        >
          {status === "Checked In" ? "Check Out" : "Check In"}
        </Button>
      </Box>

      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          position: "relative",
          border: "1px solid #eee",
        }}
      >
        <Typography variant="h6">Good morning, Ramish</Typography>
        <Typography color="text.secondary">{currentTime} (GMT+5)</Typography>

        <Box display="flex" gap={3} mt={3}>
          <Box display="flex" alignItems="center">
            <LoginIcon sx={{ color: "#4caf50", mr: 1 }} />
            <Typography>
              Check In: <strong>{punchInTime || "--:--"}</strong>
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <LogoutIcon sx={{ color: "#ff9800", mr: 1 }} />
            <Typography>
              Check Out: <strong>{punchOutTime || "--:--"}</strong>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AttendanceCheck;






