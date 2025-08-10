import React, { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { type SelectChangeEvent } from "@mui/material/Select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample leave summary data by user/department
const mockData: Record<string, { name: string; value: number }[]> = {
  Ali: [
    { name: "Sick Leave", value: 4 },
    { name: "Casual Leave", value: 2 },
    { name: "Annual Leave", value: 3 },
  ],
  Sara: [
    { name: "Sick Leave", value: 1 },
    { name: "Casual Leave", value: 3 },
    { name: "Annual Leave", value: 5 },
  ],
  HR: [
    { name: "Sick Leave", value: 6 },
    { name: "Casual Leave", value: 4 },
    { name: "Annual Leave", value: 2 },
  ],
  IT: [
    { name: "Sick Leave", value: 3 },
    { name: "Casual Leave", value: 1 },
    { name: "Annual Leave", value: 6 },
  ],
};

// Pie colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

const LeaveSummaryChart: React.FC = () => {
  const [selected, setSelected] = useState("Ali");

  const handleChange = (event: SelectChangeEvent) => {
    setSelected(event.target.value);
  };

  const chartData = mockData[selected] || [];

  return (
    <Box mt={4}>
      {/* Dropdown Filter */}
      <Box width={{ xs: "100%", sm: "50%" }} mb={3}>
        <FormControl fullWidth size="small">
          <InputLabel id="select-label">User / Department</InputLabel>
          <Select
            labelId="select-label"
            value={selected}
            onChange={handleChange}
            displayEmpty
          >
            <MenuItem value="Ali">Ali</MenuItem>
            <MenuItem value="Sara">Sara</MenuItem>
            <MenuItem value="HR">HR Department</MenuItem>
            <MenuItem value="IT">IT Department</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Chart Title */}
      {selected && (
        <Typography variant="h6" gutterBottom>
          Leave Summary – {selected}
        </Typography>
      )}

      {/* Pie Chart */}
      {selected && (
        <Box
          height={300}
          sx={{
            "& svg, & path": {
              outline: "none",
              border: "none",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default LeaveSummaryChart;
