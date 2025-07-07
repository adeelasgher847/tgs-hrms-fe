import { Box } from "@mui/material";
import StatCard from "./StatCard";
import { Checklist, CalendarMonth } from "@mui/icons-material";

export default function ApplicationStats() {
  const stats = [
    {
      title: "Applications",
      value: 7956,
      icon: <Checklist />,
      iconColor: "#6366f1", 
    },
    {
      title: "Interviews",
      value: 4658,
      icon: <CalendarMonth />,
      iconColor: "#3b82f6",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        gap: 2,
        justifyContent: { xs: "center", md: "space-between" },
      }}
    >
      {stats.map((stat) => (
        <Box
          key={stat.title}
          sx={{
            flex: { xs: "100%", sm: "48%", md: "32%" },
            minWidth: 250,
          }}
        >
          <StatCard {...stat} />
        </Box>
      ))}
    </Box>
  );
}
