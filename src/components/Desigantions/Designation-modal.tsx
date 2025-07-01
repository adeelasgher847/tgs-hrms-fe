"use client";

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
import type {
  DesignationModalProps,
  FormErrors,
} from "../Desigantions/designation-modal.types";

export default function DesignationModal({
  open,
  onClose,
  onSave,
  designation,
  isRTL,
  getText,
}: DesignationModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when modal opens/closes or designation changes
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

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {};

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

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSave({ title: title.trim(), titleAr: titleAr.trim() });
      handleClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    setTitle("");
    setTitleAr("");
    setErrors({});
    onClose();
  };

  // Handle Enter key press
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
          {/* English Title Field */}
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

          {/* Arabic Title Field */}
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
        {/* Cancel Button */}
        <Button onClick={handleClose} color="inherit" size="large">
          {getText("Cancel", "إلغاء")}
        </Button>
        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title.trim() || !titleAr.trim()}
          size="large"
        >
          {designation
            ? getText("Update", "تحديث")
            : getText("Create", "إنشاء")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
