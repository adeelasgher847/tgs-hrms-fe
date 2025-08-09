import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

const AttendanceCheck = () => {
  const [status, setStatus] = useState<"Not Checked In" | "Checked In" | "Checked Out">("Not Checked In");
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [checkInStatus, setCheckInStatus] = useState<"Early" | "Late" | "Normal" | null>(null);


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

  const handlePunch = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    if (status === "Not Checked In" || status === "Checked Out") {
      setStatus("Checked In");
      setPunchInTime(timeStr);
      setPunchOutTime(null);

      const standardTime = new Date();
      standardTime.setHours(9, 0, 0, 0);

      if (now < standardTime) setCheckInStatus("Early");
      else if (now > standardTime) setCheckInStatus("Late");
      else setCheckInStatus("Normal");

      const stored = JSON.parse(localStorage.getItem("attendance") || "[]");
      stored.push({
        date: dateStr,
        checkIn: timeStr,
        checkOut: "--:--",
        totalHours: "--",
      });
      localStorage.setItem("attendance", JSON.stringify(stored));
    } else {
      setStatus("Checked Out");
      setPunchOutTime(timeStr);

      const stored = JSON.parse(localStorage.getItem("attendance") || "[]");
      const last = stored[stored.length - 1];

      if (last && last.date === dateStr) {
        const checkInTime = new Date(`${last.date} ${last.checkIn}`);
        const checkOutTime = now;
        const hours =
          ((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2);

        last.checkOut = timeStr;
        last.totalHours = parseFloat(hours);
        stored[stored.length - 1] = last;
      }

      localStorage.setItem("attendance", JSON.stringify(stored));
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

      <Paper sx={{ p: 3, borderRadius: 2, position: "relative", border: "1px solid #eee" }}>
        {checkInStatus && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor:
                checkInStatus === "Early"
                  ? "#4caf50"
                  : checkInStatus === "Late"
                  ? "#ff9800"
                  : "#90a4ae",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "bold",
              px: 1.5,
              py: 0.5,
              borderBottomLeftRadius: "8px",
            }}
          >
            {checkInStatus}
          </Box>
        )}
        <Typography variant="h6">Good morning, Ramish</Typography>
        <Typography color="text.secondary">{currentTime} (GMT+5)</Typography>

        <Box display="flex" gap={3} mt={3}>
          <Box display="flex" alignItems="center">
            <LoginIcon sx={{ color: "#4caf50", mr: 1 }} />
            <Typography>Check In: <strong>{punchInTime || "--:--"}</strong></Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <LogoutIcon sx={{ color: "#ff9800", mr: 1 }} />
            <Typography>Check Out: <strong>{punchOutTime || "--:--"}</strong></Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AttendanceCheck;
