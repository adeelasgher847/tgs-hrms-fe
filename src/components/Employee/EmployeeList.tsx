import React from "react";
import {
  Box,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

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

interface OutletContext {
  darkMode: boolean;
  language: "en" | "ar";
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees }) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<OutletContext>();

  // Dark mode styles
  const textColor = darkMode ? "#e0e0e0" : "#000";
  const cardBg = darkMode ? "#2a2a2a" : "#fff";
  const borderColor = darkMode ? "#555" : "#f0f0f0";
  const secondaryTextColor = darkMode
    ? "#9a9a9a"
    : theme.palette.text.secondary;

  // ✅ Updated ID mappings with correct string keys
  const departments: Record<string, string> = {
    hr: direction === "rtl" ? "الموارد البشرية" : "Human Resources",
    eng: direction === "rtl" ? "الهندسة" : "Engineering",
    sales: direction === "rtl" ? "المبيعات" : "Sales",
  };

  const designations: Record<string, string> = {
    "hr-mgr": direction === "rtl" ? "مدير الموارد البشرية" : "HR Manager",
    "hr-exec": direction === "rtl" ? "تنفيذي الموارد البشرية" : "HR Executive",
    "eng-fe":
      direction === "rtl" ? "مهندس الواجهة الأمامية" : "Frontend Engineer",
    "eng-be":
      direction === "rtl" ? "مهندس الواجهة الخلفية" : "Backend Engineer",
    "sales-ex": direction === "rtl" ? "تنفيذي المبيعات" : "Sales Executive",
    "sales-mgr": direction === "rtl" ? "مدير المبيعات" : "Sales Manager",
  };

  const getDepartment = (id?: string) => (id ? departments[id] || "—" : "—");
  const getDesignation = (id?: string) => (id ? designations[id] || "—" : "—");

  return (
    <Box sx={{ pt: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        textAlign="start"
        sx={{ color: textColor }}
      >
        {direction === "rtl" ? "قائمة الموظفين" : "Employee List"}
      </Typography>

      <Paper
        elevation={1}
        sx={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          overflowX: "auto",
          boxShadow: "none",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                {direction === "rtl" ? "الاسم" : "Name"}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                {direction === "rtl" ? "رقم الهاتف" : "Phone"}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                {direction === "rtl" ? "البريد الإلكتروني" : "Email"}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                {direction === "rtl" ? "القسم" : "Department"}
              </TableCell>
              <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                {direction === "rtl" ? "الوظيفة" : "Designation"}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp) => (
              <TableRow
                key={emp.email}
                sx={{
                  "&:hover": {
                    backgroundColor: darkMode
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <TableCell sx={{ color: textColor }}>{emp.name}</TableCell>
                <TableCell sx={{ color: textColor }}>{emp.phone}</TableCell>
                <TableCell sx={{ color: secondaryTextColor }}>
                  {emp.email}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {getDepartment(emp.departmentId)}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {getDesignation(emp.designationId)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default EmployeeList;
