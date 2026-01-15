import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Grid,
} from '@mui/material';
import {
  employeeKpiApiService,
  type TeamKPISummary,
  type EmployeeKPI,
} from '../../api/employeeKpiApi';
import employeeApiService, {
  type BackendEmployee,
} from '../../api/employeeApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import AppSearch from '../common/AppSearch';
import AppCard from '../common/AppCard';
import TeamKPISummaryCard from './TeamKPISummaryCard';
import EmployeeKPIDetailsModal from '../EmployeeKPIs/EmployeeKPIDetailsModal';
import UpdateKPIProgressModal from '../EmployeeKPIs/UpdateKPIProgressModal';
import AssignKPIModal from '../EmployeeKPIs/AssignKPIModal';
import AppButton from '../common/AppButton';
import { Icons } from '../../assets/icons';

const AllEmployeeKPIs: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<TeamKPISummary[]>([]);
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [filterCycle, setFilterCycle] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [selectedSummary, setSelectedSummary] = useState<TeamKPISummary | null>(
    null
  );
  const [assignEmployeeId, setAssignEmployeeId] = useState<string | undefined>(
    undefined
  );
  const [selectedKPI, setSelectedKPI] = useState<EmployeeKPI | null>(null);

  const { showError } = useErrorHandler();

  const fetchAllSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCycle !== 'All Time') {
        params.cycle = filterCycle;
      }

      const [kpiData, allEmployees] = await Promise.all([
        employeeKpiApiService.getEmployeeKPIs(params),
        employees.length > 0
          ? Promise.resolve(employees)
          : employeeApiService.getAllEmployeesWithoutPagination(),
      ]);

      if (employees.length === 0) {
        setEmployees(allEmployees);
      }

      // Aggregation logic: Group KPIs by employee_id and calculate lifetime performance
      const grouped = kpiData.reduce(
        (acc: Record<string, TeamKPISummary>, item) => {
          const empId = item.employee_id;

          if (!acc[empId]) {
            const emp = allEmployees.find(
              e => e.id === empId || e.user_id === empId
            );
            acc[empId] = {
              employeeId: empId,
              employeeName: item.employee?.user?.first_name
                ? `${item.employee.user.first_name} ${item.employee.user.last_name}`
                : emp
                  ? emp.name
                  : 'Unknown',
              employeeEmail:
                item.employee?.user?.email || (emp ? emp.email : ''),
              cycle: filterCycle === 'All Time' ? 'All Time' : item.reviewCycle,
              totalScore: 0,
              recordCount: 0,
              kpis: [],
            };
          }

          const summary = acc[empId];
          const newTotalWeight = summary.recordCount + 1;
          summary.totalScore =
            (summary.totalScore * summary.recordCount + (item.score || 0)) /
            newTotalWeight;
          summary.recordCount = newTotalWeight;

          summary.kpis.push({
            kpiId: item.kpi_id,
            kpiTitle: item.kpi?.title || 'Unknown',
            targetValue: item.targetValue,
            achievedValue: item.achievedValue,
            score: item.score,
            weight: item.kpi?.weight || 0,
            weightedScore: ((item.score || 0) * (item.kpi?.weight || 0)) / 100,
          });

          return acc;
        },
        {}
      );

      setSummaries(Object.values(grouped));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [filterCycle, employees.length, showError]);

  useEffect(() => {
    fetchAllSummaries();
  }, [fetchAllSummaries]);

  const handleViewDetails = (summary: TeamKPISummary) => {
    setSelectedSummary(summary);
    setDetailsModalOpen(true);
  };

  const handleUpdateClick = async (kpiId: string) => {
    try {
      if (!selectedSummary) {
        showError('No employee selected');
        return;
      }

      // Fetch the full employee KPI details
      const params: any = { employeeId: selectedSummary.employeeId };
      if (selectedSummary.cycle !== 'All Time') {
        params.cycle = selectedSummary.cycle;
      }

      const fullKPIs = await employeeKpiApiService.getEmployeeKPIs(params);
      const selectedEmployeeKPI = fullKPIs.find(k => k.id === kpiId);

      if (selectedEmployeeKPI) {
        setSelectedKPI(selectedEmployeeKPI);
        setDetailsModalOpen(false);
        setUpdateModalOpen(true);
      } else {
        showError('KPI not found');
      }
    } catch (error) {
      showError(error);
    }
  };

  const filteredSummaries = summaries.filter(
    s =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cycles = [
    'All Time',
    'Q1-2025',
    'Q2-2025',
    'Q3-2025',
    'Q4-2025',
    'Q1-2026',
    'Q2-2026',
  ];

  return (
    <Box>
      <AppCard sx={{ mb: 3, p: 2 }}>
        <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
          <Box flexGrow={1} minWidth={{ xs: '100%', sm: 300 }}>
            <AppSearch
              placeholder='Search by employee name or email...'
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </Box>
          <Box width={{ xs: '100%', sm: 200 }}>
            <AppDropdown
              label='Review Cycle'
              showLabel={false}
              options={cycles.map(c => ({ value: c, label: c }))}
              value={filterCycle}
              onChange={e => setFilterCycle(String(e.target.value))}
            />
          </Box>
          <AppButton
            text='Assign KPI'
            variantType='primary'
            startIcon={
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  bgcolor: 'currentColor',
                  maskImage: `url(${Icons.add})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                }}
              />
            }
            onClick={() => {
              setAssignEmployeeId(undefined);
              setAssignModalOpen(true);
            }}
          />
        </Box>
      </AppCard>

      {loading ? (
        <Box display='flex' justifyContent='center' p={10}>
          <CircularProgress size={50} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredSummaries.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant='body1'
                color='textSecondary'
                align='center'
                py={10}
                bgcolor='action.hover'
                borderRadius={4}
              >
                No employee performance data found for this cycle.
              </Typography>
            </Grid>
          ) : (
            filteredSummaries.map(summary => (
              <Grid size={{ xs: 12, md: 6 }} key={summary.employeeId}>
                <TeamKPISummaryCard
                  summary={summary}
                  onAssignKPI={() => {
                    setAssignEmployeeId(summary.employeeId);
                    setAssignModalOpen(true);
                  }}
                  onViewDetails={() => handleViewDetails(summary)}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      <EmployeeKPIDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        summary={selectedSummary}
        onUpdateKPI={undefined} // Admins/HR-admins view only - no edit permissions
      />

      {selectedKPI && (
        <UpdateKPIProgressModal
          open={updateModalOpen}
          onClose={() => {
            setUpdateModalOpen(false);
            setSelectedKPI(null);
            // Optionally reopen details modal
            if (selectedSummary) {
              setDetailsModalOpen(true);
            }
          }}
          onSuccess={() => {
            fetchAllSummaries();
            setUpdateModalOpen(false);
            setSelectedKPI(null);
          }}
          employeeKPI={selectedKPI}
        />
      )}

      <AssignKPIModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignEmployeeId(undefined);
        }}
        onSuccess={fetchAllSummaries}
        preSelectedEmployeeId={assignEmployeeId}
      />
    </Box>
  );
};

export default AllEmployeeKPIs;
