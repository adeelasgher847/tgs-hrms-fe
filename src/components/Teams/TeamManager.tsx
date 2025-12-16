import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Skeleton,
  Alert,
} from '@mui/material';

import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { useLanguage } from '../../hooks/useLanguage';
import { isAdmin, isManager, isHRAdmin, isSystemAdmin } from '../../utils/auth';
import { teamApiService } from '../../api/teamApi';
import AppButton from '../common/AppButton';
import { COLORS } from '../../constants/appConstants';
import type {
  Team,
  TeamMember,
  AllTenantsTeamsResponse,
} from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';
import TeamList from './TeamList';
import MyTeams from './MyTeams';
import SystemAdminTenantTeams from './SystemAdminTenantTeams';

import CreateTeamForm from './CreateTeamForm';
import { useOutletContext } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface TeamManagerProps {
  darkMode?: boolean;
}

interface OutletContext {
  darkMode: boolean;
}

const TeamManager: React.FC<TeamManagerProps> = ({
  darkMode: darkModeProp = false,
}) => {
  const { darkMode: outletDarkMode } = useOutletContext<OutletContext>();
  const darkMode = outletDarkMode ?? darkModeProp;

  const [tabValue, setTabValue] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tenantsWithTeams, setTenantsWithTeams] =
    useState<AllTenantsTeamsResponse>({ tenants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Team Management',
      myTeams: 'My Teams',
      allTeams: 'All Teams',
      availableEmployees: 'Available Employees',
      createTeam: 'Create Team',
      noTeams: 'No teams found',
      teamCount: 'Teams',
      memberCount: 'Members',
      loading: 'Loading teams...',
      teamCreated: 'Team created successfully!',
    },
    ar: {
      title: 'إدارة الفرق',
      myTeams: 'فرقي',
      allTeams: 'جميع الفرق',
      availableEmployees: 'الموظفون المتاحون',
      createTeam: 'إنشاء فريق',
      noTeams: 'لم يتم العثور على فرق',
      teamCount: 'الفرق',
      memberCount: 'الأعضاء',
      loading: 'جاري تحميل الفرق...',
      teamCreated: 'تم إنشاء الفريق بنجاح!',
    },
  };

  const lang = labels[language];

  // Load data based on user role
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isSystemAdmin()) {
          // Load all tenants with teams for system admin
          const tenantsData = await teamApiService.getAllTenantsWithTeams();
          setTenantsWithTeams(tenantsData);
        } else if (isManager()) {
          // Load manager's teams and members
          const [teamsData, membersData] = await Promise.all([
            teamApiService.getMyTeams(),
            teamApiService.getMyTeamMembers(1),
          ]);
          setTeams(teamsData);
          setTeamMembers(membersData.items || []);
        } else if (isAdmin()) {
          // Load all teams for admin with members included
          const teamsData = await teamApiService.getAllTeams(1);
          setTeams(teamsData.items || []);
        } else if (isHRAdmin()) {
          // Load all teams for HR admin without members
          const teamsData = await teamApiService.getAllTeams(1);
          setTeams(teamsData.items || []);
        }
      } catch {
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen for team updates to refresh data
  useEffect(() => {
    const handleTeamUpdate = () => {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);

          if (isSystemAdmin()) {
            // Load all tenants with teams for system admin
            const tenantsData = await teamApiService.getAllTenantsWithTeams();
            setTenantsWithTeams(tenantsData);
          } else if (isManager()) {
            // Load manager's teams and members
            const [teamsData, membersData] = await Promise.all([
              teamApiService.getMyTeams(),
              teamApiService.getMyTeamMembers(1),
            ]);
            setTeams(teamsData);
            setTeamMembers(membersData.items || []);
          } else if (isAdmin()) {
            // Load all teams for admin with members included
            const teamsData = await teamApiService.getAllTeams(1);
            setTeams(teamsData.items || []);
          } else if (isHRAdmin()) {
            // Load all teams of the current tenant (view-only)
            const teamsData = await teamApiService.getAllTeams(1);
            setTeams(teamsData.items || []);
          }
        } catch {
          setError('Failed to refresh team data');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    };

    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => window.removeEventListener('teamUpdated', handleTeamUpdate);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTeam = async (teamData: {
    name: string;
    description?: string;
    manager_id: string;
  }) => {
    try {
      const newTeam = await teamApiService.createTeam(teamData);
      setTeams(prev => [newTeam, ...prev]);
      setShowCreateForm(false);

      // Show success toast
      snackbar.success(lang.teamCreated);

      // Trigger refresh for other components
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch {
      throw error;
    }
  };

  const handleTeamUpdated = async () => {
    // Refresh data when team is updated without page reload
    try {
      setLoading(true);
      setError(null);

      if (isSystemAdmin()) {
        // Load all tenants with teams for system admin
        const tenantsData = await teamApiService.getAllTenantsWithTeams();
        setTenantsWithTeams(tenantsData);
      } else if (isManager()) {
        // Load manager's teams and members
        const [teamsData, membersData] = await Promise.all([
          teamApiService.getMyTeams(),
          teamApiService.getMyTeamMembers(1),
        ]);
        setTeams(teamsData);
        setTeamMembers(membersData.items || []);
      } else if (isAdmin()) {
        // Load all teams for admin with members included
        const teamsData = await teamApiService.getAllTeams(1);
        setTeams(teamsData.items || []);
      }
    } catch {
      setError('Failed to refresh team data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Refresh data without page reload
    await handleTeamUpdated();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h4' gutterBottom>
          {lang.title}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {[...Array(6)].map((_, _index) => (
            <Card key={_index}>
              <CardContent>
                <Skeleton variant='text' width='60%' height={32} />
                <Skeleton variant='text' width='40%' />
                <Skeleton variant='rectangular' height={100} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <AppButton variant='contained' text='Retry' onClick={handleRefresh} />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant='h4'
          sx={{
            color: theme => theme.palette.text.primary,
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
            textAlign: { xs: 'left', sm: 'left' },
          }}
        >
          {lang.title}
        </Typography>
        {isAdmin() && !isHRAdmin() && !isSystemAdmin() && (
          <AppButton
            variant='contained'
            text={lang.createTeam}
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
            sx={{
              backgroundColor: COLORS.PRIMARY,
              minWidth: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 },
            }}
          />
        )}
      </Box>

      {/* Stats Cards - Hide for system admin */}
      {!isSystemAdmin() && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: isAdmin() ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)', // Only 1 card for admin, 2 for manager
            },
            gap: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <Card
            sx={{ backgroundColor: theme => theme.palette.background.paper }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant='h4'
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    }}
                  >
                    {teams.length}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme => theme.palette.text.secondary,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {lang.teamCount}
                  </Typography>
                </Box>
                <BusinessIcon
                  sx={{
                    fontSize: { xs: 32, sm: 40 },
                    color: theme => theme.palette.primary.main,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Only show Members Count Card for Managers */}
          {isManager() && (
            <Card
              sx={{ backgroundColor: theme => theme.palette.background.paper }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant='h4'
                      sx={{
                        color: theme => theme.palette.text.primary,
                        fontSize: { xs: '1.75rem', sm: '2.125rem' },
                      }}
                    >
                      {teamMembers.length}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme => theme.palette.text.secondary,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {lang.memberCount}
                    </Typography>
                  </Box>
                  <PersonIcon
                    sx={{
                      fontSize: { xs: 32, sm: 40 },
                      color: theme => theme.palette.primary.main,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* System Admin View - Show tenants with teams */}
      {isSystemAdmin() && (
        <SystemAdminTenantTeams data={tenantsWithTeams} darkMode={darkMode} />
      )}

      {/* Tabs - Hide for system admin */}
      {!isSystemAdmin() && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label='team management tabs'
              variant='standard'
              sx={{
                '& .MuiTabs-flexContainer': {
                  justifyContent: 'flex-start', // Always align to start on all screen sizes
                },
                '& .MuiTab-root': {
                  color: theme => theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  minHeight: { xs: 48, sm: 56 },
                  minWidth: 'auto',
                  '&.Mui-selected': {
                    color: theme => theme.palette.primary.main,
                  },
                },
              }}
            >
              {isManager() && (
                <Tab
                  label={lang.myTeams}
                  icon={<GroupIcon />}
                  iconPosition='start'
                />
              )}
              {(isAdmin() || isHRAdmin()) && (
                <Tab
                  label={lang.allTeams}
                  icon={<BusinessIcon />}
                  iconPosition='start'
                />
              )}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          {isManager() && (
            <TabPanel value={tabValue} index={0}>
              <MyTeams teams={teams} darkMode={darkMode} />
            </TabPanel>
          )}

          {(isAdmin() || isHRAdmin()) && (
            <TabPanel value={tabValue} index={isManager() ? 1 : 0}>
              <TeamList
                teams={teams}
                darkMode={darkMode}
                onTeamUpdated={handleTeamUpdated}
              />
            </TabPanel>
          )}
        </>
      )}

      {/* Create Team Form Modal - Hide for system admin */}
      {showCreateForm && !isSystemAdmin() && (
        <CreateTeamForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateTeam}
          darkMode={darkMode}
        />
      )}
    </Box>
  );
};

export default TeamManager;
