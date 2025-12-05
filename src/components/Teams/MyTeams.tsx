import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';

import {
  Group as GroupIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import type { Team, TeamMember } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';
import TeamMemberList from './TeamMemberList';

interface MyTeamsProps {
  teams: Team[];
  darkMode?: boolean;
}

const MyTeams: React.FC<MyTeamsProps> = ({ teams, darkMode = false }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [availableEmployees, setAvailableEmployees] = useState<TeamMember[]>(
    []
  );
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { language } = useLanguage();

  const labels = {
    en: {
      noTeams: 'You are not managing any teams yet.',
      teamMembers: 'Team Members',
      addMember: 'Add Member',
      removeMember: 'Remove Member',
      manager: 'Manager',
      members: 'Members',
      viewMembers: 'View Members',
      addMemberToTeam: 'Add Member to Team',
      selectEmployee: 'Select Employee',
      cancel: 'Cancel',
      add: 'Add',
      remove: 'Remove',
      confirmRemove: 'Are you sure you want to remove this member?',
      memberAdded: 'Member added successfully',
      memberRemoved: 'Member removed successfully',
      error: 'An error occurred',
    },
    ar: {
      noTeams: 'أنت لا تدير أي فرق بعد.',
      teamMembers: 'أعضاء الفريق',
      addMember: 'إضافة عضو',
      removeMember: 'إزالة عضو',
      manager: 'مدير',
      members: 'الأعضاء',
      viewMembers: 'عرض الأعضاء',
      addMemberToTeam: 'إضافة عضو للفريق',
      selectEmployee: 'اختر الموظف',
      cancel: 'إلغاء',
      add: 'إضافة',
      remove: 'إزالة',
      confirmRemove: 'هل أنت متأكد من إزالة هذا العضو؟',
      memberAdded: 'تم إضافة العضو بنجاح',
      memberRemoved: 'تم إزالة العضو بنجاح',
      error: 'حدث خطأ',
    },
  };

  const lang = labels[language];

  // Generate for avatar

  // Generate avatar color
  const generateAvatarColor = (name: string): string => {
    const colors = [
      '#1976d2',
      '#388e3c',
      '#f57c00',
      '#d32f2f',
      '#7b1fa2',
      '#303f9f',
      '#ff6f00',
      '#388e3c',
      '#c2185b',
      '#0097a7',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setShowMemberDialog(true);
  };

  // Load available employees when dialog opens

  useEffect(() => {
    const loadAvailableEmployees = async () => {
      if (showAddMemberDialog) {
        try {
          setLoadingEmployees(true);
          const response = await teamApiService.getAvailableEmployees(1, 25);
          console.log('🔍 Available employees (frontend):', response);
          setAvailableEmployees(response.items || []);
        } catch (error) {
          console.error('❌ Error loading available employees:', error);
        } finally {
          setLoadingEmployees(false);
        }
      }
    };

    loadAvailableEmployees();
  }, [showAddMemberDialog]);

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team);
    setShowAddMemberDialog(true);
  };

  const handleAddMemberSubmit = async () => {
    if (!selectedTeam || !selectedEmployeeId) return;

    try {
      // Call the actual API to add member to team
      await teamApiService.addMemberToTeam(selectedTeam.id, selectedEmployeeId);

      setShowAddMemberDialog(false);
      setSelectedEmployeeId('');

      // Show success message
      snackbar.success(lang.memberAdded);

      // Trigger auto-render for other components
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch {
      snackbar.error('Failed to add member to team. Please try again.');
    }
  };

  if (teams.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          color: darkMode ? '#ccc' : '#666',
        }}
      >
        <GroupIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant='h6' gutterBottom>
          {lang.noTeams}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
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
        {teams.map(team => (
          <Card
            key={team.id}
            sx={{
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease-in-out',
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    backgroundColor: generateAvatarColor(team.name),
                    mr: 2,
                  }}
                >
                  <GroupIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant='h6'
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {team.name}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ color: darkMode ? '#ccc' : '#666' }}
                  >
                    {team.manager?.first_name} {team.manager?.last_name}
                  </Typography>
                </Box>
              </Box>

              {team.description && (
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#ccc' : '#666',
                    mb: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {team.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={`${team.teamMembers?.length || 0} ${lang.members}`}
                  size='small'
                  icon={<PersonIcon />}
                  sx={{
                    backgroundColor: '#484c7f',
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
              </Box>

              <Stack direction='row' spacing={1} sx={{ mt: 'auto' }}>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<GroupIcon />}
                  onClick={() => handleViewMembers(team)}
                  sx={{
                    borderColor: '#484c7f',
                    color: '#484c7f',
                    '&:hover': {
                      borderColor: '#3a3f5f',
                      backgroundColor: 'rgba(72, 76, 127, 0.1)',
                    },
                  }}
                >
                  {lang.viewMembers}
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={() => handleAddMember(team)}
                  sx={{
                    borderColor: '#484c7f',
                    color: '#484c7f',
                    '&:hover': {
                      borderColor: '#3a3f5f',
                      backgroundColor: 'rgba(72, 76, 127, 0.1)',
                    },
                  }}
                >
                  {lang.addMember}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Team Members Dialog */}
      <Dialog
        open={showMemberDialog}
        onClose={() => setShowMemberDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
          <Typography
            variant='h6'
            component='div'
            fontWeight={600}
            dir={'ltr'}
            sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            {selectedTeam?.name} - {lang.teamMembers}
          </Typography>
        </DialogTitle>
        <DialogContent dir={'ltr'}>
          {selectedTeam && (
            <TeamMemberList teamId={selectedTeam.id} darkMode={darkMode} />
          )}
        </DialogContent>
        <DialogActions sx={{ direction: 'ltr', justifyContent: language === 'ar' ? 'flex-start' : 'flex-end' }}>
          <Button onClick={() => setShowMemberDialog(false)}>
            {lang.cancel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
          <Typography
            variant='h6'
            component='div'
            fontWeight={600}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            {lang.addMemberToTeam}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label={lang.selectEmployee}
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            disabled={loadingEmployees}
            sx={{ mt: 2 }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 300, // prevent long lists from overflowing
                    mt: 1, // adds margin below textfield
                    borderRadius: 2,
                  },
                },
                disableScrollLock: true, // prevents dialog scroll issues
                container: document.body, // ensures proper z-index
              },
            }}
          >
            <MenuItem value='' disabled>
              {loadingEmployees ? 'Loading employees...' : lang.selectEmployee}
            </MenuItem>
            {availableEmployees.map(employee => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.user
                  ? `${employee.user.first_name || ''} ${employee.user.last_name || ''}`
                  : 'Unknown User'}{' '}
                - {employee.designation?.title || 'N/A'}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            padding: '8px 16px',
            gap: 1,
          }}
        >
          <Button onClick={() => setShowAddMemberDialog(false)}>
            {lang.cancel}
          </Button>
          <Button
            onClick={handleAddMemberSubmit}
            variant='contained'
            disabled={!selectedEmployeeId}
            sx={{ backgroundColor: '#484c7f' }}
          >
            {lang.add}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTeams;
