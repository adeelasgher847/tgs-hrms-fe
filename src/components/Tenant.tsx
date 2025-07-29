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
  Card,
  CardContent,
  CardActions,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Business as BusinessIcon } from "@mui/icons-material";
import { mockTenants } from "../Data/mock-tenants";
import type { Tenant } from "../types";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import edit from "../assets/dashboardIcon/edit.svg";
import deleteIcon from "../assets/dashboardIcon/ui-delete.svg";

const labels = {
  en: {
    title: "Tenants",
    create: "Create Tenant",
    createFirst: "Create First Tenant",
    noTenants: "No Tenants Found",
    description: "Get started by creating your first tenant",
    name: "Tenant Name",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this tenant?",
  },
  ar: {
    title: "المستأجرون",
    create: "إنشاء مستأجر",
    createFirst: "إنشاء أول مستأجر",
    noTenants: "لا يوجد مستأجرون",
    description: "ابدأ بإنشاء أول مستأجر لإدارتهم",
    name: "اسم المستأجر",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذا المستأجر؟",
  },
};

export const TenantPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>() || {
    darkMode: false,
  };
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const lang = labels[language];

  const bgPaper = darkMode ? "#1b1b1b" : "#fff";
  const textPrimary = darkMode ? "#e0e0e0" : theme.palette.text.primary;
  const textSecond = darkMode ? "#9a9a9a" : theme.palette.text.secondary;
  const dividerCol = darkMode ? "#333" : "#ccc";
  const textColor = darkMode ? "#8f8f8f" : "#000";
  const cardBg = darkMode ? "#111" : "#fff";
  const cardText = darkMode ? "#ccc" : "#000";
  const cardBorder = darkMode ? "#333" : "#f0f0f0";

  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formName, setFormName] = useState("");

  const handleCreateTenant = () => {
    if (!formName.trim()) return;
    const newTenant: Tenant = {
      id: Date.now().toString(),
      name: formName,
      nameAr: formName, // For demo, use same as name. You can add a separate input for Arabic if needed.
    };
    setTenants((prev) => [newTenant, ...prev]);
    setIsFormModalOpen(false);
    setFormName("");
  };

  const handleEditTenant = () => {
    if (!selectedTenant || !formName.trim()) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === selectedTenant.id
          ? { ...t, name: formName, nameAr: formName }
          : t
      )
    );
    setSelectedTenant(null);
    setIsFormModalOpen(false);
    setFormName("");
  };

  const handleDeleteTenant = () => {
    if (!selectedTenant) return;
    setTenants((prev) => prev.filter((t) => t.id !== selectedTenant.id));
    setSelectedTenant(null);
    setIsDeleteModalOpen(false);
  };

  const openCreateModal = () => {
    setSelectedTenant(null);
    setFormName("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormName(isRtl && tenant.nameAr ? tenant.nameAr : tenant.name);
    setIsFormModalOpen(true);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        color: textPrimary,
        boxSizing: "border-box",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          backgroundColor: "unset",
          color: textColor,
          boxShadow: "none",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ py: 1.5, textAlign: isRtl ? "right" : "left" }}
        >
          {lang.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              sx={{
                borderRadius: "0.375rem",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: darkMode ? "#605bd4" : "#45407A",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: darkMode ? "#726df0" : "#5b56a0",
                  boxShadow: "none",
                },
              }}
            >
              {lang.create}
            </Button>
          )}
        </Box>
      </Paper>
      <Divider sx={{ mb: 4, borderColor: dividerCol }} />
      {/* Content */}
      {tenants.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: bgPaper,
            color: textPrimary,
            boxShadow: "none",
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: textSecond, mb: 2 }} />
          <Typography variant="h6" color={textSecond} gutterBottom>
            {lang.noTenants}
          </Typography>
          <Typography variant="body2" color={textSecond} sx={{ mb: 3 }}>
            {lang.description}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {lang.createFirst}
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
          {tenants.map((t) => (
            <Box
              key={t.id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)",
                  md: "calc(50% - 12px)",
                },
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  px: 2,
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  backgroundColor: cardBg,
                  color: cardText,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: "unset",
                  direction: isRtl ? "rtl" : "ltr",
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                        color: cardText,
                        textAlign: isRtl ? "right" : "left",
                      }}
                    >
                      {isRtl && t.nameAr ? t.nameAr : t.name}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions
                  sx={{ justifyContent: "flex-start", px: 2, pb: 2 }}
                >
                  <Box display="flex" width={100}>
                    <IconButton
                      onClick={() => openEditModal(t)}
                      color="success"
                      size="small"
                      sx={{
                        border: `1px solid ${cardBorder}`,
                        borderTopLeftRadius: isRtl ? 0 : "5px",
                        borderBottomLeftRadius: isRtl ? 0 : "5px",
                        borderTopRightRadius: isRtl ? "5px" : 0,
                        borderBottomRightRadius: isRtl ? "5px" : 0,
                        "&:hover": {
                          backgroundColor: "orange",
                          color: "white",
                        },
                      }}
                    >
                      <img
                        src={edit}
                        alt="Edit"
                        style={{
                          width: 15,
                          height: 15,
                          filter:
                            "invert(48%) sepia(59%) saturate(528%) hue-rotate(85deg) brightness(90%) contrast(91%)",
                        }}
                      />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTenant(t);
                        setIsDeleteModalOpen(true);
                      }}
                      color="error"
                      size="small"
                      sx={{
                        border: `1px solid ${cardBorder}`,
                        borderTopLeftRadius: isRtl ? "5px" : 0,
                        borderBottomLeftRadius: isRtl ? "5px" : 0,
                        borderTopRightRadius: isRtl ? 0 : "5px",
                        borderBottomRightRadius: isRtl ? 0 : "5px",
                        "&:hover": {
                          backgroundColor: "orange",
                          color: "white",
                        },
                      }}
                    >
                      <img
                        src={deleteIcon}
                        alt="Delete"
                        style={{
                          width: 15,
                          height: 15,
                          filter:
                            "invert(28%) sepia(97%) saturate(1404%) hue-rotate(329deg) brightness(95%) contrast(96%)",
                        }}
                      />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}
      {/* FAB (mobile) */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={openCreateModal}
          sx={{
            position: "fixed",
            bottom: 24,
            right: isRtl ? "auto" : 24,
            left: isRtl ? 24 : "auto",
            boxShadow: "none",
          }}
        >
          <AddIcon />
        </Fab>
      )}
      {/* Form Modal */}
      {isFormModalOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(0,0,0,0.3)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{ p: 4, minWidth: 320, bgcolor: bgPaper, color: textPrimary }}
          >
            <Typography
              variant="h6"
              mb={2}
              sx={{ textAlign: isRtl ? "right" : "left" }}
            >
              {selectedTenant ? lang.edit : lang.create}
            </Typography>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={lang.name}
              style={{
                width: "100%",
                padding: 8,
                marginBottom: 16,
                fontSize: 16,
                background: bgPaper,
                color: textPrimary,
                border: `1px solid ${dividerCol}`,
                direction: isRtl ? "rtl" : "ltr",
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                flexDirection: isRtl ? "row-reverse" : "row",
              }}
            >
              <Button
                onClick={() => {
                  setIsFormModalOpen(false);
                  setSelectedTenant(null);
                  setFormName("");
                }}
                sx={{ color: textPrimary }}
              >
                {lang.cancel}
              </Button>
              <Button
                variant="contained"
                onClick={selectedTenant ? handleEditTenant : handleCreateTenant}
                disabled={!formName.trim()}
                sx={{
                  bgcolor: darkMode ? "#605bd4" : "#45407A",
                  "&:hover": { bgcolor: darkMode ? "#726df0" : "#5b56a0" },
                }}
              >
                {lang.save}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(0,0,0,0.3)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{ p: 4, minWidth: 320, bgcolor: bgPaper, color: textPrimary }}
          >
            <Typography
              variant="h6"
              mb={2}
              sx={{ textAlign: isRtl ? "right" : "left" }}
            >
              {lang.confirmDelete}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                flexDirection: isRtl ? "row-reverse" : "row",
              }}
            >
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTenant(null);
                }}
                sx={{ color: textPrimary }}
              >
                {lang.cancel}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteTenant}
              >
                {lang.delete}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
