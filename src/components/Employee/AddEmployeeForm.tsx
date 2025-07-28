import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/system";
import { useOutletContext } from "react-router-dom";


// Mock data
const departments = [
  {
    id: "hr",
    en: "Human Resources",
    ar: "الموارد البشرية",
    designations: [
      { id: "hr-mgr", en: "HR Manager", ar: "مدير الموارد البشرية" },
      { id: "hr-exec", en: "HR Executive", ar: "تنفيذي الموارد البشرية" },
    ],
  },
  {
    id: "eng",
    en: "Engineering",
    ar: "الهندسة",
    designations: [
      { id: "eng-fe", en: "Frontend Engineer", ar: "مهندس الواجهة الأمامية" },
      { id: "eng-be", en: "Backend Engineer", ar: "مهندس الواجهة الخلفية" },
    ],
  },
  {
    id: "sales",
    en: "Sales",
    ar: "المبيعات",
    designations: [
      { id: "sales-ex", en: "Sales Executive", ar: "تنفيذي المبيعات" },
      { id: "sales-mgr", en: "Sales Manager", ar: "مدير المبيعات" },
    ],
  },
];
// Types
interface FormValues {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
}

type Errors = {
  [K in keyof FormValues]?: string;
};

interface AddEmployeeFormProps {
  onSubmit?: (data: FormValues) => void;
}

interface OutletContext {
  darkMode: boolean;
  language: "en" | "ar";
}
// Component
const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onSubmit }) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode, language } = useOutletContext<OutletContext>();

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    designationId: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  const designationOptions = useMemo(() => {
    if (!values.departmentId) return [];
    return (
      departments.find((d) => d.id === values.departmentId)?.designations || []
    );
  }, [values.departmentId]);

  useEffect(() => {
    setValues((prev) => ({ ...prev, designationId: "" }));
  }, [values.departmentId]);

  const dir = language === "ar" ? "rtl" : "ltr";
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);

  // Dark‑mode
  const darkInputStyles: SxProps<Theme> = darkMode
    ? {
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "#555" },
          "&:hover fieldset": { borderColor: "#888" },
          "&.Mui-focused fieldset": { borderColor: "#90caf9" },
        },
        "& .MuiInputLabel-root": { color: "#ccc" },
        "& input, & .MuiSelect-select": { color: "#eee" },
      }
    : {};

  //Handlers
  const handleChange =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues({ ...values, [field]: e.target.value });
      setErrors({ ...errors, [field]: undefined });
    };

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!values.name) newErrors.name = label("Name is required", "الاسم مطلوب");
    if (!values.email)
      newErrors.email = label("Email is required", "البريد الإلكتروني مطلوب");
    else if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(values.email))
      newErrors.email = label(
        "Invalid email address",
        "عنوان البريد الإلكتروني غير صالح"
      );
    if (!values.phone)
      newErrors.phone = label("Phone is required", "رقم الهاتف مطلوب");
    if (!values.departmentId)
      newErrors.departmentId = label("Please select a department", "يرجى اختيار القسم");
    if (!values.designationId)
      newErrors.designationId = label(
        "Please select a designation",
        "يرجى اختيار المسمى الوظيفي"
      );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit?.(values);
    console.log(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} dir={dir}>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {/* Name */}
        <Box flex={isSm ? "1 1 100%" : "1 1 48%"}>
          <TextField
            fullWidth
            label={label("Name", "الاسم")}
            value={values.name}
            onChange={handleChange("name")}
            error={!!errors.name}
            helperText={errors.name}
            sx={darkInputStyles}
          />
        </Box>

        {/* Email */}
        <Box flex={isSm ? "1 1 100%" : "1 1 48%"}>
          <TextField
            fullWidth
            label={label("Email", "البريد الإلكتروني")}
            value={values.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            sx={darkInputStyles}
          />
        </Box>

        {/* Phone */}
        <Box flex={isSm ? "1 1 100%" : "1 1 48%"}>
          <TextField
            fullWidth
            label={label("Phone", "رقم الهاتف")}
            value={values.phone}
            onChange={handleChange("phone")}
            error={!!errors.phone}
            helperText={errors.phone}
            sx={darkInputStyles}
          />
        </Box>

        {/* Department */}
        <Box flex={isSm ? "1 1 100%" : "1 1 48%"}>
          <TextField
            select
            fullWidth
            label={label("Department", "القسم")}
            value={values.departmentId}
            onChange={handleChange("departmentId")}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            sx={darkInputStyles}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {label(dept.en, dept.ar)}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Designation */}
        <Box flex={isSm ? "1 1 100%" : "1 1 48%"}>
          <TextField
            select
            fullWidth
            disabled={!values.departmentId}
            label={label("Designation", "المسمى الوظيفي")}
            value={values.designationId}
            onChange={handleChange("designationId")}
            error={!!errors.designationId}
            helperText={errors.designationId}
            sx={darkInputStyles}
          >
            {designationOptions.map((des) => (
              <MenuItem key={des.id} value={des.id}>
                {label(des.en, des.ar)}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Submit */}
        <Box
          flex="1 1 100%"
          display="flex"
          justifyContent={isSm ? "center" : language === "ar" ? "flex-start" : "flex-end"}
        >
          <Button variant="contained" type="submit" sx={{ backgroundColor: "#484c7f" }}>
            {label("Add Employee", "إضافة موظف")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddEmployeeForm;
