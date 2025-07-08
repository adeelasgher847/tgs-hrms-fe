import { Box, Typography } from "@mui/material";
import InterviewItem from "./InterviewItem";
import { upcomingInterviews } from "../../../data/upcomingInterviews";

export default function UpcomingInterviews() {
  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        border: "1px solid #f0f0f0",
        borderRadius: "0.375rem",
        backgroundColor: "#fff",
      }}
    >
      <Typography fontWeight="bold" fontSize={16} mb={2}>
        Upcoming Interviews
      </Typography>

      {upcomingInterviews.map((interview) => (
        <InterviewItem key={interview.name} {...interview} />
      ))}
    </Box>
  );
}
