import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Alert } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { attendanceApiService } from "../../api/AttendanceApiService";
type AttendanceStatus = "Not Checked In" | "Checked In" | "Checked Out";
const AttendanceCheck = () => {
  const [status, setStatus] = useState<AttendanceStatus>("Not Checked In");
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      setUserName(user.first_name || "User");
      return user.id;
    } catch {
      return null;
    }
  };
  const fetchToday = async () => {
    setError(null);
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not found. Please log in again.");
      return;
    }
    try {
      const today = await attendanceApiService.getTodaySummary(userId);
      if (today) {
        const checkInISO = today.checkIn ? new Date(today.checkIn) : null;
        const checkOutISO = today.checkOut ? new Date(today.checkOut) : null;
        const checkIn = checkInISO ? checkInISO.toLocaleTimeString() : null;
        const checkOut =
          checkInISO && checkOutISO && checkOutISO > checkInISO
            ? checkOutISO.toLocaleTimeString()
            : null;
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
    } catch {
      setError("Failed to fetch today's attendance summary.");
    }
  };
  useEffect(() => {
    fetchToday();
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await attendanceApiService.createAttendance({ type: "check-in" });
      // Optimistically reflect UI: clear checkout and lock check-in
      setPunchOutTime(null);
      setStatus("Checked In");
      await fetchToday();
    } catch {
      setError("Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await attendanceApiService.createAttendance({ type: "check-out" });
      // After checkout, both buttons become enabled again
      setStatus("Checked Out");
      await fetchToday();
    } catch {
      setError("Check-out failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Disable rules:
  // - Check In disabled while loading OR when currently in an open session
  // - Check Out disabled while loading OR when not in an open session
  const disableCheckIn = loading || status === "Checked In";
  const disableCheckOut = loading || status === "Not Checked In";
  return (
    <Box py={3}>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
        <Button
          variant="contained"
          color="success"
          onClick={handleCheckIn}
          sx={{ minWidth: 120 }}
          disabled={disableCheckIn}
        >
          Check In
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleCheckOut}
          sx={{ minWidth: 120 }}
          disabled={disableCheckOut}
        >
          Check Out
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          position: "relative",
          border: "1px solid #eee",
        }}
      >
        <Typography variant="h6">Good morning, {userName}</Typography>
        <Typography color="text.secondary">{currentTime}</Typography>
        <Box display="flex" gap={3} mt={3}>
          <Box display="flex" alignItems="center">
            <LoginIcon sx={{ color: "#4CAF50", mr: 1 }} />
            <Typography>
              Check In: <strong>{punchInTime || "--:--"}</strong>
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <LogoutIcon sx={{ color: "#FF9800", mr: 1 }} />
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