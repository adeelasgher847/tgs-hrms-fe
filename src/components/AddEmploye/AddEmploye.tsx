import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";
import { useOutletContext } from "react-router-dom";

// ✅ Import mock data from files
import { departments, designations } from "../../Data/mockDataEmploye";

const AddEmployeeForm: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDesig, setSelectedDesig] = useState("");
  const [errors, setErrors] = useState({ designation: "" });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { language } = useLanguage();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>() || {
    darkMode: false,
  };
  const isRtl = language === "ar";

  // Dark mode color variables
  const bgPaper = darkMode ? "unset" : "unset";
  const textPrimary = darkMode ? "#e0e0e0" : theme.palette.text.primary;
  const textSecond = darkMode ? "#9a9a9a" : theme.palette.text.secondary;
  const dividerCol = darkMode ? "#333" : "#ccc";

  const texts = {
    en: {
      title: "Add Employee",
      department: "Department",
      designation: "Designation",
      addEmployee: "Add Employee",
      designationRequired: "Designation is required.",
      selectDepartment: "Select Department",
      selectDesignation: "Select Designation",
    },
    ar: {
      title: "إضافة موظف",
      department: "القسم",
      designation: "المسمى الوظيفي",
      addEmployee: "إضافة موظف",
      designationRequired: "المسمى الوظيفي مطلوب.",
      selectDepartment: "اختر القسم",
      selectDesignation: "اختر المسمى الوظيفي",
    },
  };

  const t = texts[language];

  const handleDeptChange = (e: SelectChangeEvent) => {
    setSelectedDept(e.target.value);
    setSelectedDesig("");
    setErrors({ designation: "" });
  };

  const handleDesignationChange = (e: SelectChangeEvent) => {
    setSelectedDesig(e.target.value);
    setErrors({ designation: "" });
  };

  const handleSubmit = () => {
    if (!selectedDesig) {
      setErrors({ designation: t.designationRequired });
      return;
    }
    alert(`Department: ${selectedDept}, Designation: ${selectedDesig}`);
  };

  const filteredDesignations = designations.filter(
    (d) => d.departmentId === selectedDept
  );

  return (
    <Box
      sx={{
        px: 0,
        py: 1,
        direction: isRtl ? "rtl" : "ltr",
        minHeight: "100vh",
        color: textPrimary,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          backgroundColor: bgPaper,
          color: textPrimary,
          boxShadow: "none",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={"bold"}
          textAlign="start"
          mb={1}
          color={textPrimary}
        >
          {t.title}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
            alignItems: "flex-start",
            justifyContent: "start",
            flexWrap: "wrap",
          }}
        >
          {/* Department */}
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: textSecond }}>{t.department}</InputLabel>
            <Select
              value={selectedDept}
              label={t.department}
              onChange={handleDeptChange}
              sx={{
                color: textPrimary,
                backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: dividerCol,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#555" : "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#605bd4" : "#1976d2",
                },
                "& .MuiSelect-icon": {
                  color: textSecond,
                },
                "& .MuiSelect-select": {
                  backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                    color: textPrimary,
                    "& .MuiMenuItem-root": {
                      color: textPrimary,
                      "&:hover": {
                        backgroundColor: darkMode ? "#3a3a3a" : "#f5f5f5",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                <em style={{ color: textSecond }}>{t.selectDepartment}</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem
                  key={dept.id}
                  value={dept.id}
                  sx={{ color: textPrimary }}
                >
                  {isRtl ? dept.nameAr : dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Designation */}
          <FormControl
            fullWidth
            disabled={!selectedDept}
            error={Boolean(errors.designation)}
            sx={{ minWidth: 200 }}
          >
            <InputLabel sx={{ color: textSecond }}>{t.designation}</InputLabel>
            <Select
              value={selectedDesig}
              label={t.designation}
              onChange={handleDesignationChange}
              sx={{
                color: textPrimary,
                backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: dividerCol,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#555" : "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#605bd4" : "#1976d2",
                },
                "& .MuiSelect-icon": {
                  color: textSecond,
                },
                "& .MuiSelect-select": {
                  backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                },
                "&.Mui-disabled": {
                  backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
                  "& .MuiSelect-select": {
                    backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
                  },
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                    color: textPrimary,
                    "& .MuiMenuItem-root": {
                      color: textPrimary,
                      "&:hover": {
                        backgroundColor: darkMode ? "#3a3a3a" : "#f5f5f5",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                <em style={{ color: textSecond }}>{t.selectDesignation}</em>
              </MenuItem>
              {filteredDesignations.map((des) => (
                <MenuItem
                  key={des.id}
                  value={des.id}
                  sx={{ color: textPrimary }}
                >
                  {isRtl ? des.nameAr : des.name}
                </MenuItem>
              ))}
            </Select>
            {errors.designation && (
              <Typography color="error" fontSize={12} mt={0.5}>
                {errors.designation}
              </Typography>
            )}
          </FormControl>

          {/* Submit */}
          <Button
            variant="outlined"
            onClick={handleSubmit}
            sx={{
              minWidth: 150,
              height: 56,
              color: darkMode ? "#fff" : "#fff",
              borderColor: darkMode ? "#605bd4" : "#484c7f",
              backgroundColor: darkMode ? "#605bd4" : "#484c7f",
            }}
          >
            {t.addEmployee}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddEmployeeForm;
