import { Box, Typography } from "@mui/material";
import InterviewItem from "./InterviewItem";
import { upcomingInterviews } from "../../../data/upcomingInterviews";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

export default function UpcomingInterviews() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? "#111" : "#fff";
  const borderColor = darkMode ? "#252525" : "#f0f0f0";
  const textColor = darkMode ? "#8f8f8f" : "#000";

  const labels = {
    en: "Upcoming Interviews",
    ar: "المقابلات القادمة",
  };

  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: "0.375rem",
        backgroundColor: bgColor,
        direction: language === "ar" ? "rtl" : "ltr",
      }}
    >
      <Typography fontWeight="bold" fontSize={16} mb={2} color={textColor}>
        {labels[language]}
      </Typography>

      {upcomingInterviews[language].map((interview) => (
        <InterviewItem key={interview.name} {...interview} />
      ))}
    </Box>
  );
}
