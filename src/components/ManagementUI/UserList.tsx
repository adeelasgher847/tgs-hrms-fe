import React, {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import type {
  User,
  Department,
  Designation,
  UserFilters,
} from "../../types/user";
import { departments, designations } from "../../Data/mockUser";

// Mock API functions
const fetchUsers = async (): Promise<User[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return initialMockUsers;
};

const fetchDepartments = async (): Promise<Department[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return departments;
};

const fetchDesignations = async (): Promise<Designation[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return designations;
};

const deleteUser = async (userId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("User deleted:", userId);
};

// Initial mock data
const initialMockUsers: User[] = [
  {
    id: "1",
    fullName: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    department: "1",
    designation: "1",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    role: "user",
    department: "2",
    designation: "3",
    createdAt: "2024-01-16",
    updatedAt: "2024-01-16",
  },
  {
    id: "3",
    fullName: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "manager",
    department: "1",
    designation: "2",
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17",
  },
];

export interface UserListRef {
  addUserToList: (user: User) => void;
  updateUserInList: (user: User) => void;
}

interface UserListProps {
  onEditUser: (user: User) => void;
  onCreateUser: () => void;
  refreshTrigger?: number;
}

const UserList = forwardRef<UserListRef, UserListProps>(
  ({ onEditUser, onCreateUser, refreshTrigger }, ref) => {
    const [users, setUsers] = useState<User[]>(initialMockUsers);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilters>({
      department: "",
      designation: "",
      search: "",
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useImperativeHandle(ref, () => ({
      addUserToList: (newUser: User) => {
        setUsers((prevUsers) => [newUser, ...prevUsers]);
      },
      updateUserInList: (updatedUser: User) => {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === updatedUser.id ? updatedUser : user
          )
        );
      },
    }));

    useEffect(() => {
      const loadData = async () => {
        try {
          const [usersData, departmentsData, designationsData] =
            await Promise.all([
              fetchUsers(),
              fetchDepartments(),
              fetchDesignations(),
            ]);
          setUsers(usersData);
          setDepartments(departmentsData);
          setDesignations(designationsData);
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [refreshTrigger]);

    const filteredUsers = useMemo(() => {
      return users.filter((user) => {
        const matchesDepartment =
          !filters.department || user.department === filters.department;
        const matchesDesignation =
          !filters.designation || user.designation === filters.designation;
        const matchesSearch =
          !filters.search ||
          user.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase());

        return matchesDepartment && matchesDesignation && matchesSearch;
      });
    }, [users, filters]);

    const availableDesignations = useMemo(() => {
      return filters.department
        ? designations.filter(
            (designation) => designation.departmentId === filters.department
          )
        : designations;
    }, [filters.department, designations]);

    const handleDeleteClick = (user: User) => {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
      if (userToDelete) {
        try {
          await deleteUser(userToDelete.id);
          setUsers((prevUsers) =>
            prevUsers.filter((user) => user.id !== userToDelete.id)
          );
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      }
    };

    const handleDeleteCancel = () => {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    };

    const getRoleColor = (role: string) => {
      switch (role) {
        case "admin":
          return "error";
        case "manager":
          return "warning";
        case "user":
          return "info";
        default:
          return "default";
      }
    };

    const getDepartmentName = (departmentId: string) => {
      const dept = departments.find((d) => d.id === departmentId);
      return dept ? dept.name : "Unknown";
    };

    const getDesignationName = (designationId: string) => {
      const designation = designations.find((d) => d.id === designationId);
      return designation ? designation.name : "Unknown";
    };

    if (loading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography>Loading users...</Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateUser}
          >
            Add User
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2}>
            <TextField
              label="Search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    department: e.target.value,
                    designation: "",
                  })
                }
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Designation</InputLabel>
              <Select
                value={filters.designation}
                onChange={(e) =>
                  setFilters({ ...filters, designation: e.target.value })
                }
                label="Designation"
              >
                <MenuItem value="">All Designations</MenuItem>
                {availableDesignations.map((designation) => (
                  <MenuItem key={designation.id} value={designation.id}>
                    {designation.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={
                        getRoleColor(user.role) as
                          | "error"
                          | "warning"
                          | "info"
                          | "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getDepartmentName(user.department)}</TableCell>
                  <TableCell>{getDesignationName(user.designation)}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => onEditUser(user)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(user)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{userToDelete?.fullName}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);

UserList.displayName = "UserList";

export default UserList;
