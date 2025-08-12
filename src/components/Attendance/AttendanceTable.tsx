import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import axiosInstance from "../../api/axiosInstance";

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number | null;
  user?: {
    first_name: string;
  };
}

const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);
      setUserRole(currentUser.role.name);
      const endpoint =
        currentUser.role.name === "Admin"
          ? "/attendance/all"
          : `/attendance?userId=${currentUser.id}`;
      const response = await axiosInstance.get(endpoint);
      const grouped: Record<string, AttendanceRecord> = {};
      response.data.forEach((item: any) => {
        const date = item.date
          ? item.date
          : new Date(item.timestamp).toISOString().split("T")[0];
        const userId = item.user_id || item.userId;
        const key = `${userId}_${date}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: item.id || Math.random().toString(),
            userId,
            date,
            checkIn: null,
            checkOut: null,
            workedHours: null,
            user: { first_name: item.user?.first_name || "N/A" },
          };
        }
        if (item.type === "check-in") {
          grouped[key].checkIn = new Date(item.timestamp).toLocaleTimeString();
        }
        if (item.type === "check-out") {
          grouped[key].checkOut = new Date(item.timestamp).toLocaleTimeString();
        }
        if (item.checkIn || item.checkInTime) {
          grouped[key].checkIn = new Date(
            item.checkIn || item.checkInTime
          ).toLocaleTimeString();
        }
        if (item.checkOut || item.checkOutTime) {
          grouped[key].checkOut = new Date(
            item.checkOut || item.checkOutTime
          ).toLocaleTimeString();
        }
      });
      const finalData = Object.values(grouped).map((rec) => {
        if (rec.checkIn && rec.checkOut) {
          const inTime = new Date(`1970-01-01T${rec.checkIn}`);
          const outTime = new Date(`1970-01-01T${rec.checkOut}`);
          rec.workedHours = parseFloat(
            ((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(
              2
            )
          );
        }
        return rec;
      });
      finalData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAttendanceData(finalData);
      setFilteredData(finalData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    let data = [...attendanceData];
    if (startDate) {
      data = data.filter((rec) => new Date(rec.date) >= new Date(startDate));
    }
    if (endDate) {
      data = data.filter((rec) => new Date(rec.date) <= new Date(endDate));
    }
    setFilteredData(data);
  }, [startDate, endDate, attendanceData]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Attendance History
      </Typography>
      {/* Filter Box */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button variant="outlined" onClick={clearFilters}>
          Clear Filter
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAttendance}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {userRole === "Admin" && (
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Employee Name
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Worked Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <TableRow key={record.id}>
                    {userRole === "Admin" && (
                      <TableCell>{record.user?.first_name || "N/A"}</TableCell>
                    )}
                    <TableCell>{record.date || "--"}</TableCell>
                    <TableCell>{record.checkIn || "--"}</TableCell>
                    <TableCell>{record.checkOut || "--"}</TableCell>
                    <TableCell>{record.workedHours ?? "--"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={userRole === "Admin" ? 5 : 4}
                    align="center"
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AttendanceTable;
