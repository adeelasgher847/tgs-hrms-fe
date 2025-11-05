import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import {
  systemPerformanceApiService,
  type SystemPerformanceKpi,
} from '../../api/systemPerformanceApi';
import KpiCard from '../DashboardContent/KPICard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface KpiPerformanceOverviewProps {
  tenantId?: string;
}

const KpiPerformanceOverview: React.FC<KpiPerformanceOverviewProps> = ({
  tenantId,
}) => {
  const [data, setData] = useState<SystemPerformanceKpi[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const kpiData = await systemPerformanceApiService.getSystemKpis();

      const filteredData = tenantId
        ? kpiData.filter(item => item.tenantId === tenantId)
        : kpiData; 

      setData(filteredData);
    };

    fetchData();
  }, [tenantId]);

  const totalKpiCategories =
    data.reduce((acc, curr) => acc + curr.categories.length, 0) || 0;

  const avgKpiScore =
    data.reduce(
      (acc, curr) =>
        acc + curr.categories.reduce((cAcc, cat) => cAcc + cat.avgScore, 0),
      0
    ) / (totalKpiCategories || 1);

  const bestCategory = data
    .flatMap(d => d.categories)
    .sort((a, b) => b.avgScore - a.avgScore)[0]?.category;

  const lowestCategory = data
    .flatMap(d => d.categories)
    .sort((a, b) => a.avgScore - b.avgScore)[0]?.category;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} flexGrow={1}>
        <KpiCard
          title='Total KPI Categories'
          value={totalKpiCategories}
          icon={<AssessmentIcon />}
          contentFontSize='1.8rem'
        />
      </Grid>
      <Grid item xs={12} md={6} flexGrow={1}>
        <KpiCard
          title='Average Score'
          value={`${avgKpiScore.toFixed(1)}%`}
          icon={<TrendingUpIcon />}
          contentFontSize='1.8rem'
        />
      </Grid>
      <Grid item xs={12} md={6} flexGrow={1}>
        <KpiCard
          title='Top Category'
          value={bestCategory || '-'}
          icon={<TrendingUpIcon />}
          contentFontSize='1.8rem'
        />
      </Grid>
      <Grid item xs={12} md={6} flexGrow={1}>
        <KpiCard
          title='Lowest Category'
          value={lowestCategory || '-'}
          icon={<WarningAmberIcon />}
          contentFontSize='1.8rem'
        />
      </Grid>
    </Grid>
  );
};

export default KpiPerformanceOverview;
