import React from "react";
import { Box, Typography, Card, CardContent, Avatar } from "@mui/material";

type Performer = {
  name: string;
  email: string;
  percentage: number;
  icon: React.ReactNode;
};

type TopPerformersProps = {
  title?: string;
  subtitle?: string;
  newTask: number;
  completedTask: number;
  performers: Performer[];
};

const TopPerformers: React.FC<TopPerformersProps> = ({
  title = "Top Performers",
  subtitle = "You have 140 influencers in your company.",
  newTask,
  completedTask,
  performers,
}) => {
  return (
    <Box p={3} bgcolor="#f1c8db" borderRadius={3} boxShadow={2}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {subtitle}
      </Typography>

      <Box
        display="flex"
        gap={2}
        mb={4}
        p={2}
        borderRadius={2}
        maxWidth={400}
        width={"100%"}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {newTask}
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            New Task
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {completedTask}
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Task Completed
          </Typography>
        </Box>
      </Box>

      {/* Performer Cards */}
      <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
        {performers.map((p, i) => (
          <Card
            key={i}
            sx={{
              flex: {
                xs: "0 0 calc(50% - 16px)",
                sm: "0 0 calc(33.33% - 16px)",
              },
              maxWidth: "100%",
              borderRadius: 3,
              textAlign: "center",
            }}
          >
            <CardContent>
              <Avatar sx={{ margin: "0 auto", bgcolor: "#1976d2" }}>
                {p.icon}
              </Avatar>
              <Typography mt={1} fontWeight={600}>
                {p.name}
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                {p.email}
              </Typography>
              <Typography mt={1} fontWeight={700} fontSize={38} color="#484c7f">
                {p.percentage}%
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default TopPerformers;
