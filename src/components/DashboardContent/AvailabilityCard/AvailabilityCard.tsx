import { Box, Typography } from "@mui/material";
import type { AvailabilityCardProps } from "../../../types/availability";

export default function AvailabilityCard({
  title,
  value,
  icon,
  BorderColor,
  color
}: AvailabilityCardProps) {
  return (
    <Box
      sx={{
        BorderColor:BorderColor,
        borderRadius: 2,
        padding: 2,
        display: "flex",
        flexDirection:"column",
        gap: 2,
        boxShadow: 1,
        minHeight: 80,
        color: color, 
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
        <Typography fontSize={14}>{title}</Typography>
         <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
