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
import { useOutletContext } from "react-router-dom";
import type { Department, DepartmentFormData } from "../../types";
import { mockDepartments } from "../../data/mock-departments";
import { DepartmentCard } from "./DepartmentCard";
import { DepartmentFormModal } from "./Department-form-modal";
import { DeleteConfirmationModal } from "./Delete-confirmation-modal";

export const DepartmentList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  /* ---------- palette helpers ---------- */
  // const bgPage = darkMode ? "#0f0f0f" : "#f8f8f8";
  const bgPaper = darkMode ? "#1b1b1b" : "#fff";
  const textPrimary = darkMode ? "#e0e0e0" : theme.palette.text.primary;
  const textSecond = darkMode ? "#9a9a9a" : theme.palette.text.secondary;
  const dividerCol = darkMode ? "#333" : "#ccc";
  const textColor = darkMode ? "#8f8f8f" : "#000";

  /* ---------- local state ---------- */
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isRtl, setIsRtl] = useState(false);

  /* ---------- handlers ---------- */
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
      prev.map((d) =>
        d.id === selectedDepartment.id
          ? {
              ...d,
              name: data.name,
              description: data.description || undefined,
            }
          : d
      )
    );
    setSelectedDepartment(null);
    setIsFormModalOpen(false);
  };

  const handleDeleteDepartment = () => {
    if (!selectedDepartment) return;
    setDepartments((prev) =>
      prev.filter((d) => d.id !== selectedDepartment.id)
    );
    setSelectedDepartment(null);
    setIsDeleteModalOpen(false);
  };

  /* ---------- UI ---------- */
  return (
    <Box
      sx={{
        flexGrow: 1,
        direction: isRtl ? "rtl" : "ltr",
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        // bgcolor: bgPage,
        color: textPrimary,
        boxSizing: "border-box",
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
          backgroundColor: "unset",
          // bgcolor: bgPaper,
          color: textColor,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          boxShadow="none"
          sx={{ textAlign: isRtl ? "right" : "left", px: 2, py: 1.5 }}
        >
          {isRtl ? "إدارة الأقسام" : "Departments"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2 }}>
          <ToggleButtonGroup
            value={isRtl ? "ar" : "en"}
            exclusive
            onChange={() => setIsRtl(!isRtl)}
            size="small"
            color={darkMode ? "primary" : "standard"}
          >
            <ToggleButton
              value="en"
              sx={{
                color: darkMode ? "#fff" : "#000",
                borderColor: darkMode ? "#555" : "#ccc",
                "&.Mui-selected": {
                  color: "#fff",
                  backgroundColor: darkMode ? "transparent" : "#484c7f",
                },
              }}
            >
              EN
            </ToggleButton>
            <ToggleButton
              value="ar"
              sx={{
                color: darkMode ? "#fff" : "#000",
                borderColor: darkMode ? "#444" : "#ccc",
                "&.Mui-selected": {
                  color: "#fff",
                  backgroundColor: darkMode ? "#555" : "#484c7f",
                },
                "&:hover": {
                  backgroundColor: darkMode ? "#333" : "#f0f0f0",
                },
              }}
            >
              عربي
            </ToggleButton>
          </ToggleButtonGroup>

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: darkMode ? "#605bd4" : "#45407A",
                "&:hover": { bgcolor: darkMode ? "#726df0" : "#5b56a0" },
              }}
            >
              {isRtl ? "إنشاء قسم" : "Create Department"}
            </Button>
          )}
        </Box>
      </Paper>

      <Divider sx={{ mb: 4, borderColor: dividerCol }} />

      {/* Content */}
      {departments.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: bgPaper,
            color: textPrimary,
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: textSecond, mb: 2 }} />
          <Typography variant="h6" color={textSecond} gutterBottom>
            {isRtl ? "لا توجد أقسام" : "No Departments Found"}
          </Typography>
          <Typography variant="body2" color={textSecond} sx={{ mb: 3 }}>
            {isRtl
              ? "ابدأ بإنشاء قسم جديد لإدارة مؤسستك"
              : "Get started by creating your first department"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedDepartment(null);
              setIsFormModalOpen(true);
            }}
          >
            {isRtl ? "إنشاء قسم جديد" : "Create First Department"}
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "flex-start",
          }}
        >
          {departments.map((d) => (
            <Box
              key={d.id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)",
                  md: "calc(50% - 12px)",
                },
              }}
            >
              <DepartmentCard
                department={d}
                onEdit={(dept) => {
                  setSelectedDepartment(dept);
                  setIsFormModalOpen(true);
                }}
                onDelete={(dept) => {
                  setSelectedDepartment(dept);
                  setIsDeleteModalOpen(true);
                }}
                isRtl={isRtl}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* FAB (mobile) */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => {
            setSelectedDepartment(null);
            setIsFormModalOpen(true);
          }}
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
