import { Box, Typography } from "@mui/material";
import React from "react";
import Chart from "react-apexcharts";

const PerformanceChart: React.FC = () => {
  const series = [
    {
      name: "Ui/Ux Designer",
      data: [40, 50, 60, 70, 60, 80, 90, 85, 70, 60, 50, 40],
    },
    {
      name: "App Development",
      data: [30, 40, 50, 60, 70, 60, 50, 60, 70, 80, 90, 100],
    },
    {
      name: "Quality Assurance",
      data: [20, 30, 40, 50, 40, 60, 70, 75, 80, 70, 60, 50],
    },
    {
      name: "Web Developer",
      data: [20, 30, 40, 50, 40, 60, 70, 75, 80, 70, 60, 50],
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%", // Reduce bar thickness
        borderRadius: 4,
      },
    },
    grid: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 1,
      colors: ["#fff"],
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
    },
    yaxis: {
      min: 0,
      max: 200,
      tickAmount: 5,
      labels: {
        formatter: (val) => `${val}`,
        style: {
          fontSize: "12px",
          colors: "#555",
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      markers: {
        width: 12,
        height: 12,
        radius: 2,
      },
    },
    colors: ["#484c7f", "#f19828", "#f5558d", "#a7daff"],
    fill: {
      opacity: 1,
    },
  };

  return (
    <Box className="apex-chart-container" sx={{boxShadow:1 , borderRadius:1, mt:4,p:2 ,mb:4 ,backgroundColor:"#fff", borderColor:"#f0f0f0"}}>
        
         <Typography fontWeight="bold" fontSize={18} mb={2}>
        Top Hiring Sources
      </Typography>
      <Chart options={options} series={series} type="bar" height={300}  />
    </Box>
  );
};

export default PerformanceChart;
