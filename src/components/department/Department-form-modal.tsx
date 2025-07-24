import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  Typography,
  Alert,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import type { SxProps, Theme } from "@mui/material/styles";
import type {
  Department,
  DepartmentFormData,
  DepartmentFormErrors,
} from "../../types";

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  department?: Department | null;
  isRtl?: boolean;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  department,
  isRtl = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
  });

  const [errors, setErrors] = useState<DepartmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(department);
  const title = isEditing
    ? isRtl
      ? "تعديل القسم"
      : "Edit Department"
    : isRtl
    ? "إنشاء قسم جديد"
    : "Create New Department";

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        nameAr: department.nameAr,
        description: department.description || "",
        descriptionAr: department.descriptionAr || "",
      });
    } else {
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
      });
    }
    setErrors({});
  }, [department, open]);

  const validateForm = (): boolean => {
    const newErrors: DepartmentFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = isRtl
        ? "اسم القسم مطلوب"
        : "Department name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = isRtl
        ? "اسم القسم يجب أن يكون على الأقل حرفين"
        : "Department name must be at least 2 characters";
    }

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = isRtl
        ? "الاسم العربي مطلوب"
        : "Arabic name is required";
    } else if (formData.nameAr.trim().length < 2) {
      newErrors.nameAr = isRtl
        ? "الاسم العربي يجب أن يكون على الأقل حرفين"
        : "Arabic name must be at least 2 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = isRtl
        ? "الوصف يجب أن يكون أقل من 500 حرف"
        : "Description must be less than 500 characters";
    }

    if (formData.descriptionAr && formData.descriptionAr.length > 500) {
      newErrors.descriptionAr = isRtl
        ? "الوصف العربي يجب أن يكون أقل من 500 حرف"
        : "Arabic description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await new Promise((r) => setTimeout(r, 1000));
      onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (field: keyof DepartmentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  // Shared dark mode border styles
  const darkInputStyles: SxProps<Theme> = darkMode
    ? {
        color: "#fff",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#555",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#888",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#90caf9",
        },
      }
    : {};

  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mt: 2,
        direction: isRtl ? "rtl" : "ltr",
        color: darkMode ? "#e0e0e0" : undefined,
      }}
    >
      <TextField
        fullWidth
        label={isRtl ? "اسم القسم (بالإنجليزية)" : "Department Name (English)"}
        value={formData.name}
        onChange={handleInputChange("name")}
        error={!!errors.name}
        helperText={errors.name}
        required
        InputLabelProps={{ style: { color: darkMode ? "#ccc" : undefined } }}
        InputProps={{
          sx: darkInputStyles,
        }}
      />

      <TextField
        fullWidth
        label={isRtl ? "اسم القسم (بالعربية)" : "Department Name (Arabic)"}
        value={formData.nameAr}
        onChange={handleInputChange("nameAr")}
        error={!!errors.nameAr}
        helperText={errors.nameAr}
        required
        InputLabelProps={{ style: { color: darkMode ? "#ccc" : undefined } }}
        InputProps={{
          sx: darkInputStyles,
        }}
        sx={{
          "& .MuiInputBase-input": { textAlign: "right" },
        }}
      />

      <TextField
        fullWidth
        label={
          isRtl
            ? "الوصف (بالإنجليزية - اختياري)"
            : "Description (English - Optional)"
        }
        value={formData.description}
        onChange={handleInputChange("description")}
        error={!!errors.description}
        helperText={errors.description}
        multiline
        rows={3}
        InputLabelProps={{ style: { color: darkMode ? "#ccc" : undefined } }}
        InputProps={{
          sx: darkInputStyles,
        }}
      />

      <TextField
        fullWidth
        label={
          isRtl
            ? "الوصف (بالعربية - اختياري)"
            : "Description (Arabic - Optional)"
        }
        value={formData.descriptionAr}
        onChange={handleInputChange("descriptionAr")}
        error={!!errors.descriptionAr}
        helperText={errors.descriptionAr}
        multiline
        rows={3}
        InputLabelProps={{ style: { color: darkMode ? "#ccc" : undefined } }}
        InputProps={{
          sx: darkInputStyles,
        }}
        sx={{
          "& .MuiInputBase-input": { textAlign: "right" },
        }}
      />

      {Object.keys(errors).length > 0 && (
        <Alert severity="error">
          {isRtl
            ? "يرجى تصحيح الأخطاء أعلاه"
            : "Please correct the errors above"}
        </Alert>
      )}
    </Box>
  );

  const actionButtons = (
    <>
      <Button onClick={onClose} disabled={isSubmitting}>
        {isRtl ? "إلغاء" : "Cancel"}
      </Button>
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        onClick={handleSubmit}
        sx={{ bgcolor: "#484c7f" }}
      >
        {isSubmitting
          ? isRtl
            ? "جاري الحفظ..."
            : "Saving..."
          : isEditing
          ? isRtl
            ? "تحديث"
            : "Update"
          : isRtl
          ? "إنشاء"
          : "Create"}
      </Button>
    </>
  );

  const paperSx: SxProps<Theme> = {
    direction: isRtl ? "rtl" : "ltr",
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    color: darkMode ? "#e0e0e0" : undefined,
  };

  if (isMobile) {
    return (
      <Drawer
        anchor={isRtl ? "right" : "left"}
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: "100%", maxWidth: 400, ...paperSx } }}
      >
        <Box
          sx={{
            p: 3,
            overflowY: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon sx={{ color: darkMode ? "#fff" : undefined }} />
            </IconButton>
          </Box>
          {formContent}
          <Box
            sx={{ display: "flex", gap: 1, mt: 3, justifyContent: "flex-end" }}
          >
            {actionButtons}
          </Box>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={paperSx} style={{ position: "relative" }}>
        <Typography sx={{ textAlign: isRtl ? "right" : "left" }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: isRtl ? "auto" : 8,
            left: isRtl ? 8 : "auto",
            top: 8,
            color: darkMode ? "#fff" : undefined,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...paperSx,
          pt: 2,
          maxHeight: "70vh",
          overflowY: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {formContent}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, ...paperSx }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};
