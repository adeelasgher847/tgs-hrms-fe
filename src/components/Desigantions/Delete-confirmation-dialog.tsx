import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  designationTitle: string;
  isRTL: boolean;
  getText: (en: string, ar: string) => string;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  designationTitle,

  getText,
}: DeleteConfirmationDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            {getText("Confirm Deletion", "تأكيد الحذف")}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {getText(
            "Are you sure you want to delete this designation?",
            "هل أنت متأكد من أنك تريد حذف هذا المسمى الوظيفي؟"
          )}
        </Typography>

        <Box
          sx={{
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {getText(
              "Designation to be deleted:",
              "المسمى الوظيفي المراد حذفه:"
            )}
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {designationTitle}
          </Typography>
        </Box>

        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {getText(
            "This action cannot be undone.",
            "لا يمكن التراجع عن هذا الإجراء."
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} color="inherit">
          {getText("Cancel", "إلغاء")}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          autoFocus
        >
          {getText("Delete", "حذف")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
