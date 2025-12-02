import React, { useEffect, useState } from 'react';
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
  Tooltip,
} from '@mui/material';

import {
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import type { Team, UpdateTeamDto } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';
import TeamMemberList from './TeamMemberList';
import EditTeamForm from './EditTeamForm';
import DeleteTeamDialog from './DeleteTeamDialog';
import AvailableEmployees from './AvailableEmployees';
import { exportCSV } from '../../api/exportApi';
import { isAdmin, isHRAdmin } from '../../utils/auth';

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
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEmployeePoolDialog, setShowEmployeePoolDialog] = useState(false);
  const [employeePoolTeam, setEmployeePoolTeam] = useState<Team | null>(null);
  const [preselectedPoolTeamId, setPreselectedPoolTeamId] = useState<
    string | undefined
  >(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [employeePoolCount, setEmployeePoolCount] = useState<number | null>(
    null
  );
  const { language } = useLanguage();

  const token = localStorage.getItem('token') || undefined;
  const filters = { page: '1' };

  const labels = {
    en: {
      noTeams: 'No teams found.',
      exportTooltip: 'Export Teams CSV',
      teamMembers: 'Team Members',
      manager: 'Manager',
      members: 'Members',
      viewMembers: 'View Members',
      addMember: 'Add Member',
      editTeam: 'Edit Team',
      deleteTeam: 'Delete Team',
      cancel: 'Cancel',
      teamUpdated: 'Team successfully',
      teamDeleted: 'Team deleted successfully',
      error: 'An error occurred',
    },
    ar: {
      noTeams: 'لم يتم العثور على فرق.',
      exportTooltip: 'تصدير الفرق (CSV)',
      teamMembers: 'أعضاء الفريق',
      manager: 'مدير',
      members: 'الأعضاء',
      viewMembers: 'عرض الأعضاء',
      addMember: 'إضافة عضو',
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

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team);
    setShowAddMemberDialog(true);
  };

  const handleOpenEmployeePool = (team?: Team | null) => {
    setEmployeePoolTeam(team ?? null);
    setPreselectedPoolTeamId(team?.id ?? undefined);
    setShowEmployeePoolDialog(true);
  };

  const handleCloseEmployeePool = () => {
    setShowEmployeePoolDialog(false);
    setEmployeePoolTeam(null);
    setPreselectedPoolTeamId(undefined);
  };

  useEffect(() => {
    const hasEmployeePool = teams.some(team => team.id === 'employee-pool');
    if (!hasEmployeePool) {
      setEmployeePoolCount(null);
      return;
    }

    let isMounted = true;

    const loadEmployeePoolCount = async () => {
      try {
        const response = await teamApiService.getAvailableEmployees(1, 1);
        if (!isMounted) return;
        setEmployeePoolCount(response.total || 0);
      } catch {
        if (!isMounted) return;
        setEmployeePoolCount(0);
      }
    };

    loadEmployeePoolCount();

    return () => {
      isMounted = false;
    };
  }, [teams]);

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
      const updatedTeam = await teamApiService.updateTeam(id, data);

      // Verify the update was successful and includes manager info
      if (!updatedTeam || !updatedTeam.id) {
        throw new Error('Invalid from team update API');
      }

      // Log the manager information for debugging

      // Update the local teams state for immediate UI update
      // This ensures the UI shows the manager name immediately
      const currentTeam = teams.find(t => t.id === id);
      if (currentTeam && updatedTeam.manager) {
        currentTeam.manager = updatedTeam.manager;
        currentTeam.name = updatedTeam.name;
        currentTeam.description = updatedTeam.description;
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
    } catch {
      setDeleteError(lang.error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export button always at the top
  const exportButton = (
    <Box mb={2} display='flex' justifyContent='flex-end'>
      <Tooltip title={lang.exportTooltip}>
        <IconButton
          color='primary'
          onClick={() =>
            exportCSV('/teams/export', 'teams.csv', token, filters)
          }
          sx={{
            backgroundColor: 'primary.main',
            borderRadius: '6px',
            padding: '6px',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  if (teams.length === 0) {
    return (
      <>
        {exportButton}
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
      </>
    );
  }

  return (
    <>
      {!isHRAdmin() && exportButton}
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: { xs: 2, sm: 3, md: 4 },
            maxWidth: '100%',
            mx: 'auto',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            '& > *': {
              width: {
                xs: '100%',
                sm: 'calc(50% - 12px)',
                md: 'calc(50% - 16px)',
                lg: 'calc(33.333% - 21px)',
              },
              maxWidth: { xs: '100%', sm: '350px', md: '380px', lg: '400px' },
              minWidth: { xs: '280px', sm: '300px' },
            },
          }}
        >
          {teams.map(team => {
            const isEmployeePoolTeam = team.id === 'employee-pool';
            const memberCount = isEmployeePoolTeam
              ? (employeePoolCount ?? 0)
              : (team.teamMembers?.length ??
                team.members?.length ??
                team.memberCount ??
                0);

            return (
              <Card
                key={team.id}
                sx={{
                  backgroundColor: theme => theme.palette.background.paper,
                  height: { xs: 'auto', sm: 'auto', md: 'auto' },
                  minHeight: {
                    xs: '200px',
                    sm: '220px',
                    md: '240px',
                    lg: '260px',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  borderRadius: 2,
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    p: { xs: 2.5, sm: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {isAdmin() && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          backgroundColor: generateAvatarColor(team.name),
                          mr: 2,
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          flexShrink: 0,
                        }}
                      >
                        <GroupIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </Avatar>
                      <Box
                        sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}
                      >
                        <Typography
                          variant='h6'
                          sx={{
                            color: theme => theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', // Always keep in single line
                            lineHeight: 1.2,
                            minHeight: 'auto',
                          }}
                          title={team.name} // Show full name on hover
                        >
                          {team.name}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme => theme.palette.text.secondary,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', // Always keep in single line
                            lineHeight: 1.2,
                            minHeight: 'auto',
                          }}
                          title={`${team.manager?.first_name} ${team.manager?.last_name}`} // Show full name on hover
                        >
                          {team.manager?.first_name} {team.manager?.last_name}
                        </Typography>
                      </Box>
                      {!isHRAdmin() && (
                        <Box
                          sx={{
                            display: 'flex',
                            gap: { xs: 0.5, sm: 1 },
                            flexShrink: 0,
                          }}
                        >
                          <IconButton
                            size='small'
                            onClick={() => handleEditTeam(team)}
                            sx={{
                              color: theme => theme.palette.primary.main,
                              padding: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteTeam(team)}
                            sx={{
                              color: theme => theme.palette.error.main,
                              padding: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )}

                  {team.description && (
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme => theme.palette.text.secondary,
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: { xs: '3.6em', sm: '4.2em' },
                      }}
                    >
                      {team.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 3,
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Chip
                      label={`${memberCount} ${lang.members}`}
                      size='small'
                      icon={
                        <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                      }
                      sx={{
                        backgroundColor: theme => theme.palette.primary.main,
                        color: theme => theme.palette.primary.contrastText,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        height: { xs: 24, sm: 28 },
                      }}
                    />
                    {!team.teamMembers && (
                      <Typography
                        variant='caption'
                        sx={{
                          color: theme => theme.palette.text.disabled,
                          fontStyle: 'italic',
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        }}
                      >
                        (Loading...)
                      </Typography>
                    )}
                  </Box>

                  <Stack
                    direction='row'
                    spacing={1}
                    sx={{
                      mt: 'auto',
                      pt: 2,
                      borderTop: theme => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {isEmployeePoolTeam ? (
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={
                          <GroupIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
                        onClick={() => handleOpenEmployeePool(team)}
                        sx={{
                          borderColor: theme => theme.palette.primary.main,
                          color: theme => theme.palette.primary.main,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 0.5, sm: 0.75 },
                          px: { xs: 1, sm: 1.5 },
                          '&:hover': {
                            borderColor: theme => theme.palette.primary.dark,
                            backgroundColor: theme =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        {lang.viewMembers}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant='outlined'
                          size='small'
                          startIcon={
                            <GroupIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                          }
                          onClick={() => handleViewMembers(team)}
                          sx={{
                            borderColor: theme => theme.palette.primary.main,
                            color: theme => theme.palette.primary.main,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            py: { xs: 0.5, sm: 0.75 },
                            px: { xs: 1, sm: 1.5 },
                            '&:hover': {
                              borderColor: theme => theme.palette.primary.dark,
                              backgroundColor: theme =>
                                theme.palette.action.hover,
                            },
                          }}
                        >
                          {lang.viewMembers}
                        </Button>
                        {!isHRAdmin() && (
                          <Button
                            variant='outlined'
                            size='small'
                            startIcon={
                              <AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                            }
                            onClick={() => handleAddMember(team)}
                            sx={{
                              borderColor: theme => theme.palette.primary.main,
                              color: theme => theme.palette.primary.main,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              py: { xs: 0.5, sm: 0.75 },
                              px: { xs: 1, sm: 1.5 },
                              '&:hover': {
                                borderColor: theme =>
                                  theme.palette.primary.dark,
                                backgroundColor: theme =>
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            {lang.addMember}
                          </Button>
                        )}
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Team Members Dialog */}
        <Dialog
          open={showMemberDialog}
          onClose={() => setShowMemberDialog(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              color: darkMode ? '#fff' : '#000',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {selectedTeam?.name} - {lang.teamMembers}
          </DialogTitle>
          <DialogContent sx={{ direction: 'ltr' }}>
            {selectedTeam && (
              <TeamMemberList teamId={selectedTeam.id} darkMode={darkMode} />
            )}
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              display: 'flex',
              direction: 'ltr',
              justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
            }}
          >
            <Button
              onClick={() => setShowMemberDialog(false)}
              sx={{
                order: language === 'ar' ? -1 : 0,
                ml: language === 'en' ? 'auto' : 0,
                mr: language === 'ar' ? 'auto' : 0,
              }}
            >
              {lang.cancel}
            </Button>
          </DialogActions>
        </Dialog>

        {isAdmin() && (
          <Dialog
            open={showEmployeePoolDialog}
            onClose={handleCloseEmployeePool}
            maxWidth='lg'
            fullWidth
          >
            <DialogTitle
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              sx={{
                color: darkMode ? '#fff' : '#000',
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
            >
              {employeePoolTeam?.name
                ? `${employeePoolTeam.name} - ${lang.viewMembers}`
                : lang.viewMembers}
            </DialogTitle>
            <DialogContent sx={{ direction: 'ltr' }}>
              <AvailableEmployees
                darkMode={darkMode}
                isEmployeePool
                preselectedTeamId={preselectedPoolTeamId}
                teamName={employeePoolTeam?.name}
                teamDescription={employeePoolTeam?.description}
              />
            </DialogContent>
            <DialogActions
              sx={{
                p: 2,
                display: 'flex',
                direction: 'ltr',
                justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
              }}
            >
              <Button
                onClick={handleCloseEmployeePool}
                sx={{
                  order: language === 'ar' ? -1 : 0,
                  ml: language === 'en' ? 'auto' : 0,
                  mr: language === 'ar' ? 'auto' : 0,
                }}
              >
                {lang.cancel}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Add Member Dialog */}
        {!isHRAdmin() && (
          <Dialog
            open={showAddMemberDialog}
            onClose={() => setShowAddMemberDialog(false)}
            maxWidth='md'
            fullWidth
            PaperProps={{
              sx: { direction: language === 'ar' ? 'rtl' : 'ltr' },
            }}
          >
            <DialogTitle
              sx={{
                color: darkMode ? '#fff' : '#000',
                display: 'flex',
                flexDirection: 'row',
                direction: 'ltr',
                alignItems: 'center',
              }}
            >
              {language === 'ar' ? (
                <>
                  <IconButton
                    onClick={() => setShowAddMemberDialog(false)}
                    sx={{ color: darkMode ? '#ccc' : '#666' }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <Box sx={{ flex: 1, textAlign: 'right' }}>
                    {lang.addMember} - {selectedTeam?.name}
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    {lang.addMember} - {selectedTeam?.name}
                  </Box>
                  <IconButton
                    onClick={() => setShowAddMemberDialog(false)}
                    sx={{ color: darkMode ? '#ccc' : '#666' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </DialogTitle>
            <DialogContent sx={{ direction: 'ltr' }}>
              <AvailableEmployees
                darkMode={darkMode}
                teamId={selectedTeam?.id}
                teamName={selectedTeam?.name}
                teamDescription={selectedTeam?.description}
              />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                onClick={() => setShowAddMemberDialog(false)}
                sx={{ color: darkMode ? '#fff' : '#000' }}
              >
                {lang.cancel}
              </Button>
            </DialogActions>
          </Dialog>
        )}

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
    </>
  );
};

export default TeamList;
