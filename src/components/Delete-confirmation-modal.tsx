import type React from "react";
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
  Drawer,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { Department } from "../types";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  department: Department | null;
  isRtl?: boolean;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({ open, onClose, onConfirm, department, isRtl = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!department) return null;

  const title = isRtl ? "تأكيد الحذف" : "Confirm Delete";
  const message = isRtl
    ? `هل أنت متأكد من أنك تريد حذف قسم "${department.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
    : `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`;

  const content = (
    <Box sx={{ textAlign: "center", direction: isRtl ? "rtl" : "ltr" }}>
      <WarningIcon
        sx={{
          fontSize: 64,
          color: "warning.main",
          mb: 2,
        }}
      />
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          textAlign: isRtl ? "right" : "left",
          lineHeight: 1.6,
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  const actionButtons = (
    <>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }}
      >
        {isRtl ? "إلغاء" : "Cancel"}
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
        {isRtl ? "حذف" : "Delete"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
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

          {content}

          <Box
            sx={{ display: "flex", gap: 1, mt: 3, justifyContent: "center" }}
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
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>{title}</DialogTitle>

      <DialogContent>{content}</DialogContent>

      <DialogActions sx={{ justifyContent: "center", p: 3, pt: 1 }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};
