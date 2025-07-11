import { Box, Typography } from "@mui/material";
import InterviewItem from "./InterviewItem";
import { upcomingInterviews } from "../../../data/upcomingInterviews";
import { useOutletContext } from "react-router-dom";
export default function UpcomingInterviews() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const bgColor = darkMode ? "#111" : "#fff";
  const borderColor = darkMode ? "#252525" : "#f0f0f0";
  const textColor = darkMode ? "#8f8f8f" : "#000";
  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: "0.375rem",
        backgroundColor: bgColor,
      }}
    >
      <Typography fontWeight="bold" fontSize={16} mb={2} color={textColor}>
        Upcoming Interviews
      </Typography>

      {upcomingInterviews.map((interview) => (
        <InterviewItem key={interview.name} {...interview} />
      ))}
    </Box>
  );
}
