import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { Department } from "../types";

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
  isRtl?: boolean;
  darkMode?: boolean;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onEdit,
  onDelete,
  isRtl = false,
  darkMode = false,
}) => {
  const cardBg = "transparent"; // no background in both modes
  const cardShadow = "none"; // no shadow
  const hoverShadow = darkMode ? 4 : 2;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        px: 2,
        flexDirection: "column",
        transition: "all 0.3s ease",
        direction: isRtl ? "rtl" : "ltr",
        backgroundColor: cardBg,
        boxShadow: cardShadow,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: hoverShadow,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              textAlign: isRtl ? "right" : "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {isRtl ? department.nameAr : department.name}
          </Typography>
        </Box>

        {(isRtl ? department.subtitleAr : department.subtitle) && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              textAlign: isRtl ? "right" : "left",
              mb: 2,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isRtl ? department.subtitleAr : department.subtitle}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {(isRtl ? department.descriptionAr : department.description) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              textAlign: isRtl ? "right" : "left",
            }}
          >
            {isRtl ? department.descriptionAr : department.description}
          </Typography>
        )}
      </CardContent>

      <CardActions
        sx={{
          justifyContent: isRtl ? "flex-start" : "flex-start",
          px: 2,
          pb: 2,
        }}
      >
        <Box display="flex" width={100}>
          <IconButton
            onClick={() => onEdit(department)}
            color="success"
            size="small"
            sx={{
              border: "1px solid gray",
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
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            onClick={() => onDelete(department)}
            color="error"
            size="small"
            sx={{
              border: "1px solid gray",
              borderLeft: isRtl ? "1px solid gray" : "none",
              borderRight: isRtl ? "none" : "1px solid gray",
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
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};
