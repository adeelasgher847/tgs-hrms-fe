import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Fab,
  useMediaQuery,
  useTheme,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
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
        flexGrow: 1,
        direction: isRtl ? "rtl" : "ltr",
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        boxSizing: "border-box",
        // backgroundColor: "#f8f8f8",
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 0,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,

                textAlign: isRtl ? "right" : "left",
              }}
            >
              {isRtl ? "إدارة الأقسام" : "Departments"}
            </Typography>
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
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#45407A",
              }}
            >
              {isRtl ? "إنشاء قسم" : "Create Department"}
            </Button>
          )}
        </Box>
      </Paper>
      <Divider sx={{ mb: 4, borderColor: "#ccc" }} />

      {/* Content */}
      {departments.length === 0 ? (
        <Paper
          sx={{
            p: 4,

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
            justifyContent: "flex-start",
          }}
        >
          {departments.map((department) => (
            <Box
              key={department.id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)", // 2 cards
                  md: "calc(50% - 12px)",
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
    </Box>
  );
};
