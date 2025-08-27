import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';

import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { useLanguage } from '../../context/LanguageContext';
import { isAdmin, isManager } from '../../utils/auth';
import { teamApiService } from '../../api/teamApi';
import type { Team, TeamMember } from '../../api/teamApi';
import TeamList from './TeamList';
import MyTeams from './MyTeams';
import AvailableEmployees from './AvailableEmployees';
import CreateTeamForm from './CreateTeamForm';

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

const TeamManager: React.FC<TeamManagerProps> = ({ darkMode = false }) => {
  const [tabValue, setTabValue] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
    },
  };

  const lang = labels[language];

  // Load data based on user role
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isManager()) {
          // Load manager's teams and members
          const [teamsData, membersData] = await Promise.all([
            teamApiService.getMyTeams(),
            teamApiService.getMyTeamMembers(1),
          ]);
          setTeams(teamsData);
          setTeamMembers(membersData.items || []);
        } else if (isAdmin()) {
          // Load all teams for admin
          const teamsData = await teamApiService.getAllTeams(1);
          setTeams(teamsData.items || []);
        }
      } catch (err) {
        console.error('Error loading team data:', err);
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
      console.log('🔄 Team updated, refreshing TeamManager data...');
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);

          if (isManager()) {
            // Load manager's teams and members
            const [teamsData, membersData] = await Promise.all([
              teamApiService.getMyTeams(),
              teamApiService.getMyTeamMembers(1),
            ]);
            setTeams(teamsData);
            setTeamMembers(membersData.items || []);
          } else if (isAdmin()) {
            // Load all teams for admin
            const teamsData = await teamApiService.getAllTeams(1);
            setTeams(teamsData.items || []);
          }
        } catch (err) {
          console.error('Error refreshing team data:', err);
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
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  };

  const handleRefresh = () => {
    // Reload data
    window.location.reload();
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
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
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
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant='contained' onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' sx={{ color: darkMode ? '#fff' : '#000' }}>
          {lang.title}
        </Typography>
        {isAdmin() && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
            sx={{ backgroundColor: '#484c7f' }}
          >
            {lang.createTeam}
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Card sx={{ backgroundColor: darkMode ? '#2d2d2d' : '#fff' }}>
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
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                >
                  {teams.length}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  {lang.teamCount}
                </Typography>
              </Box>
              <BusinessIcon sx={{ fontSize: 40, color: '#484c7f' }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: darkMode ? '#2d2d2d' : '#fff' }}>
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
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                >
                  {teamMembers.length}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  {lang.memberCount}
                </Typography>
              </Box>
              <PersonIcon sx={{ fontSize: 40, color: '#484c7f' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label='team management tabs'
          sx={{
            '& .MuiTab-root': {
              color: darkMode ? '#ccc' : '#666',
              '&.Mui-selected': {
                color: '#484c7f',
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
          {isAdmin() && (
            <Tab
              label={lang.allTeams}
              icon={<BusinessIcon />}
              iconPosition='start'
            />
          )}
          <Tab
            label={lang.availableEmployees}
            icon={<PersonIcon />}
            iconPosition='start'
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {isManager() && (
        <TabPanel value={tabValue} index={0}>
          <MyTeams teams={teams} darkMode={darkMode} />
        </TabPanel>
      )}

      {isAdmin() && (
        <TabPanel value={tabValue} index={isManager() ? 1 : 0}>
          <TeamList teams={teams} darkMode={darkMode} />
        </TabPanel>
      )}

      <TabPanel value={tabValue} index={isManager() ? 1 : 0}>
        <AvailableEmployees darkMode={darkMode} />
      </TabPanel>

      {/* Create Team Form Modal */}
      {showCreateForm && (
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
