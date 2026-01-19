import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';
import {
  employeeKpiApiService,
  type TeamKPISummary,
} from '../../api/employeeKpiApi';
import {
  performanceReviewApiService,
  type PerformanceReview,
} from '../../api/performanceReviewApi';
import employeeApiService from '../../api/employeeApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import { Icons } from '../../assets/icons';
import TeamKPISummaryCard from '../KPIs/TeamKPISummaryCard';
import ReviewPerformanceModal from './ReviewPerformanceModal';
import PerformanceReviewDetailsModal from './PerformanceReviewDetailsModal';
import PromotionsList from '../Promotions/PromotionsList';
import {
  isAdmin as checkIsAdmin,
  isHRAdmin as checkIsHRAdmin,
  isManager as checkIsManager,
} from '../../utils/auth';
import { teamApiService } from '../../api/teamApi';
import AppCard from '../common/AppCard';
import AppSearch from '../common/AppSearch';

const TeamPerformanceReviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<TeamKPISummary[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [cycle, setCycle] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { showError } = useErrorHandler();
  const isAdmin = checkIsAdmin();
  const isHRAdmin = checkIsHRAdmin();
  const isManager = checkIsManager();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (cycle !== 'All Time') {
        params.cycle = cycle;
      }

      // Determine employee source based on role
      let employeePromise;
      if (isAdmin || isHRAdmin) {
        employeePromise = employeeApiService.getAllEmployeesWithoutPagination();
      } else if (isManager) {
        employeePromise = teamApiService
          .getMyTeamMembers(1, 1000)
          .then((res: any) => res.items);
      } else {
        employeePromise = Promise.resolve([]);
      }

      // Determine KPI data source based on role
      let kpiPromise;
      if (isAdmin || isHRAdmin) {
        // For admin and hr-admin, get all employee KPIs
        kpiPromise = employeeKpiApiService.getEmployeeKPIs(params);
      } else if (isManager) {
        // For manager, get team KPI summary
        kpiPromise = employeeKpiApiService.getTeamKPISummary(params);
      } else {
        kpiPromise = Promise.resolve([]);
      }

      const [kpiData, reviewData, fetchedEmployees] = await Promise.all([
        kpiPromise,
        performanceReviewApiService.getPerformanceReviews(params),
        employeePromise,
      ]);

      setEmployees(fetchedEmployees);

      // 1. Process KPI data into summaries
      let processedSummaries: TeamKPISummary[] = [];

      if (isAdmin || isHRAdmin) {
        // For admin/hr-admin: Convert EmployeeKPI[] to TeamKPISummary[]
        const grouped = (kpiData as any[]).reduce(
          (acc: Record<string, any>, kpi) => {
            const empId = kpi.employee_id;
            if (!acc[empId]) {
              acc[empId] = {
                employeeId: empId,
                totalScore: kpi.score || 0,
                recordCount: 1,
                kpis: [kpi],
                cycle: cycle === 'All Time' ? 'All Time' : kpi.reviewCycle,
              };
            } else {
              const existing = acc[empId];
              const totalExistingPoints =
                existing.totalScore * existing.recordCount;
              const totalNewPoints = kpi.score || 0;
              existing.recordCount += 1;
              existing.totalScore =
                (totalExistingPoints + totalNewPoints) / existing.recordCount;
              existing.kpis.push(kpi);
            }
            return acc;
          },
          {}
        );
        processedSummaries = Object.values(grouped);
      } else {
        // For manager: Use summaries directly from API
        const grouped = kpiData.reduce((acc: Record<string, any>, item) => {
          const empId = item.employeeId;
          if (!acc[empId]) {
            acc[empId] = {
              ...item,
              cycle: cycle === 'All Time' ? 'All Time' : item.cycle,
            };
          } else {
            const existing = acc[empId];
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
        }, {});
        processedSummaries = Object.values(grouped);
      }

      // Enrich summaries with names if missing
      const enrichedSummaries = processedSummaries.map(item => {
        if (!item.employeeName || item.employeeName === item.employeeId) {
          const emp = fetchedEmployees.find(
            (e: any) =>
              e.id === item.employeeId || e.user_id === item.employeeId
          );
          if (emp) {
            return {
              ...item,
              employeeName:
                emp.name ||
                `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
              employeeEmail: emp.email || emp.user?.email || '',
            };
          }
        }
        return item;
      });
      setSummaries(enrichedSummaries);

      // 2. Enrich and Process Reviews (for Review History tab)
      const enrichedReviews = (reviewData.items || []).map(
        (review: PerformanceReview) => {
          const searchId = review.employee_id.trim();
          const emp = fetchedEmployees.find(
            (e: any) =>
              e.id?.trim() === searchId ||
              e.user_id?.trim() === searchId ||
              e.user?.id?.trim() === searchId
          );

          if (emp) {
            const firstName =
              emp.firstName ||
              emp.user?.first_name ||
              emp.name?.split(' ')[0] ||
              '';
            const lastName =
              emp.lastName ||
              emp.user?.last_name ||
              emp.name?.split(' ').slice(1).join(' ') ||
              '';
            const fullName = emp.name || `${firstName} ${lastName}`.trim();

            return {
              ...review,
              employeeName: fullName,
              employee: {
                ...review.employee,
                id: emp.id,
                user_id: emp.user_id || emp.user?.id || '',
                status: emp.status || 'active',
                created_at: emp.createdAt || new Date().toISOString(),
                user: {
                  id: emp.user_id || emp.user?.id || '',
                  email: emp.email || emp.user?.email || '',
                  first_name: firstName,
                  last_name: lastName,
                },
              },
            } as PerformanceReview;
          }
          return review;
        }
      );

      setReviews(enrichedReviews);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [cycle, showError, isAdmin, isHRAdmin, isManager]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSummaries = summaries.filter(
    s =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Aggregate History by Employee for "1 card per employee" view
  const historyGroups = reviews.reduce((acc: Record<string, any>, review) => {
    const empId = review.employee_id.trim();
    if (!acc[empId]) {
      acc[empId] = {
        employeeId: empId,
        employeeName:
          (review as any).employeeName ||
          (review.employee?.user
            ? `${review.employee.user.first_name} ${review.employee.user.last_name}`
            : 'Unknown'),
        employeeEmail: review.employee?.user?.email || '',
        totalScore: 0,
        recordCount: 0,
        displayCycle: cycle === 'All Time' ? 'All Time' : review.cycle,
        reviews: [],
        status: review.status,
      };
    }
    const group = acc[empId];
    group.totalScore =
      (group.totalScore * group.recordCount + review.overallScore) /
      (group.recordCount + 1);
    group.recordCount += 1;
    group.reviews.push(review);
    group.status = review.status;
    return acc;
  }, {});

  const allHistorySummaries = Object.values(historyGroups);

  // Separate pending and completed reviews
  const pendingReviews = allHistorySummaries.filter(
    (s: any) => s.status === 'under_review'
  );
  const completedReviews = allHistorySummaries.filter(
    (s: any) => s.status === 'completed'
  );

  const filteredPendingReviews = pendingReviews.filter(
    (s: any) =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedReviews = completedReviews.filter(
    (s: any) =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistorySummaries = allHistorySummaries.filter(
    (s: any) =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReviewClick = (empId: string, empName: string) => {
    setSelectedEmployee({ id: empId, name: empName });
    setReviewModalOpen(true);
  };

  const handleViewDetails = (review: PerformanceReview) => {
    setSelectedReviewId(review.id);
    setDetailsModalOpen(true);
  };

  const cycles = ['All Time', 'Q4-2025', 'Q3-2025', 'Q2-2025', 'Q1-2025'];

  return (
    <Box>
      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          {isManager && <Tab label='Pending Reviews (By Team)' />}
          {(isAdmin || isHRAdmin) && <Tab label='Pending Approvals' />}
          {(isAdmin || isHRAdmin) && <Tab label='Completed Reviews' />}
          {isManager && <Tab label='Review History' />}
          {(isManager || isAdmin || isHRAdmin) && <Tab label='Promotions' />}
        </Tabs>
      </Box>

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
              label='Cycle'
              showLabel={false}
              options={cycles.map(c => ({ value: c, label: c }))}
              value={cycle}
              onChange={e => setCycle(String(e.target.value))}
            />
          </Box>
        </Box>
      </AppCard>

      {loading ? (
        <Box display='flex' justifyContent='center' p={10}>
          <CircularProgress />
        </Box>
      ) : isManager && activeTab === 0 ? (
        // Manager: Team List View - Create Reviews
        <Box
          display='grid'
          gridTemplateColumns={{
            xs: '1fr',
            sm: '1fr 1fr',
          }}
          gap={3}
        >
          {filteredSummaries.length === 0 ? (
            <Box gridColumn='1 / -1'>
              <Typography
                align='center'
                color='text.secondary'
                py={10}
                bgcolor='action.hover'
                borderRadius={4}
              >
                No team members found for this cycle.
              </Typography>
            </Box>
          ) : (
            filteredSummaries.map(summary => (
              <TeamKPISummaryCard
                key={summary.employeeId}
                summary={summary}
                hideAssignKpi
                viewLabel='Review'
                viewIcon={Icons.edit}
                onViewDetails={() =>
                  handleReviewClick(summary.employeeId, summary.employeeName)
                }
              />
            ))
          )}
        </Box>
      ) : (isAdmin || isHRAdmin) && activeTab === 0 ? (
        // Admin/HR-Admin: Pending Approvals Tab
        <Box
          display='grid'
          gridTemplateColumns={{
            xs: '1fr',
            sm: '1fr 1fr',
          }}
          gap={3}
        >
          {filteredPendingReviews.length === 0 ? (
            <Box gridColumn='1 / -1'>
              <Typography
                align='center'
                color='text.secondary'
                py={10}
                bgcolor='action.hover'
                borderRadius={4}
              >
                No pending reviews to approve.
              </Typography>
            </Box>
          ) : (
            filteredPendingReviews.map((summary: any) => (
              <TeamKPISummaryCard
                key={summary.employeeId}
                summary={
                  {
                    ...summary,
                    cycle: summary.displayCycle,
                    kpis: [], // Synthetic
                  } as any
                }
                hideAssignKpi
                viewLabel='Approve'
                viewIcon={Icons.check}
                onViewDetails={() => {
                  if (summary.reviews.length > 0) {
                    handleViewDetails(summary.reviews[0]);
                  }
                }}
              />
            ))
          )}
        </Box>
      ) : (isAdmin || isHRAdmin) && activeTab === 1 ? (
        // Admin/HR-Admin: Completed Reviews Tab
        <Box
          display='grid'
          gridTemplateColumns={{
            xs: '1fr',
            sm: '1fr 1fr',
          }}
          gap={3}
        >
          {filteredCompletedReviews.length === 0 ? (
            <Box gridColumn='1 / -1'>
              <Typography
                align='center'
                color='text.secondary'
                py={10}
                bgcolor='action.hover'
                borderRadius={4}
              >
                No completed reviews.
              </Typography>
            </Box>
          ) : (
            filteredCompletedReviews.map((summary: any) => (
              <TeamKPISummaryCard
                key={summary.employeeId}
                summary={
                  {
                    ...summary,
                    cycle: summary.displayCycle,
                    kpis: [], // Synthetic
                  } as any
                }
                hideAssignKpi
                viewLabel='View'
                viewIcon={Icons.plans}
                onViewDetails={() => {
                  if (summary.reviews.length > 0) {
                    handleViewDetails(summary.reviews[0]);
                  }
                }}
              />
            ))
          )}
        </Box>
      ) : isManager && activeTab === 3 ? (
        // Manager: Review History Tab
        <Box
          display='grid'
          gridTemplateColumns={{
            xs: '1fr',
            sm: '1fr 1fr',
          }}
          gap={3}
        >
          {filteredHistorySummaries.length === 0 ? (
            <Box gridColumn='1 / -1'>
              <Typography
                align='center'
                color='text.secondary'
                py={10}
                bgcolor='action.hover'
                borderRadius={4}
              >
                No performance reviews found.
              </Typography>
            </Box>
          ) : activeTab === 4 && (isManager || isAdmin || isHRAdmin) ? (
            // Promotions tab
            <PromotionsList />
          ) : (
            filteredHistorySummaries.map((summary: any) => (
              <TeamKPISummaryCard
                key={summary.employeeId}
                summary={
                  {
                    ...summary,
                    cycle: summary.displayCycle,
                    kpis: [], // Synthetic
                  } as any
                }
                hideAssignKpi
                viewLabel='History'
                viewIcon={Icons.plans}
                onViewDetails={() => {
                  if (summary.reviews.length > 0) {
                    handleViewDetails(summary.reviews[0]);
                  }
                }}
              />
            ))
          )}
        </Box>
      ) : null}

      {isManager && selectedEmployee && (
        <ReviewPerformanceModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={fetchData}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}

      <PerformanceReviewDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        reviewId={selectedReviewId}
        onApproveSuccess={fetchData}
      />
    </Box>
  );
};

export default TeamPerformanceReviews;
