import { Box, Typography } from "@mui/material";
import AvailabilityCard from "./AvailabilityCard";
import CheckedIcon from "../../../assets/dashboardIcon/checked.svg";
import stopwatchIcon from "../../../assets/dashboardIcon/stopwatch.svg";
import banIcon from "../../../assets/dashboardIcon/ban.svg";
import beachIcon from "../../../assets/dashboardIcon/beach-bed.svg";
import { useOutletContext } from "react-router-dom";
export default function AvailabilityCardsGrid() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const bgColor = darkMode ? "#111" : "#fff";
  const borderColor = darkMode ? "#252525" : "#f0f0f0";
  const textColor = darkMode ? "#8f8f8f" : "#000";
  const cards = [
    {
      title: "Attendance",
      value: 148,
      icon: (
        <img
          src={CheckedIcon}
          alt="Attendance"
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? "invert(1) brightness(0.4)"
              : "grayscale(100%) brightness(55%)",
          }}
        />
      ),
      BorderColor: "#f0f0f0",
    },
    {
      title: "Late Coming",
      value: 12,
      icon: (
        <img
          src={stopwatchIcon}
          alt="LateComing"
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? "invert(1) brightness(0.4)"
              : "grayscale(100%) brightness(55%)",
          }}
        />
      ),
      BorderColor: "#f0f0f0",
      color: "black",
    },
    {
      title: "Absent",
      value: 5,
      icon: (
        <img
          src={banIcon}
          alt="Absent"
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? "invert(1) brightness(0.4)"
              : "grayscale(100%) brightness(55%)",
          }}
        />
      ),
      BorderColor: "#f0f0f0",
      color: "black",
    },
    {
      title: "Leave Apply",
      value: 32,
      icon: (
        <img
          src={beachIcon}
          alt="LeaveApply"
          style={{
            width: 30,
            height: 30,
            filter: darkMode
              ? "invert(1) brightness(0.4)"
              : "grayscale(100%) brightness(55%)",
          }}
        />
      ),
      BorderColor: "#f0f0f0",
      color: "black",
    },
  ];

  return (
    <Box
      sx={{
        border: `1px solid  ${borderColor}`,
        borderRadius: "0.375rem",
        backgroundColor: bgColor,
      }}
      p={2}
    >
      {/* Section Title */}
      <Typography fontWeight="bold" fontSize={16} mb={2} color={textColor}>
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
