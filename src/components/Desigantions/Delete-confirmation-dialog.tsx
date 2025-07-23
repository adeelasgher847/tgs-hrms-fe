import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useLanguage } from "../../context/LanguageContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  designationTitle: string;
  isRTL: boolean;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  designationTitle,
  isRTL,
}: Props) {
  const { language } = useLanguage();
  const getText = (en: string, ar: string) => (language === "ar" ? ar : en);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      dir={isRTL ? "rtl" : "ltr"}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            {getText("Confirm Delete", "تأكيد الحذف")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {getText(
            `Are you sure you want to delete "${designationTitle}"?`,
            `هل أنت متأكد أنك تريد حذف "${designationTitle}"؟`
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" size="large">
          {getText("Cancel", "إلغاء")}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" size="large">
          {getText("Delete", "حذف")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
