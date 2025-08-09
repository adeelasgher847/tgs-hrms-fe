import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from "@mui/material";

const AttendanceTable = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const stored = localStorage.getItem("attendance");
    return stored ? JSON.parse(stored) : [];
  });

  const [filteredRecords, setFilteredRecords] = useState(attendanceRecords);

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const stored = localStorage.getItem("attendance");
    if (stored) {
      const data = JSON.parse(stored);
      setAttendanceRecords(data);
      setFilteredRecords(data);
    }
  }, []);

  const handleFilter = () => {
    const stored = JSON.parse(localStorage.getItem("attendance") || "[]");

    if (startDate && endDate) {
      const filtered = stored.filter((record: any) => {
        return record.date >= startDate && record.date <= endDate;
      });
      setFilteredRecords(filtered);
      setPage(1); // Reset to page 1 when filtering
    } else {
      setFilteredRecords(stored);
      setPage(1);
    }
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  return (
    <Box py={3}>
      <Paper
        sx={{
          p: 3,
          border: "1px solid #f0f0f0",
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "none",
        }}
      >
        <Typography variant="h6" mb={3}>
          Attendance History
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button variant="contained" size="small" onClick={handleFilter}>
            Filter
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 600,
                    fontSize: "15px",
                  },
                }}
              >
                <TableCell>Date</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Total Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecords.map((record: any, index: number) => (
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

        {filteredRecords.length > rowsPerPage && (
          <Box display="flex" justifyContent="end" mt={2}>
            <Pagination
              count={Math.ceil(filteredRecords.length / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AttendanceTable;
