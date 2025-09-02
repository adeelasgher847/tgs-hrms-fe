import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import {
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../context/LanguageContext';
import type { Team, UpdateTeamDto } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';
import TeamMemberList from './TeamMemberList';
import EditTeamForm from './EditTeamForm';
import DeleteTeamDialog from './DeleteTeamDialog';

interface TeamListProps {
  teams: Team[];
  darkMode?: boolean;
  onTeamUpdated?: () => void;
}

const TeamList: React.FC<TeamListProps> = ({
  teams,
  darkMode = false,
  onTeamUpdated,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { language } = useLanguage();

  const labels = {
    en: {
      noTeams: 'No teams found.',
      teamMembers: 'Team Members',
      manager: 'Manager',
      members: 'Members',
      viewMembers: 'View Members',
      editTeam: 'Edit Team',
      deleteTeam: 'Delete Team',
      cancel: 'Cancel',
      teamUpdated: 'Team updated successfully',
      teamDeleted: 'Team deleted successfully',
      error: 'An error occurred',
    },
    ar: {
      noTeams: 'لم يتم العثور على فرق.',
      teamMembers: 'أعضاء الفريق',
      manager: 'مدير',
      members: 'الأعضاء',
      viewMembers: 'عرض الأعضاء',
      editTeam: 'تعديل الفريق',
      deleteTeam: 'حذف الفريق',
      cancel: 'إلغاء',
      teamUpdated: 'تم تحديث الفريق بنجاح',
      teamDeleted: 'تم حذف الفريق بنجاح',
      error: 'حدث خطأ',
    },
  };

  const lang = labels[language];

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

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowEditDialog(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const handleEditSubmit = async (id: string, data: UpdateTeamDto) => {
    try {
      console.log('🔄 TeamList: Starting team update for ID:', id);
      console.log('🔄 TeamList: Update data:', data);

      const updatedTeam = await teamApiService.updateTeam(id, data);
      console.log('✅ TeamList: Update successful, response:', updatedTeam);

      // Verify the update was successful and includes manager info
      if (!updatedTeam || !updatedTeam.id) {
        throw new Error('Invalid response from team update API');
      }

      // Log the manager information for debugging
      console.log(
        '🔄 TeamList: Old manager:',
        teams.find(t => t.id === id)?.manager
      );
      console.log('🔄 TeamList: New manager:', updatedTeam.manager);

      // Update the local teams state for immediate UI update
      // This ensures the UI shows the updated manager name immediately
      const currentTeam = teams.find(t => t.id === id);
      if (currentTeam && updatedTeam.manager) {
        currentTeam.manager = updatedTeam.manager;
        currentTeam.name = updatedTeam.name;
        currentTeam.description = updatedTeam.description;
        console.log('🔄 TeamList: Local state updated, triggering re-render');
      }

      snackbar.success(lang.teamUpdated);
      setShowEditDialog(false);
      setSelectedTeam(null);

      // Trigger refresh to get the latest data from backend and update parent state
      if (onTeamUpdated) {
        onTeamUpdated();
      }
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch (error) {
      console.error('❌ TeamList: Error updating team:', error);

      // Show error message to user
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update team';
      snackbar.error(errorMessage);

      // Don't close the dialog, let user try again
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      await teamApiService.deleteTeam(selectedTeam.id);
      snackbar.success(lang.teamDeleted);
      setShowDeleteDialog(false);
      setSelectedTeam(null);

      // Trigger refresh
      if (onTeamUpdated) {
        onTeamUpdated();
      }
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch (error) {
      console.error('Error deleting team:', error);
      setDeleteError(lang.error);
    } finally {
      setDeleteLoading(false);
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
                <Box>
                  <IconButton
                    size='small'
                    onClick={() => handleEditTeam(team)}
                    sx={{ color: '#484c7f' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => handleDeleteTeam(team)}
                    sx={{ color: '#d32f2f' }}
                  >
                    <DeleteIcon />
                  </IconButton>
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
                {!team.teamMembers && (
                  <Typography
                    variant='caption'
                    sx={{
                      color: darkMode ? '#888' : '#999',
                      ml: 1,
                      fontStyle: 'italic',
                    }}
                  >
                    (Loading...)
                  </Typography>
                )}
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
          {selectedTeam?.name} - {lang.teamMembers}
        </DialogTitle>
        <DialogContent>
          {selectedTeam && (
            <TeamMemberList teamId={selectedTeam.id} darkMode={darkMode} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMemberDialog(false)}>
            {lang.cancel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Team Dialog */}
      <EditTeamForm
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedTeam(null);
        }}
        onSubmit={handleEditSubmit}
        team={selectedTeam}
        darkMode={darkMode}
      />

      {/* Delete Team Dialog */}
      <DeleteTeamDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTeam(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        team={selectedTeam}
        darkMode={darkMode}
        loading={deleteLoading}
        error={deleteError}
      />
    </Box>
  );
};

export default TeamList;
