import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  employeeKpiApiService,
  type EmployeeKPI,
  type TeamKPISummary,
} from '../../api/employeeKpiApi';
import employeeApiService, {
  type BackendEmployee,
} from '../../api/employeeApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Icons } from '../../assets/icons';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import AssignKPIModal from './AssignKPIModal';
import UpdateKPIProgressModal from './UpdateKPIProgressModal';
import TeamKPISummaryCard from '../KPIs/TeamKPISummaryCard';
import EmployeeKPIDetailsModal from './EmployeeKPIDetailsModal';

const TeamKPIs: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<TeamKPISummary[]>([]);
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [cycle, setCycle] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [selectedKPI, setSelectedKPI] = useState<EmployeeKPI | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<TeamKPISummary | null>(
    null
  );
  const [assignEmployeeId, setAssignEmployeeId] = useState<string | undefined>(
    undefined
  );

  const { showError } = useErrorHandler();

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (cycle !== 'All Time') {
        params.cycle = cycle;
      }
      const [data, allEmployees] = await Promise.all([
        employeeKpiApiService.getTeamKPISummary(params),
        employees.length > 0
          ? Promise.resolve(employees)
          : employeeApiService.getAllEmployeesWithoutPagination(),
      ]);

      if (employees.length === 0) {
        setEmployees(allEmployees);
      }

      // Group by employeeId to ensure 1 card per person even if backend returns multiple cycles
      const grouped = data.reduce(
        (acc: Record<string, TeamKPISummary>, item) => {
          const empId = item.employeeId;
          if (!acc[empId]) {
            acc[empId] = {
              ...item,
              cycle: cycle === 'All Time' ? 'All Time' : item.cycle,
            };
          } else {
            const existing = acc[empId];
            // Recalculate average: (avg1 * count1 + avg2 * count2) / (count1 + count2)
            const totalExistingPoints =
              existing.totalScore * existing.recordCount;
            const totalNewPoints = item.totalScore * item.recordCount;
            existing.recordCount += item.recordCount;
            existing.totalScore =
              existing.recordCount > 0
                ? (totalExistingPoints + totalNewPoints) / existing.recordCount
                : 0;
            existing.kpis = [...existing.kpis, ...item.kpis];
          }
          return acc;
        },
        {}
      );

      const aggregatedData = Object.values(grouped);

      const enrichedData = aggregatedData.map(item => {
        if (!item.employeeName || item.employeeName === item.employeeId) {
          const emp = allEmployees.find(e => e.id === item.employeeId);
          if (emp) {
            return {
              ...item,
              employeeName: emp.name,
              employeeEmail: emp.email,
            };
          }
        }
        return item;
      });

      setSummaries(enrichedData);

      // If details modal is open, refresh selected summary data to show updated scores
      // Utilizes functional state update to access latest 'selectedSummary' without adding it to deps
      setSelectedSummary(prev => {
        if (prev) {
          return data.find(s => s.employeeId === prev.employeeId) || prev;
        }
        return null;
      });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [cycle]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleUpdateClick = async (kpiId: string) => {
    try {
      if (!selectedSummary) return;
      // Fetch all KPIs for the employee and find the target one to avoid 404 on single get endpoint
      const params: any = { employeeId: selectedSummary.employeeId };
      if (selectedSummary.cycle !== 'All Time') {
        params.cycle = selectedSummary.cycle;
      }
      const kpis = await employeeKpiApiService.getEmployeeKPIs(params);
      // Match against either EmployeeKPI ID or the KPI Definition ID to be safe
      const kpi = kpis.find(k => k.id === kpiId || k.kpi_id === kpiId);

      if (kpi) {
        setSelectedKPI(kpi);
        // small delay to ensure selectedKPI state applied before opening dialog
        setTimeout(() => setUpdateModalOpen(true), 50);
      } else {
        throw new Error('KPI details not found');
      }
    } catch (error) {
      showError(error);
    }
  };

  const handleViewDetails = (summary: TeamKPISummary) => {
    setSelectedSummary(summary);
    setDetailsModalOpen(true);
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Box /> {/* Placeholder for title balance if needed */}
        <Box
          sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          <Box width={{ xs: '50%', md: 180 }}>
            <AppDropdown
              label='Review Cycle'
              showLabel={false}
              options={cycles.map(c => ({ value: c, label: c }))}
              value={cycle}
              onChange={e => setCycle(String(e.target.value))}
            />
          </Box>
          <AppButton
            variant='contained'
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
            text='Assign KPI'
            sx={{
              width: { xs: '100%', sm: 'auto' },
            }}
          />
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Search employee by name or email...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon
                    sx={{
                      color:
                        theme.palette.mode === 'dark'
                          ? 'text.secondary'
                          : 'inherit',
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {loading && summaries.length === 0 ? (
        <Box display='flex' justifyContent='center' p={4}>
          <CircularProgress />
        </Box>
      ) : filteredSummaries.length === 0 ? (
        <Typography
          variant='body1'
          color='textSecondary'
          align='center'
          py={4}
          bgcolor='action.hover'
          borderRadius={2}
        >
          No team members found matching your criteria.
        </Typography>
      ) : (
        <Box
          display='grid'
          gridTemplateColumns={{
            xs: '1fr',
            sm: '1fr 1fr',
          }}
          gap={3}
        >
          {filteredSummaries.map(summary => (
            <TeamKPISummaryCard
              key={summary.employeeId}
              summary={summary}
              onAssignKPI={() => {
                setAssignEmployeeId(summary.employeeId);
                setAssignModalOpen(true);
              }}
              onViewDetails={() => handleViewDetails(summary)}
            />
          ))}
        </Box>
      )}

      <AssignKPIModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignEmployeeId(undefined);
        }}
        onSuccess={fetchTeamData}
        preSelectedEmployeeId={assignEmployeeId}
      />

      <EmployeeKPIDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        summary={selectedSummary}
        onUpdateKPI={kpiId => {
          // The modal closing is now handled in EmployeeKPIDetailsModal's wrapper
          handleUpdateClick(kpiId);
        }} // Managers can edit KPIs assigned to their team
      />

      {selectedKPI && (
        <UpdateKPIProgressModal
          open={updateModalOpen}
          onClose={() => {
            setUpdateModalOpen(false);
            setSelectedKPI(null);
            // Optional: Re-open details? Maybe better to let user choose.
            // But if we want to show updated data, we might want to re-open details of the SAME employee.
            if (selectedSummary) {
              setDetailsModalOpen(true);
            }
          }}
          onSuccess={fetchTeamData}
          employeeKPI={selectedKPI}
        />
      )}
    </Box>
  );
};

export default TeamKPIs;
