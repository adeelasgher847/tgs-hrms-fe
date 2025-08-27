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
import type { Team } from '../../api/teamApi';
import TeamMemberList from './TeamMemberList';

interface TeamListProps {
  teams: Team[];
  darkMode?: boolean;
}

const TeamList: React.FC<TeamListProps> = ({ teams, darkMode = false }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
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
      confirmDelete: 'Are you sure you want to delete this team?',
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
      confirmDelete: 'هل أنت متأكد من حذف هذا الفريق؟',
      teamDeleted: 'تم حذف الفريق بنجاح',
      error: 'حدث خطأ',
    },
  };

  const lang = labels[language];

  // Generate initials for avatar

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
    // Edit team logic here
    console.log('Edit team:', team);
  };

  const handleDeleteTeam = async (team: Team) => {
    if (window.confirm(lang.confirmDelete)) {
      try {
        // Delete team logic here
        console.log('Delete team:', team);
      } catch (error) {
        console.error('Error deleting team:', error);
      }
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
    </Box>
  );
};

export default TeamList;
