import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type {
  User,
  Department,
  Designation,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../types/user";
import { departments, designations } from "../../Data/mockUser";

// Mock roles data
const roles: Array<{ id: string; name: string }> = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "user", name: "User" },
];

// Mock API functions
const createUser = async (data: CreateUserRequest): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const newUser: User = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
  };
  console.log("User created:", newUser);
  return newUser;
};

const updateUser = async (
  id: string,
  data: UpdateUserRequest
): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const updatedUser: User = {
    id,
    ...data,
    updatedAt: new Date().toISOString().split("T")[0],
  } as User;
  console.log("User updated:", updatedUser);
  return updatedUser;
};

const fetchDepartments = async (): Promise<Department[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return departments;
};

const fetchDesignations = async (): Promise<Designation[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return designations;
};

const fetchRoles = async (): Promise<Array<{ id: string; name: string }>> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return roles;
};

interface UserFormProps {
  user?: User | null;
  onSuccess: (userData?: User) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "user",
    department: user?.department || "",
    designation: user?.designation || "",
  });

  const [errors, setErrors] = useState<Partial<CreateUserRequest>>({});
  const [touched, setTouched] = useState<Partial<CreateUserRequest>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [departmentsData, designationsData, rolesData] =
          await Promise.all([
            fetchDepartments(),
            fetchDesignations(),
            fetchRoles(),
          ]);
        setDepartments(departmentsData);
        setDesignations(designationsData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  const validateField = (name: keyof CreateUserRequest, value: string) => {
    switch (name) {
      case "fullName":
        return value.trim() ? "" : "Full name is required";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid";
        return "";
      case "password":
        if (!user && !value.trim()) return "Password is required";
        if (value && value.length < 6)
          return "Password must be at least 6 characters";
        return "";
      case "role":
        return value ? "" : "Role is required";
      case "department":
        return value ? "" : "Department is required";
      case "designation":
        return value ? "" : "Designation is required";
      default:
        return "";
    }
  };

  const handleChange = (name: keyof CreateUserRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof CreateUserRequest) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Partial<CreateUserRequest> = {};
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof CreateUserRequest;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (user) {
        // Exclude password from update data since it's not used in updateUser
        const { password, ...updateData } = formData;
        const updatedUser = await updateUser(user.id, updateData);
        console.log("Form submission successful - update:", updatedUser);
        onSuccess(updatedUser);
      } else {
        const newUser = await createUser(formData);
        console.log("Form submission successful - create:", newUser);
        onSuccess(newUser);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError("Failed to save user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableDesignations = designations.filter(
    (designation) => designation.departmentId === formData.department
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography>Loading form data...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, minHeight: 300 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="start"
        mb={2}
      >
        <Typography variant="h6">
          {user ? "Edit User" : "Create New User"}
        </Typography>
        <IconButton onClick={onCancel} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            error={!!errors.fullName}
            helperText={errors.fullName}
            sx={{ flex: 1 }}
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={!!errors.email}
            helperText={errors.email}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={!!errors.password}
            helperText={
              errors.password ||
              (user ? "Leave blank to keep current password" : "")
            }
            sx={{ flex: 1 }}
          />

          <FormControl error={!!errors.role} sx={{ flex: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              onBlur={() => handleBlur("role")}
              label="Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl error={!!errors.department} sx={{ flex: 1 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              onBlur={() => handleBlur("department")}
              label="Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl error={!!errors.designation} sx={{ flex: 1 }}>
            <InputLabel>Designation</InputLabel>
            <Select
              value={formData.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
              onBlur={() => handleBlur("designation")}
              label="Designation"
              disabled={!formData.department}
            >
              {availableDesignations.map((designation) => (
                <MenuItem key={designation.id} value={designation.id}>
                  {designation.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {submitError && (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{ mt: 1, width: 150, alignSelf: "inherit" }}
        >
          {submitting ? "Saving..." : user ? "Update User" : "Create User"}
        </Button>
      </Box>
    </Paper>
  );
};

export default UserForm;
