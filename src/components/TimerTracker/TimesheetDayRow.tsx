import React from "react";
import { Box, Typography } from "@mui/material";

type Props = {
  day: string;
  date: string;
  hours: number;
  ranges: string[];
  highlight?: boolean;
  liveHours?: number | null;
  onClick?: () => void;
};

const formatHours = (h: number) => {
  const totalMinutes = Math.max(0, Math.round(h * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

const TimesheetDayRow: React.FC<Props> = ({
  day,
  date,
  hours,
  ranges,
  highlight,
  liveHours,
  onClick,
}) => {
  const displayedHours = liveHours != null ? liveHours : hours;
  const displayedRange =
    liveHours != null && ranges.length > 0 && ranges[0].endsWith("-")
      ? `${ranges[0]} —`
      : ranges.join(", ");

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      p={2}
      sx={{
        borderRadius: 2,
        bgcolor: highlight ? "#f7f7f5" : "#f9f9f9",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 56,
          borderRadius: 2,
          bgcolor: "#ffffff",
          border: "1px solid #eeeeee",
        }}
      >
        <Typography fontWeight={700} fontSize={14} color="text.primary">
          {day}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {date}
        </Typography>
      </Box>

      <Box>
        <Typography fontWeight={700} color="text.primary">
          {formatHours(displayedHours)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {displayedRange && displayedRange.length > 0 ? displayedRange : "--"}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimesheetDayRow;
