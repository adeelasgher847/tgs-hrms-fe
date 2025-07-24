import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface Employee {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
}

interface EmployeeListProps {
  employees: Employee[];
}

const departments: Record<string, string> = {
  1: "Human Resources",
  2: "Engineering",
};

const designations: Record<string, string> = {
  1: "HR Manager",
  2: "Frontend Developer",
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const direction = theme.direction;

  const getDepartment = (id?: string) => (id ? departments[id] || "—" : "—");
  const getDesignation = (id?: string) => (id ? designations[id] || "—" : "—");

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom textAlign="start">
        {direction === "rtl" ? "قائمة الموظفين" : "Employee List"}
      </Typography>

      {isMobile ? (
        <Box display="flex" flexDirection="column" gap={2}>
          {employees.map((emp) => (
            <Card key={emp.email} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {emp.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emp.email}
                </Typography>

                <Box mt={1}>
                  <Typography variant="body2">
                    <strong>{direction === "rtl" ? "القسم" : "Department"}:</strong>{" "}
                    {getDepartment(emp.departmentId)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{direction === "rtl" ? "الوظيفة" : "Designation"}:</strong>{" "}
                    {getDesignation(emp.designationId)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{direction === "rtl" ? "الاسم" : "Name"}</TableCell>
                <TableCell>{direction === "rtl" ? "البريد الإلكتروني" : "Email"}</TableCell>
                <TableCell>{direction === "rtl" ? "القسم" : "Department"}</TableCell>
                <TableCell>{direction === "rtl" ? "الوظيفة" : "Designation"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.email}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{getDepartment(emp.departmentId)}</TableCell>
                  <TableCell>{getDesignation(emp.designationId)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default EmployeeList;
