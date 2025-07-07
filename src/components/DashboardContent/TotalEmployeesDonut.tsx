import { Box, Typography, Stack } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type GenderDataItem = {
  name: string;
  value: number;
  color: string;
};

const data: GenderDataItem[] = [
  { name: "Man", value: 214, color: "#6366f1" }, 
  { name: "Woman", value: 135, color: "#ec4899" },
];

export default function TotalEmployeesDonut() {
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
        Total Employees
      </Typography>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* Gender labels */}
      <Stack direction="row" spacing={3} justifyContent="center" mt={2}>
        {data.map((item) => (
          <Stack
            key={item.name}
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: item.color,
              }}
            />
            <Typography fontSize={14}>
              {item.name}: <b>{item.value}</b>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
