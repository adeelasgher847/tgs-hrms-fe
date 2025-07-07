import { Box, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { date: "01 Jan", value: 30 },
  { date: "01 Feb", value: 50 },
  { date: "22 Feb", value: 70 },
  { date: "15 Mar", value: 55 },
  { date: "06 Apr", value: 85 },
  { date: "27 Apr", value: 65 },
  { date: "18 May", value: 70 },
  { date: "08 Jun", value: 50 },
  { date: "29 Jun", value: 60 },
  { date: "21 Jul", value: 65 },
];

export default function EmployeesInfoChart() {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #f0f0f0",
        borderRadius: "0.375rem",
        backgroundColor: "#fff",
      }}
    >
      <Typography fontWeight="bold" mb={2}>
        Employees Info
      </Typography>

      <Box
        sx={{
          "& svg": {
            outline: "none",
            border: "none",
          },
        }}
      >
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data}>
            {/* X-axis grid line only */}
            <CartesianGrid
              horizontal={false}
              vertical={false}
            />

            {/* 👇 XAxis: show month text, gray bottom line */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#f0f0f0" }}
             tickLine={{ stroke: "#f0f0f0" }}
            />

            {/* 👇 YAxis: line visible, but no text */}
            <YAxis
              stroke="#f0f0f0"
              axisLine={{ stroke: "#f0f0f0" }}
              tickLine={false}
              tick={false} // hide text
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#f5558d"
              strokeWidth={3}
              dot={{ r: 3, fill: "#ffc107" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
