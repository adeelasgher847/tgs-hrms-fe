import { Box, Typography, Stack } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type GenderDataItem = {
  name: string;
  value: number;
  color: string;
};

const data: GenderDataItem[] = [
  { name: "Man", value: 50, color: "#a7daff" },
  { name: "Woman", value: 55, color: "#f5558d" },
];

//Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload.color;

    return (
      <Box
        sx={{
          backgroundColor: color,
          color: "#fff",
          p: "8px 12px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        {item.name}: <b>{item.value}</b>
      </Box>
    );
  }

  return null;
};

export default function TotalEmployeesDonut() {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #f0f0f0",
        borderRadius: "0.375rem",
        backgroundColor: "#fff",
      }}
    >
      <Box display={"flex"} justifyContent={"space-between"}>
        <Typography fontWeight="bold" mb={2}>
          Total Employees
        </Typography>
        <Typography fontWeight="bold" fontSize={"25px"}>
          423
        </Typography>
      </Box>

      <Box
        tabIndex={-1}
        sx={{
          "& svg, & path": {
            outline: "none",
            border: "none",
          },
          "& svg:focus, & path:focus": {
            outline: "none",
          },
          "& svg:active, & path:active": {
            outline: "none",
          },
        }}
      >
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
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

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
