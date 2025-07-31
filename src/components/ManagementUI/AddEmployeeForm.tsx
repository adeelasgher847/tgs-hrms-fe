import type React from "react";
import { useState, useEffect, useMemo } from "react";
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
  Alert,
} from "@mui/material";
import { Person, Business, Work } from "@mui/icons-material";
import { departments, designations } from "../../Data/mockUser";
import type { FormData, FormErrors } from "../../type/employee";

interface AddEmployeeFormProps {
  isRTL?: boolean;
  language?: "en" | "ar";
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Mock function for creating employee
const createEmployee = async (data: FormData): Promise<void> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Employee created:", data);
  // In a real app, this would make a POST /users API call
};

export default function AddEmployeeForm({
  isRTL = false,
  language = "en",
  onSuccess,
  onCancel,
}: AddEmployeeFormProps) {
  const [formData, setFormData] = useState<FormData>({
    department: "",
    designation: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get available designations based on selected department
  const availableDesignations = useMemo(() => {
    return formData.department
      ? designations.filter(
          (designation) => designation.departmentId === formData.department
        )
      : [];
  }, [formData.department]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ department: true, designation: true });
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await createEmployee(formData);

      if (onSuccess) {
        onSuccess();
      } else {
        alert(
          language === "ar"
            ? "تم إرسال النموذج بنجاح!"
            : "Form submitted successfully!"
        );
      }
    } catch (err) {
      setSubmitError(
        language === "ar"
          ? "حدث خطأ أثناء إرسال النموذج"
          : "An error occurred while submitting the form"
      );
      console.error("Form submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
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
        elevation={0}
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

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

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
            <Box sx={{ flex: { xs: "1", md: "1 1 50%" } }}>
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
                      {language === "ar" &&
                      "nameAr" in dept &&
                      typeof dept.nameAr === "string"
                        ? dept.nameAr
                        : dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.department && errors.department && (
                  <FormHelperText>{errors.department}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Designation Dropdown */}
            <Box sx={{ flex: { xs: "1", md: "1 1 50%" } }}>
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
                      {language === "ar" &&
                      "nameAr" in designation &&
                      typeof designation.nameAr === "string"
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
              disabled={submitting}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: "1.1rem",
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              {submitting ? "Submitting..." : t.submit}
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="large"
              onClick={handleCancel}
              disabled={submitting}
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
      </Paper>
    </Container>
  );
}
