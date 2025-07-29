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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

// ✅ Import mock data from files
import { departments, designations } from "../../Data/mockDataEmploye";

const AddEmployeeForm: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDesig, setSelectedDesig] = useState("");
  const [errors, setErrors] = useState({ designation: "" });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      setErrors({ designation: "Designation is required." });
      return;
    }
    alert(`Department: ${selectedDept}, Designation: ${selectedDesig}`);
  };

  const filteredDesignations = designations.filter(
    (d) => d.departmentId === selectedDept
  );

  return (
    <Box sx={{ px: 3, py: 5 }}>
      <Typography variant="h6" textAlign="center" mb={3}>
        Add Employee
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "center",
          flexWrap: "wrap",
          direction: theme.direction,
        }}
      >
        {/* Department */}
        <FormControl fullWidth sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDept}
            label="Department"
            onChange={handleDeptChange}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
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
          <InputLabel>Designation</InputLabel>
          <Select
            value={selectedDesig}
            label="Designation"
            onChange={handleDesignationChange}
          >
            {filteredDesignations.map((des) => (
              <MenuItem key={des.id} value={des.id}>
                {des.name}
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
            color: "#fff",
            backgroundColor: "#484c7f",
          }}
        >
          Add Employee
        </Button>
      </Box>
    </Box>
  );
};

export default AddEmployeeForm;
