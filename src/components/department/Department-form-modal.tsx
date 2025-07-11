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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (field: keyof DepartmentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev: DepartmentFormData) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev: DepartmentFormErrors) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <TextField
        fullWidth
        label={isRtl ? "اسم القسم (بالإنجليزية)" : "Department Name (English)"}
        value={formData.name}
        onChange={handleInputChange("name")}
        error={Boolean(errors.name)}
        helperText={errors.name}
        required
        autoFocus={!isRtl}
        InputLabelProps={{
          style: { textAlign: isRtl ? "right" : "left" },
        }}
        sx={{
          "& .MuiInputBase-input": {
            textAlign: "left", // Always left for English
          },
        }}
      />

      <TextField
        fullWidth
        label={isRtl ? "اسم القسم (بالعربية)" : "Department Name (Arabic)"}
        value={formData.nameAr}
        onChange={handleInputChange("nameAr")}
        error={Boolean(errors.nameAr)}
        helperText={errors.nameAr}
        required
        autoFocus={isRtl}
        InputLabelProps={{
          style: { textAlign: isRtl ? "right" : "left" },
        }}
        sx={{
          "& .MuiInputBase-input": {
            textAlign: "right", // Always right for Arabic
            fontFamily: "Arial, sans-serif",
          },
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
        error={Boolean(errors.description)}
        helperText={errors.description}
        multiline
        rows={3}
        InputLabelProps={{
          style: { textAlign: isRtl ? "right" : "left" },
        }}
        sx={{
          "& .MuiInputBase-input": {
            textAlign: "left", // Always left for English
          },
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
        error={Boolean(errors.descriptionAr)}
        helperText={errors.descriptionAr}
        multiline
        rows={3}
        InputLabelProps={{
          style: { textAlign: isRtl ? "right" : "left" },
        }}
        sx={{
          "& .MuiInputBase-input": {
            textAlign: "right", // Always right for Arabic
            fontFamily: "Arial, sans-serif",
          },
        }}
      />

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ textAlign: isRtl ? "right" : "left" }}>
          {isRtl
            ? "يرجى تصحيح الأخطاء أعلاه"
            : "Please correct the errors above"}
        </Alert>
      )}
    </Box>
  );

  const actionButtons = (
    <>
      <Button
        onClick={onClose}
        disabled={isSubmitting}
        sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }}
      >
        {isRtl ? "إلغاء" : "Cancel"}
      </Button>
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        onClick={handleSubmit}
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

  if (isMobile) {
    return (
      <Drawer
        anchor={isRtl ? "right" : "left"}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 400,
            direction: isRtl ? "rtl" : "ltr",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          direction: isRtl ? "rtl" : "ltr",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: isRtl ? "right" : "left" }}>
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: isRtl ? "auto" : 8,
            left: isRtl ? 8 : "auto",
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>{formContent}</DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>{actionButtons}</DialogActions>
    </Dialog>
  );
};
