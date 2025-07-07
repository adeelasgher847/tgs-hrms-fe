import { Box, Typography } from "@mui/material";
import AvailabilityCard from "./AvailabilityCard";
import { AccessTime, Home, Person, PersonOff } from "@mui/icons-material";

export default function AvailabilityCardsGrid() {
  const cards = [
    {
      title: "Attendance",
      value: 148,
      icon: <Person />,
      BorderColor:"#f0f0f0"
    },
    {
      title: "Absent",
      value: 5,
      icon: <PersonOff />,
       BorderColor:"#f0f0f0",
       color:"black"
    },
    {
      title: "Late Coming",
      value: 12,
      icon: <AccessTime />,
 BorderColor:"#f0f0f0",
 color:"black"
    },
    {
      title: "Working From Home",
      value: 32,
      icon: <Home />,
       BorderColor:"#f0f0f0",
       color:"black"
    },
  ];

  return (
    <Box  boxShadow={1} p={2}>
      {/* 🔹 Section Title */}
      <Typography fontWeight="bold" fontSize={18} mb={2}>
        Employees Availability
      </Typography>

      {/* 🔹 Cards Grid */}
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
              flex: { xs: "100%", sm: "48%", md: "33%" },
            }}
          >
            <AvailabilityCard {...card} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
