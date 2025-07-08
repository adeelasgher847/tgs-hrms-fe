import StatCard from "./StatCard";
import { Box } from "@mui/material";
import usersIcon from "../../../assets/dashboardIcon/users-alt-2.svg";
import handsIcon from "../../../assets/dashboardIcon/holding-hands.svg";
import chartbargraphIcon from "../../../assets/dashboardIcon/chart-bar-graph.svg";
import chartlineIcon from "../../../assets/dashboardIcon/chart-line.svg";
const ApplicationStats = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <StatCard
        iconLeft={
          <img src={usersIcon} alt="user" style={{ width: 25, height: 25 }} />
        }
        iconRight={
          <img
            src={chartbargraphIcon}
            alt="chartbargraphIcon"
            style={{
              width: 25,
              height: 25,
              filter:
                "invert(48%) sepia(6%) saturate(0%) hue-rotate(170deg) brightness(93%) contrast(87%)",
            }}
          />
        }
        count={246}
        label="Interviews"
      />

      <StatCard
        iconLeft={
          <img src={handsIcon} alt="hand" style={{ width: 25, height: 25 }} />
        }
        iconRight={
          <img
            src={chartlineIcon}
            alt="chartlineIcon"
            style={{
              width: 25,
              height: 25,
              filter:
                "invert(48%) sepia(6%) saturate(0%) hue-rotate(170deg) brightness(93%) contrast(87%)",
            }}
          />
        }
        count={101}
        label="Hired"
      />
    </Box>
  );
};

export default ApplicationStats;
