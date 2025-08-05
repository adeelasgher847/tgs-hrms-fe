import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

const AttendanceHistory = () => {
  const [status, setStatus] = useState<
    "Not Checked In" | "Checked In" | "Checked Out"
  >("Not Checked In");
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      date: "2023-07-28",
      checkIn: "9:00 AM",
      checkOut: "5:00 PM",
      totalHours: 8,
    },
    {
      date: "2023-07-29",
      checkIn: "9:30 AM",
      checkOut: "6:00 PM",
      totalHours: 8.5,
    },
    {
      date: "2023-07-30",
      checkIn: "9:15 AM",
      checkOut: "5:15 PM",
      totalHours: 8,
    },
  ]);

  const [filteredRecords, setFilteredRecords] = useState(attendanceRecords);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (status === "Not Checked In" || status === "Checked Out") {
      setStatus("Checked In");
      setPunchInTime(timeStr);
      setPunchOutTime(null);
    } else {
      setStatus("Checked Out");
      setPunchOutTime(timeStr);

      if (punchInTime) {
        const punchInDate = new Date();
        const isPM = punchInTime.includes("PM");
        const [rawHour, rawMinute] = punchInTime
          .replace(/ AM| PM/, "")
          .split(":");
        let punchInHour = parseInt(rawHour);
        const punchInMinute = parseInt(rawMinute);

        if (isPM && punchInHour !== 12) punchInHour += 12;
        if (!isPM && punchInHour === 12) punchInHour = 0;

        punchInDate.setHours(punchInHour);
        punchInDate.setMinutes(punchInMinute);

        const diffMs = now.getTime() - punchInDate.getTime();
        const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

        const newRecord = {
          date: new Date().toISOString().split("T")[0],
          checkIn: punchInTime,
          checkOut: timeStr,
          totalHours,
        };

        const updatedRecords = [...attendanceRecords, newRecord];
        setAttendanceRecords(updatedRecords);
        setFilteredRecords(updatedRecords);
      }
    }
  };

  const handleFilter = () => {
    if (startDate && endDate) {
      const filtered = attendanceRecords.filter((record) => {
        return record.date >= startDate && record.date <= endDate;
      });
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(attendanceRecords);
    }
  };

  return (
    <Box py={3}>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <Button
          variant="contained"
          color={status === "Checked In" ? "warning" : "success"}
          onClick={handlePunch}
          sx={{ minWidth: 120 }}
        >
          {status === "Checked In" ? "Check Out" : "Check In"}
        </Button>
      </Box>

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2}>
        <Paper
          sx={{
            p: 3,
            flex: 1,
            boxShadow: "none",
            borderRadius: 2,
            border: "1px solid #f0f0f0",
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Good morning, Ramish
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {currentTime} (GMT+5)
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            justifyContent={"space-between"}
            gap={2}
            mt={3}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LoginIcon sx={{ color: "#4caf50", mr: 1 }} />
              <Typography>
                Check In: <strong>{punchInTime || "--:--"}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LogoutIcon sx={{ color: "#ff9800", mr: 1 }} />
              <Typography>
                Check Out: <strong>{punchOutTime || "--:--"}</strong>
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            flex: 1,
            boxShadow: "none",
            borderRadius: 2,
            border: "1px solid #f0f0f0",
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {/* Time Log */}
          </Typography>
        </Paper>
      </Box>

      <Box mt={4} boxShadow="none">
        <Paper
          sx={{
            boxShadow: "none",
            borderRadius: 2,
            border: "1px solid #f0f0f0",
            backgroundColor: "#fff",
            p: 3,
          }}
        >
          <Typography variant="h6" gutterBottom mb={4}>
            Attendance History
          </Typography>

          <Box
            display="flex"
            flexWrap="wrap"
            gap={2}
            alignItems="center"
            mb={2}
          >
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleFilter}
              sx={{
                px: 2,
                py: 1,
                minHeight: "36px",
                fontSize: "14px",
                textTransform: "none",
              }}
            >
              Filter
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Total Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>{record.totalHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default AttendanceHistory;
