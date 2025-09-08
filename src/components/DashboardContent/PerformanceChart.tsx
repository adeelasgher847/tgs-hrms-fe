import { Box, Typography } from '@mui/material';
import React from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

const PerformanceChart: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  // Translations
  const labels = {
    en: 'Top Hiring Sources',
    ar: 'أفضل مصادر التوظيف',
  };

  const seriesLabels = {
    'UI/UX Designer': { en: 'UI/UX Designer', ar: 'مصمم UI/UX' },
    'App Development': { en: 'App Development', ar: 'تطوير التطبيقات' },
    'Quality Assurance': { en: 'Quality Assurance', ar: 'ضمان الجودة' },
    'Web Developer': { en: 'Web Developer', ar: 'مطور ويب' },
  };

  const months = {
    en: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    ar: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
  };

  const rawSeries = [
    {
      name: 'UI/UX Designer',
      data: [45, 25, 44, 23, 25, 41, 32, 25, 22, 65, 22, 29],
    },
    {
      name: 'App Development',
      data: [45, 12, 25, 22, 19, 22, 29, 23, 23, 25, 41, 32],
    },
    {
      name: 'Quality Assurance',
      data: [45, 25, 32, 25, 22, 65, 44, 23, 25, 41, 22, 29],
    },
    {
      name: 'Web Developer',
      data: [32, 25, 22, 11, 22, 29, 16, 25, 9, 23, 25, 13],
    },
  ];

  const translatedSeries = rawSeries.map(item => ({
    name:
      seriesLabels[item.name as keyof typeof seriesLabels]?.[language] ||
      item.name,
    data: item.data,
  }));

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
      },
    },
    grid: {
      borderColor: darkMode ? '#333' : '#e0e0e0',
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
      colors: ['#fff'],
    },
    xaxis: {
      categories: months[language],
      labels: {
        style: {
          fontSize: '12px',
          colors: textColor,
        },
      },
    },
    yaxis: {
      min: 0,
      max: 200,
      tickAmount: 5,
      labels: {
        formatter: val => `${val}`,
        style: {
          fontSize: '12px',
          colors: textColor,
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: language === 'ar' ? 'left' : 'right',
      fontSize: '12px',
      markers: {
        size: 12,
      },
      labels: {
        colors: textColor,
      },
    },
    colors: ['#484c7f', '#f19828', '#f5558d', '#a7daff'],
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
    },
  };

  return (
    <Box
      className='apex-chart-container'
      sx={{
        mt: 1,
        p: 2,
        mb: 1,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Typography fontWeight='bold' fontSize={16} mb={2} color={textColor}>
        {labels[language]}
      </Typography>
      <Chart
        options={options}
        series={translatedSeries}
        type='bar'
        height={350}
      />
    </Box>
  );
};

export default PerformanceChart;
