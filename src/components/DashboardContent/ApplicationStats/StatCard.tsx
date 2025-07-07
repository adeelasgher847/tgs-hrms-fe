import React from "react";
import { Box, Typography } from "@mui/material";

interface StatCardProps {
  iconLeft: React.ReactNode;
  iconRight: React.ReactNode;
  count: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({
  iconLeft,
  iconRight,
  count,
  label,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        border: "1px solid #f0f0f0",
        borderRadius: "0.375rem",
        backgroundColor: "#fff",
      }}
    >
      {/* Left Icon + Text */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            bgcolor: "#b9f3d3",
            p: 1.5,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
          }}
        >
          {iconLeft}
        </Box>

        <Box>
          <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
            {count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Box>

      {/* Right Icon */}
      <Box>{iconRight}</Box>
    </Box>
  );
};

export default StatCard;
