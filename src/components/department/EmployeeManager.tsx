import React, { useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import AddEmployeeForm from "./AddEmployeeForm";
import EmployeeList from "./EmployeeList";

// Types must match AddEmployeeForm + EmployeeList
interface Employee {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
}

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const handleAddEmployee = (employee: Employee) => {
    setEmployees((prev) => [...prev, employee]);
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Employee Management
      </Typography>

      <AddEmployeeForm onSubmit={handleAddEmployee} />

      <Divider sx={{ my: 4 }} />

      <EmployeeList employees={employees} />
    </Box>
  );
};

export default EmployeeManager;
