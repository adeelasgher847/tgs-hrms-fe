import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useLanguage } from "../../context/LanguageContext";

interface Designation {
  id: number;
  title: string;
  titleAr: string;
  departmentId: number;
}

interface DesignationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; titleAr: string }) => void;
  designation: Designation | null;
  isRTL: boolean;
}

export default function DesignationModal({
  open,
  onClose,
  onSave,
  designation,
  isRTL,
}: DesignationModalProps) {
  const { language } = useLanguage();
  const getText = (en: string, ar: string) => (language === "ar" ? ar : en);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [errors, setErrors] = useState<{ title?: string; titleAr?: string }>({});

  useEffect(() => {
    if (designation) {
      setTitle(designation.title);
      setTitleAr(designation.titleAr);
    } else {
      setTitle("");
      setTitleAr("");
    }
    setErrors({});
  }, [designation, open]);

  const validateForm = () => {
    const newErrors: { title?: string; titleAr?: string } = {};

    if (!title.trim()) {
      newErrors.title = getText(
        "Designation title is required",
        "عنوان المسمى الوظيفي مطلوب"
      );
    }

    if (!titleAr.trim()) {
      newErrors.titleAr = getText(
        "Arabic title is required",
        "العنوان بالعربية مطلوب"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({ title: title.trim(), titleAr: titleAr.trim() });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setTitleAr("");
    setErrors({});
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          m: isMobile ? 0 : 2,
        },
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">
            {designation
              ? getText("Edit Designation", "تعديل المسمى الوظيفي")
              : getText("Create New Designation", "إنشاء مسمى وظيفي جديد")}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label={getText(
              "Designation Title (English)",
              "عنوان المسمى الوظيفي (بالإنجليزية)"
            )}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
            autoFocus={!isMobile}
            inputProps={{
              dir: "ltr",
            }}
          />

          <TextField
            label={getText(
              "Designation Title (Arabic)",
              "عنوان المسمى الوظيفي (بالعربية)"
            )}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.titleAr}
            helperText={errors.titleAr}
            fullWidth
            required
            inputProps={{
              dir: "rtl",
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} color="inherit" size="large">
          {getText("Cancel", "إلغاء")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title.trim() || !titleAr.trim()}
          size="large"
          sx={{backgroundColor: "#464b8a"}}
        >
          {designation ? getText("Update", "تحديث") : getText("Create", "إنشاء")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
