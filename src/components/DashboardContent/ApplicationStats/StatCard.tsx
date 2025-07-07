import { Box, Typography } from "@mui/material";
import type  { StatCardProps } from "../../../types/stat";

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
}: StatCardProps) {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        p: 2,
        boxShadow: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
        minHeight: 80,
      }}
    >
      {/* Icon box */}
      <Box
        sx={{
          backgroundColor: `${iconColor}1A`, // light background from iconColor
          borderRadius: "50%",
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box component="span" sx={{ color: iconColor, fontSize: 28 }}>
          {icon}
        </Box>
      </Box>

      {/* Text content */}
      <Box>
        <Typography fontSize={14} color="text.secondary">
          {title}
        </Typography>
        <Typography fontWeight={700} fontSize={18}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
