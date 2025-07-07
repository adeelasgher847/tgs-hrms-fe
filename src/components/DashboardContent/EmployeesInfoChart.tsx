import { Box, Typography } from "@mui/material";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

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
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Typography fontWeight="bold" mb={2}>
        Employees Info
      </Typography>

      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data}>
          <XAxis dataKey="date" interval={0} tick={{ fontSize: 12 }} />
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
  );
}
