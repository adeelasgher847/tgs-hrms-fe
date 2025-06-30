import type React from "react";
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Fab,
  useMediaQuery,
  useTheme,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Add as AddIcon, Business as BusinessIcon } from "@mui/icons-material";
import type { Department, DepartmentFormData } from "../../types";
import { mockDepartments } from "../../data/mock-departments";
import { DepartmentCard } from "./DepartmentCard";
import { DepartmentFormModal } from "./Department-form-modal";
import { DeleteConfirmationModal } from "./Delete-confirmation-modal";

export const DepartmentList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isRtl, setIsRtl] = useState(false);

  const handleCreateDepartment = (data: DepartmentFormData) => {
    const newDepartment: Department = {
      id: Date.now().toString(),
      name: data.name,
      nameAr: data.nameAr,
      description: data.description || undefined,
    };
    setDepartments((prev) => [newDepartment, ...prev]);
    setIsFormModalOpen(false);
  };

  const handleEditDepartment = (data: DepartmentFormData) => {
    if (!selectedDepartment) return;
    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === selectedDepartment.id
          ? {
              ...dept,
              name: data.name,
              description: data.description || undefined,
              updatedAt: new Date(),
            }
          : dept
      )
    );
    setSelectedDepartment(null);
    setIsFormModalOpen(false);
  };

  const handleDeleteDepartment = () => {
    if (!selectedDepartment) return;
    setDepartments((prev) =>
      prev.filter((dept) => dept.id !== selectedDepartment.id)
    );
    setSelectedDepartment(null);
    setIsDeleteModalOpen(false);
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedDepartment(null);
    setIsFormModalOpen(true);
  };

  const toggleLanguage = () => {
    setIsRtl(!isRtl);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  textAlign: isRtl ? "right" : "left",
                }}
              >
                {isRtl ? "إدارة الأقسام" : "Department"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: isRtl ? "right" : "left" }}
              ></Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ToggleButtonGroup
              value={isRtl ? "ar" : "en"}
              exclusive
              onChange={toggleLanguage}
              size="small"
            >
              <ToggleButton value="en">EN</ToggleButton>
              <ToggleButton value="ar">عربي</ToggleButton>
            </ToggleButtonGroup>

            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateModal}
                size="large"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                {isRtl ? "إنشاء قسم" : "Create Department"}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Content */}
        {departments.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              backgroundColor: "background.paper",
            }}
          >
            <BusinessIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isRtl ? "لا توجد أقسام" : "No Departments Found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isRtl
                ? "ابدأ بإنشاء قسم جديد لإدارة مؤسستك"
                : "Get started by creating your first department"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
            >
              {isRtl ? "إنشاء قسم جديد" : "Create First Department"}
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
            }}
          >
            {departments.map((department) => (
              <Box
                key={department.id}
                sx={{
                  width: {
                    xs: "100%", // full width on extra-small
                    sm: "calc(50% - 12px)", // two columns
                    md: "calc(33.33% - 16px)", // three columns
                  },
                }}
              >
                <DepartmentCard
                  department={department}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  isRtl={isRtl}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* FAB for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            onClick={openCreateModal}
            sx={{
              position: "fixed",
              bottom: 24,
              right: isRtl ? "auto" : 24,
              left: isRtl ? 24 : "auto",
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Modals */}
        <DepartmentFormModal
          open={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedDepartment(null);
          }}
          onSubmit={
            selectedDepartment ? handleEditDepartment : handleCreateDepartment
          }
          department={selectedDepartment}
          isRtl={isRtl}
        />

        <DeleteConfirmationModal
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDepartment(null);
          }}
          onConfirm={handleDeleteDepartment}
          department={selectedDepartment}
          isRtl={isRtl}
        />
      </Container>
    </Box>
  );
};
