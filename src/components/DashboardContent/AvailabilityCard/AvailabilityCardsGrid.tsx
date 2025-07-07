import { Box, Typography } from "@mui/material";
import AvailabilityCard from "./AvailabilityCard";
import { AccessTime, Person } from "@mui/icons-material";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import DoDisturbAltIcon from "@mui/icons-material/DoDisturbAlt";
export default function AvailabilityCardsGrid() {
  const cards = [
    {
      title: "Attendance",
      value: 148,
      icon: <Person />,
      BorderColor: "#f0f0f0",
    },
    {
      title: "Late Coming",
      value: 12,
      icon: <AccessTime />,
      BorderColor: "#f0f0f0",
      color: "black",
    },
    {
      title: "Absent",
      value: 5,
      icon: <DoDisturbAltIcon />,
      BorderColor: "#f0f0f0",
      color: "black",
    },
    {
      title: "Leave Apply",
      value: 32,
      icon: <BeachAccessIcon />,
      BorderColor: "#f0f0f0",
      color: "black",
    },
  ];

  return (
    <Box
      sx={{
        border: "1px solid #f0f0f0",
        borderRadius: "0.375rem",
        backgroundColor: "#fff",
      }}
      p={2}
    >
      {/* Section Title */}
      <Typography fontWeight="bold" fontSize={18} mb={2}>
        Employees Availability
      </Typography>

      {/* Cards Grid */}
      <Box
        sx={{
          display: "flex",
          flex: { xs: "100%", sm: "48%", md: "20%" },
          flexWrap: "wrap",
          gap: 2,
          justifyContent: { xs: "center", md: "space-between" },
        }}
      >
        {cards.map((card) => (
          <Box
            key={card.title}
            sx={{
              flex: { xs: "100%", sm: "33%" },
            }}
          >
            <AvailabilityCard {...card} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
