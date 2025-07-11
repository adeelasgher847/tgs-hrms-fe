import { Avatar, Box, Typography } from "@mui/material";
import type { Interview } from "../../../types/interview";
import { useOutletContext } from "react-router-dom";
export default function InterviewItem({
  name,
  role,
  time,
  avatarUrl,
}: Interview) {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const textColor = darkMode ? "#8f8f8f" : "#000";
  const Borderbottom = darkMode ? "#8f8f8f" : "#f0f0f0";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        // backgroundColor: "#fff",
        p: 1.5,
        mb: 1,
        borderBottom: `1px solid ${Borderbottom}`,
      }}
    >
      <Avatar alt={name} src={avatarUrl} sx={{ width: 48, height: 48 }} />

      <Box sx={{ flexGrow: 1, ml: 2 }}>
        <Typography fontWeight="bold" color={textColor}>
          {name}
        </Typography>
        <Typography fontSize={14} color={textColor}>
          {role}
        </Typography>
      </Box>

      <Typography fontSize={14} color={textColor}>
        {time}
      </Typography>
    </Box>
  );
}
