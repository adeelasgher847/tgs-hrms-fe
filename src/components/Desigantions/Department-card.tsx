"use client";

import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import type { Department } from "./designation-manager";

interface DepartmentCardProps {
  department: Department;
  isSelected: boolean;
  onClick: () => void;
  designationCount: number;
  getText: (en: string, ar: string) => string;
}

export default function DepartmentCard({
  department,
  isSelected,
  onClick,
  designationCount,
  getText,
}: DepartmentCardProps) {
  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        border: isSelected
          ? `2px solid ${department.color}`
          : "2px solid transparent",
        bgcolor: isSelected ? `${department.color}08` : "background.paper",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px 0 rgb(0 0 0 / 0.15)",
          bgcolor: isSelected
            ? `${department.color}12`
            : `${department.color}04`,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5, textAlign: "center" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "16px",
            bgcolor: isSelected ? department.color : `${department.color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            mx: "auto",
            mb: 2,
            transition: "all 0.2s ease-in-out",
          }}
        >
          {department.icon}
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight="600"
          sx={{
            mb: 1,
            color: isSelected ? department.color : "text.primary",
            lineHeight: 1.3,
          }}
        >
          {getText(department.name, department.nameAr)}
        </Typography>

        <Chip
          label={`${designationCount} ${getText("positions", "منصب")}`}
          size="small"
          sx={{
            bgcolor: isSelected ? department.color : `${department.color}20`,
            color: isSelected ? "white" : department.color,
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
      </CardContent>
    </Card>
  );
}
