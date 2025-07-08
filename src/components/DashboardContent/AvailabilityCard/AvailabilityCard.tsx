import { Box, Typography } from "@mui/material";
import type { AvailabilityCardProps } from "../../../types/availability";

export default function AvailabilityCard({
  title,
  value,
  icon,
  BorderColor,
  color,
}: AvailabilityCardProps) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: BorderColor || "#f0f0f0",
        borderRadius: "0.375rem",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 80,
        backgroundColor: "#fff",
        color: color || "black",
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: "50%",
          width: 48,
          height: 35,
        }}
      >
        <Box component="span" sx={{ fontSize: 28 }}>
          {icon}
        </Box>
      </Box>

      {/* Text content */}
      <Box>
        <Typography fontSize={14} fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="h6" fontSize={16} color="#9a9b9d">
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
