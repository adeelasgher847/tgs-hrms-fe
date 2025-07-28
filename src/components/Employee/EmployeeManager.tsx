import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useOutletContext } from "react-router-dom";
import AddEmployeeForm from "./AddEmployeeForm";
import EmployeeList from "./EmployeeList";

interface Employee {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
}
interface Designation {
  id: string;
  label: {
    en: string;
    ar: string;
  };
}

interface OutletContext {
  darkMode: boolean;
  language: "en" | "ar";
}

const departmentOptions = [
  { id: "hr", label: { en: "Human Resources", ar: "الموارد البشرية" } },
  { id: "eng", label: { en: "Engineering", ar: "الهندسة" } },
  { id: "sales", label: { en: "Sales", ar: "المبيعات" } },
];

const designationOptions: Record<string, Designation[]> = {
  hr: [
    { id: "hr-mgr", label: { en: "HR Manager", ar: "مدير الموارد البشرية" } },
    {
      id: "hr-exec",
      label: { en: "HR Executive", ar: "تنفيذي الموارد البشرية" },
    },
  ],
  eng: [
    {
      id: "eng-fe",
      label: { en: "Frontend Engineer", ar: "مهندس الواجهة الأمامية" },
    },
    {
      id: "eng-be",
      label: { en: "Backend Engineer", ar: "مهندس الواجهة الخلفية" },
    },
  ],
  sales: [
    { id: "sales-ex", label: { en: "Sales Executive", ar: "تنفيذي المبيعات" } },
    { id: "sales-mgr", label: { en: "Sales Manager", ar: "مدير المبيعات" } },
  ],
};

const EmployeeManager: React.FC = () => {
  const theme = useTheme();
  const direction = theme.direction;
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode } = useOutletContext<OutletContext>();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  // Dark mode
  const bgColor = darkMode ? "#1b1b1b" : "#fff";
  const textColor = darkMode ? "#e0e0e0" : "#000";
  const borderColor = darkMode ? "#555" : "#ccc";

  // Dark mode input styles
  const darkInputStyles = darkMode ? {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#555" },
      "&:hover fieldset": { borderColor: "#888" },
      "&.Mui-focused fieldset": { borderColor: "#90caf9" },
    },
    "& .MuiInputLabel-root": { color: "#ccc" },
    "& input, & .MuiSelect-select": { color: "#eee" },
    backgroundColor: "#2e2e2e",
  } : {};

  const handleAddEmployee = (employee: Employee) => {
    setEmployees((prev) => [...prev, employee]);
    setOpen(false);
  };

  const handleClearFilters = () => {
    setDepartmentFilter("");
    setDesignationFilter("");
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (departmentFilter && emp.departmentId !== departmentFilter)
        return false;
      if (designationFilter && emp.designationId !== designationFilter)
        return false;
      return true;
    });
  }, [employees, departmentFilter, designationFilter]);

  const getLabel = (en: string, ar: string) => (direction === "rtl" ? ar : en);

  return (
    <Box 
      p={2}
      sx={{ 
        backgroundColor: bgColor,
        color: textColor,
        minHeight: "100vh"
      }}
    >
      {/* Add Employee Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexDirection={isMobile ? "column" : "row"}
        gap={2}
        mb={2}
      >
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          sx={{ 
            flex: 1,
            width: isMobile ? "100%" : "auto"
          }}
        >
          {/* Department Filter */}
          <TextField
            select
            fullWidth
            label={getLabel("Department", "القسم")}
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setDesignationFilter(""); // Reset designation on department change
            }}
            size="small"
            sx={{
              width: isMobile ? "100%" : 190,
              my: 0.5,
              "& .MuiInputBase-input": {
                // textAlign: "center", // 👈 center the selected text
              },
              "& .MuiInputBase-root": {
                padding: "0px 8px",
                minHeight: "10px",
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.85rem",
                left: direction === "rtl" ? "unset" : undefined, // for RTL support
                right: direction === "rtl" ? "1.75rem" : undefined,
              },
              ...darkInputStyles,
            }}
          >
            <MenuItem value="">
              {getLabel("All Departments", "كل الأقسام")}
            </MenuItem>
            {departmentOptions.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {getLabel(dept.label.en, dept.label.ar)}
              </MenuItem>
            ))}
          </TextField>

          {/* Designation Filter */}
          <TextField
            select
            fullWidth
            label={getLabel("Designation", "المسمى الوظيفي")}
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            disabled={!departmentFilter}
            size="small"
            sx={{
              width: isMobile ? "100%" : 190,
              my: 0.5,
              "& .MuiInputBase-input": {
                // textAlign: "center", // 👈 center the selected text
              },
              "& .MuiInputBase-root": {
                padding: "0px 8px",
                minHeight: "10px",
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.85rem",
                left: direction === "rtl" ? "unset" : undefined, // for RTL support
                right: direction === "rtl" ? "1.75rem" : undefined,
              },
              ...darkInputStyles,
            }}
          >
            <MenuItem value="">
              {getLabel("All Designations", "كل المسميات")}
            </MenuItem>
            {(designationOptions[departmentFilter] || []).map((des) => (
              <MenuItem key={des.id} value={des.id}>
                {getLabel(des.label.en, des.label.ar)}
              </MenuItem>
            ))}
          </TextField>
          
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            sx={{
              borderColor: borderColor,
              color: textColor,
              width: isMobile ? "100%" : "auto",
              "&:hover": {
                borderColor: darkMode ? "#888" : "#999",
                backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              }
            }}
          >
            {getLabel("Clear Filters", "مسح الفلاتر")}
          </Button>
        </Stack>

        {/* Add Employee Button */}
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{ 
            backgroundColor: darkMode ? "#605bd4" : "#484c7f",
            width: isMobile ? "100%" : "auto",
            "&:hover": { 
              backgroundColor: darkMode ? "#726df0" : "#5b56a0" 
            }
          }}
        >
          {getLabel("Add Employee", "إضافة موظف")}
        </Button>
      </Box>

      {/* Employee List */}
      <EmployeeList employees={filteredEmployees} />

      {/* Modal with AddEmployeeForm */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: bgColor,
            color: textColor,
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: direction === "rtl" ? "right" : "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: textColor,
          }}
        >
          {getLabel("Add New Employee", "إضافة موظف جديد")}

          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: darkMode ? "#ccc" : theme.palette.grey[500] }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <AddEmployeeForm onSubmit={handleAddEmployee} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EmployeeManager;
