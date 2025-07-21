import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Fab,
  useMediaQuery,
  useTheme,
  Paper,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Business as BusinessIcon } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import type { Department, DepartmentFormData } from "../../types";
import { mockDepartments } from "../../Data/mock-departments";
import { DepartmentCard } from "./DepartmentCard";
import { DepartmentFormModal } from "./Department-form-modal";
import { DeleteConfirmationModal } from "./Delete-confirmation-modal";
import { useLanguage } from "../../context/LanguageContext";

const labels = {
  en: {
    title: "Departments",
    create: "Create Department",
    createFirst: "Create First Department",
    noDepartments: "No Departments Found",
    description: "Get started by creating your first department",
  },
  ar: {
    title: "إدارة الأقسام",
    create: "إنشاء قسم",
    createFirst: "إنشاء قسم جديد",
    noDepartments: "لا توجد أقسام",
    description: "ابدأ بإنشاء قسم جديد لإدارة مؤسستك",
  },
};

export const DepartmentList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language, setLanguage } = useLanguage();

  const isRtl = language === "ar";
  const lang = labels[language];

  const bgPaper = darkMode ? "#1b1b1b" : "#fff";
  const textPrimary = darkMode ? "#e0e0e0" : theme.palette.text.primary;
  const textSecond = darkMode ? "#9a9a9a" : theme.palette.text.secondary;
  const dividerCol = darkMode ? "#333" : "#ccc";
  const textColor = darkMode ? "#8f8f8f" : "#000";

  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

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
          ? { ...d, name: data.name, description: data.description || undefined }
          : d
      )
    );
    setSelectedDepartment(null);
    setIsFormModalOpen(false);
  };

  const handleDeleteDepartment = () => {
    if (!selectedDepartment) return;
    setDepartments((prev) => prev.filter((d) => d.id !== selectedDepartment.id));
    setSelectedDepartment(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        direction: isRtl ? "rtl" : "ltr",
        minHeight: "100vh",
        color: textPrimary,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Paper
        elevation={0} // No shadow
        sx={{
          mb: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          backgroundColor: "unset",
          color: textColor,
          boxShadow: "none", // Ensure no shadow
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ textAlign: isRtl ? "right" : "left", py: 1.5 }}
        >
          {lang.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                borderRadius: "0.375rem",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: darkMode ? "#605bd4" : "#45407A",
                boxShadow: "none", // Remove button shadow
                "&:hover": { bgcolor: darkMode ? "#726df0" : "#5b56a0", boxShadow: "none" },
              }}
            >
              {lang.create}
            </Button>
          )}
        </Box>
      </Paper>

      <Divider sx={{ mb: 4, borderColor: dividerCol }} />

      {/* Content */}
      {departments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: bgPaper, color: textPrimary, boxShadow: "none" }}>
          <BusinessIcon sx={{ fontSize: 64, color: textSecond, mb: 2 }} />
          <Typography variant="h6" color={textSecond} gutterBottom>
            {lang.noDepartments}
          </Typography>
          <Typography variant="body2" color={textSecond} sx={{ mb: 3 }}>
            {lang.description}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedDepartment(null);
              setIsFormModalOpen(true);
            }}
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {lang.createFirst}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "flex-start" }}>
          {departments.map((d) => (
            <Box
              key={d.id}
              sx={{
                width: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(50% - 12px)" },
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
            boxShadow: "none", // Remove FAB shadow
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
        onSubmit={selectedDepartment ? handleEditDepartment : handleCreateDepartment}
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
