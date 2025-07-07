import StatCard from "./StatCard";
import { Box } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group"; // Interviews icon
import TrendingUpIcon from "@mui/icons-material/TrendingUp"; // Hired icon
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";

const ApplicationStats = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <StatCard
        iconLeft={<GroupIcon sx={{ color: "#000" }} />}
        iconRight={<BarChartIcon sx={{ color: "gray" }} />}
        count={246}
        label="Interviews"
      />

      <StatCard
        iconLeft={<TrendingUpIcon sx={{ color: "#000" }} />}
        iconRight={<ShowChartIcon sx={{ color: "gray" }} />}
        count={101}
        label="Hired"
      />
    </Box>
  );
};

export default ApplicationStats;
