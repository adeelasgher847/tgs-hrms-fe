import { Box, Typography } from "@mui/material";
import InterviewItem from "./InterviewItem";
import { upcomingInterviews } from "../../../data/upcomingInterviews";

export default function UpcomingInterviews() {
  return (
    <Box sx={{ mt: 4, p: 2, backgroundColor: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Typography fontWeight="bold" fontSize={18} mb={2}>
        Upcoming Interviews
      </Typography>

      {upcomingInterviews.map((interview) => (
        <InterviewItem key={interview.name} {...interview} />
      ))}
    </Box>
  );
}
