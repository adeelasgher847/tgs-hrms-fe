"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Container,
} from "@mui/material";
import { Person, Business, Work } from "@mui/icons-material";
import { departments, designations } from "../../Data/mockDataEmploye";
import type { FormData, FormErrors } from "../../type/employee";

interface AddEmployeeFormProps {
  isRTL?: boolean;
  language?: "en" | "ar";
}

export default function AddEmployeeForm({
  isRTL = false,
  language = "en",
}: AddEmployeeFormProps) {
  const [formData, setFormData] = useState<FormData>({
    department: "",
    designation: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Get available designations based on selected department
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const availableDesignations = formData.department
    ? designations.filter(
        (designation) => designation.departmentId === formData.department
      )
    : [];

  // Reset designation when department changes
  useEffect(() => {
    if (formData.department && formData.designation) {
      const isDesignationValid = availableDesignations.some(
        (designation) => designation.id === formData.designation
      );
      if (!isDesignationValid) {
        setFormData((prev) => ({ ...prev, designation: "" }));
      }
    }
  }, [formData.department, formData.designation, availableDesignations]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.department) {
      newErrors.department =
        language === "ar" ? "يرجى اختيار القسم" : "Please select a department";
    }

    if (!formData.designation) {
      newErrors.designation =
        language === "ar"
          ? "يرجى اختيار المسمى الوظيفي"
          : "Please select a designation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      department: value,
      designation: "", // Reset designation when department changes
    }));
    setTouched((prev) => ({ ...prev, department: true }));

    // Clear errors when user makes a selection
    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: undefined }));
    }
  };

  const handleDesignationChange = (value: string) => {
    setFormData((prev) => ({ ...prev, designation: value }));
    setTouched((prev) => ({ ...prev, designation: true }));

    // Clear errors when user makes a selection
    if (errors.designation) {
      setErrors((prev) => ({ ...prev, designation: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ department: true, designation: true });

    if (validateForm()) {
      console.log("Form submitted:", formData);
      // Handle form submission here
      alert(
        language === "ar"
          ? "تم إرسال النموذج بنجاح!"
          : "Form submitted successfully!"
      );
    }
  };

  const texts = {
    en: {
      title: "Add Employee",
      subtitle: "Fill in the employee details",
      department: "Department",
      designation: "Designation",
      selectDepartment: "Select Department",
      selectDesignation: "Select Designation",
      submit: "Add Employee",
      cancel: "Cancel",
    },
    ar: {
      title: "إضافة موظف",
      subtitle: "املأ تفاصيل الموظف",
      department: "القسم",
      designation: "المسمى الوظيفي",
      selectDepartment: "اختر القسم",
      selectDesignation: "اختر المسمى الوظيفي",
      submit: "إضافة موظف",
      cancel: "إلغاء",
    },
  };

  const t = texts[language];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 2,
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Person sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.subtitle}
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            {/* Department Dropdown */}
            <Box sx={{ flex: 1 }}>
              <FormControl
                fullWidth
                error={touched.department && !!errors.department}
                sx={{ mb: { xs: 2, md: 0 } }}
              >
                <InputLabel id="department-label">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Business sx={{ fontSize: 20 }} />
                    {t.department}
                  </Box>
                </InputLabel>
                <Select
                  labelId="department-label"
                  value={formData.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Business sx={{ fontSize: 20 }} />
                      {t.department}
                    </Box>
                  }
                  sx={{
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>{t.selectDepartment}</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {language === "ar" ? dept.nameAr : dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.department && errors.department && (
                  <FormHelperText>{errors.department}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Designation Dropdown */}
            <Box sx={{ flex: 1 }}>
              <FormControl
                fullWidth
                disabled={!formData.department}
                error={touched.designation && !!errors.designation}
              >
                <InputLabel id="designation-label">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Work sx={{ fontSize: 20 }} />
                    {t.designation}
                  </Box>
                </InputLabel>
                <Select
                  labelId="designation-label"
                  value={formData.designation}
                  onChange={(e) => handleDesignationChange(e.target.value)}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Work sx={{ fontSize: 20 }} />
                      {t.designation}
                    </Box>
                  }
                  sx={{
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>{t.selectDesignation}</em>
                  </MenuItem>
                  {availableDesignations.map((designation) => (
                    <MenuItem key={designation.id} value={designation.id}>
                      {language === "ar"
                        ? designation.nameAr
                        : designation.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.designation && errors.designation && (
                  <FormHelperText>{errors.designation}</FormHelperText>
                )}
                {!formData.department && (
                  <FormHelperText>
                    {language === "ar"
                      ? "يرجى اختيار القسم أولاً"
                      : "Please select a department first"}
                  </FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: "1.1rem",
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              {t.submit}
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: "1.1rem",
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              {t.cancel}
            </Button>
          </Box>
        </Box>

        {/* Debug Info (Remove in production) */}
        <Box sx={{ mt: 4, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Debug: Selected Department: {formData.department || "None"} |
            Selected Designation: {formData.designation || "None"} | Available
            Designations: {availableDesignations.length}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
