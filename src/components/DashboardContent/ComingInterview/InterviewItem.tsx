import { Avatar, Box, Typography } from "@mui/material";
import type { Interview } from "../../../types/interview";

export default function InterviewItem({
  name,
  role,
  time,
  avatarUrl,
}: Interview) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#fff",
        p: 1.5,
        mb: 1,
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Avatar alt={name} src={avatarUrl} sx={{ width: 48, height: 48 }} />

      <Box sx={{ flexGrow: 1, ml: 2 }}>
        <Typography fontWeight="bold">{name}</Typography>
        <Typography fontSize={14} color="text.secondary">
          {role}
        </Typography>
      </Box>

      <Typography fontSize={14} color="text.secondary">
        {time}
      </Typography>
    </Box>
  );
}
