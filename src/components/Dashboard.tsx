import React from "react";
import { Box } from "@mui/material";

import EmployeesInfoChart from "./DashboardContent/EmployeesInfoChart";
import AvailabilityCardsGrid from "./DashboardContent/AvailabilityCard/AvailabilityCardsGrid";
import TotalEmployeesDonut from "./DashboardContent/TotalEmployeesDonut";
import UpcomingInterviews from "./DashboardContent/ComingInterview/UpcomingInterviews";
import PerformanceChart from "./DashboardContent/PerformanceChart";
import TopPerformersProps from "./DashboardContent/TopPerformance/TopPerformersProps";
import IconImageCardProps from "./DashboardContent/TotalApplication/IconImageCardProps";
import ApplicationStats from "./DashboardContent/ApplicationStats/ApplicationStats";
import { useOutletContext } from "react-router-dom";
const Dashboard: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: 3,
        //  backgroundColor: darkMode ? "#1a1a2e" : "#f9fafb",
        color: darkMode ? "#fff" : "#000",
      }}
    >
      {/* Grid*/}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        {/* Left Section */}
        <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <EmployeesInfoChart />
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box flex={1}>
              <AvailabilityCardsGrid />
            </Box>
            <Box flex={1}>
              <TotalEmployeesDonut />
            </Box>
          </Box>

          <PerformanceChart />
        </Box>
        {/* Right Section */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <IconImageCardProps />
          <ApplicationStats />
          <UpcomingInterviews />
        </Box>
      </Box>

      {/* Bottom Section: Top Performers */}
      <Box mt={1}>
        <TopPerformersProps />
      </Box>
    </Box>
  );
};

export default Dashboard;
