import React from "react";
import { Box, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
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
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const bgColor = darkMode ? "#111" : "#fff";
  const borderColor = darkMode ? "#252525" : "#f0f0f0";
  const textColor = darkMode ? "#8f8f8f" : "#000";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: "0.375rem",
        backgroundColor: bgColor,
      }}
    >
      {/* Left Icon + Text */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            bgcolor: "#a0d9b4",
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
          <Typography
            variant="h6"
            fontWeight={600}
            lineHeight={1.2}
            color={textColor}
          >
            {count}
          </Typography>
          <Typography variant="body2" color={textColor}>
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
