import React from "react";
import { Box, Button } from "@mui/material";

import EmployeesInfoChart from "./DashboardContent/EmployeesInfoChart";
import AvailabilityCardsGrid from "./DashboardContent/AvailabilityCard/AvailabilityCardsGrid";
import TotalEmployeesDonut from "./DashboardContent/TotalEmployeesDonut";
import UpcomingInterviews from "./DashboardContent/ComingInterview/UpcomingInterviews";
import PerformanceChart from "./DashboardContent/PerformanceChart";
import TopPerformersProps from "./DashboardContent/TopPerformance/TopPerformersProps";
import IconImageCardProps from "./DashboardContent/TotalApplication/IconImageCardProps";
import ApplicationStats from "./DashboardContent/ApplicationStats/ApplicationStats";

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ minHeight: "100vh", px: 2, backgroundColor: "#f9fafb" }}>
      {/* Section 1: Line Chart */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box mb={4} flex={2}>
          <EmployeesInfoChart />
        </Box>
        <Box mb={4} flex={1}>
          <IconImageCardProps />
        </Box>
      </Box>

      {/* Section 2: Availability Cards */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box flex={1}>
          <AvailabilityCardsGrid />
        </Box>
        <Box>
          <TotalEmployeesDonut />
        </Box>
        <Box>
          <ApplicationStats />
        </Box>
      </Box>

      {/* Section 3: Donut + Stat Cards (side-by-side) */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box flex={2}>
          <PerformanceChart />
        </Box>
        <Box flex={1}>
          <UpcomingInterviews />
        </Box>
      </Box>

      {/* Section 4: Upcoming Interviews */}

      {/* Section 5: Performance + Hiring Sources */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        {/* <Box flex={2}>
          
        </Box> */}
      </Box>
      <TopPerformersProps />
    </Box>
  );
};

export default Dashboard;
