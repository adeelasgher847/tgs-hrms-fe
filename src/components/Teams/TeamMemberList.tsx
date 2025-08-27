import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../context/LanguageContext';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';

interface TeamMemberListProps {
  teamId: string;
  darkMode?: boolean;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({
  teamId,
  darkMode = false,
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const { language } = useLanguage();

  const labels = {
    en: {
      name: 'Name',
      email: 'Email',
      designation: 'Designation',
      department: 'Department',
      actions: 'Actions',
      removeMember: 'Remove Member',
      noMembers: 'No team members found',
      loading: 'Loading members...',
      error: 'Failed to load team members',
      confirmRemove: 'Are you sure you want to remove this member?',
      memberRemoved: 'Member removed successfully',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      designation: 'المسمى الوظيفي',
      department: 'القسم',
      actions: 'الإجراءات',
      removeMember: 'إزالة العضو',
      noMembers: 'لم يتم العثور على أعضاء الفريق',
      loading: 'جاري تحميل الأعضاء...',
      error: 'فشل في تحميل أعضاء الفريق',
      confirmRemove: 'هل أنت متأكد من إزالة هذا العضو؟',
      memberRemoved: 'تم إزالة العضو بنجاح',
    },
  };

  const lang = labels[language];

  // Generate initials for avatar
  const generateInitials = (firstName: string, lastName: string): string => {
    try {
      const first = firstName?.charAt(0)?.toUpperCase() || '';
      const last = lastName?.charAt(0)?.toUpperCase() || '';
      return `${first}${last}` || 'U';
    } catch (error) {
      console.error('Error generating initials:', error);
      return 'U';
    }
  };

  // Generate avatar color
  const generateAvatarColor = (name: string): string => {
    try {
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
      const index = (name || 'Unknown').charCodeAt(0) % colors.length;
      return colors[index];
    } catch (error) {
      console.error('Error generating avatar color:', error);
      return '#1976d2';
    }
  };

  // Load team members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Loading team members for team:', teamId);
        const response = await teamApiService.getTeamMembers(teamId, page + 1);
        console.log('📊 Team members response:', response);
        console.log('📋 Members data:', response.items);

        if (response.items && response.items.length > 0) {
          console.log('👤 First member sample:', response.items[0]);
          console.log(
            '🏢 Department data available:',
            response.items[0].department
          );
          console.log(
            '💼 Designation data available:',
            response.items[0].designation
          );
        }

        setMembers(response.items || []);
        console.log('🔍 Members:', response.items);
        setTotal(response.total || 0);
      } catch (err) {
        console.error('❌ Error loading team members:', err);
        setError(lang.error);
        // Don't use mock data - let the error state handle it
        setMembers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [teamId, page, rowsPerPage]);

  // Listen for team updates to refresh data
  useEffect(() => {
    const handleTeamUpdate = () => {
      console.log('🔄 Team updated, refreshing members...');
      // Trigger a re-fetch of members
      const loadMembers = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await teamApiService.getTeamMembers(
            teamId,
            page + 1
          );

          // Map members with proper department data
          const membersWithDepartment = (response.items || []).map(member => {
            let department = member.department;

            if (!department && member.designation?.title) {
              const designationToDepartment: { [key: string]: string } = {
                'Frontend Web Developer': 'Information Technology',
                'Backend .Net Developer': 'Information Technology',
                'UI/UX Designer': 'Information Technology',
                'QA Engineer': 'Information Technology',
                'DevOps Engineer': 'Information Technology',
                'HR Manager': 'Human Resources',
                'HR Specialist': 'Human Resources',
                'Financial Analyst': 'Finance & Accounting',
                Accountant: 'Finance & Accounting',
                'Marketing Manager': 'Marketing & Sales',
                'Sales Representative': 'Marketing & Sales',
                'Operations Manager': 'Operations & Logistics',
              };

              const mappedDepartmentName =
                designationToDepartment[member.designation.title];
              if (mappedDepartmentName) {
                department = {
                  id: '2',
                  name: mappedDepartmentName,
                };
              }
            }

            return {
              ...member,
              department: department || {
                id: '2',
                name: 'Information Technology',
              },
            };
          });

          setMembers(membersWithDepartment);
          setTotal(response.total || 0);
        } catch (err) {
          console.error('Error refreshing team members:', err);
        } finally {
          setLoading(false);
        }
      };

      loadMembers();
    };

    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => window.removeEventListener('teamUpdated', handleTeamUpdate);
  }, [teamId, page]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    setMemberToDelete(member);
    setShowDeleteConfirmDialog(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      await teamApiService.removeMemberFromTeam(teamId, memberToDelete.id);
      setMembers(prev =>
        prev.filter(member => member.id !== memberToDelete.id)
      );
      setTotal(prev => prev - 1);
      snackbar.success(lang.memberRemoved);

      // Trigger auto-render for other components
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch (error) {
      console.error('Error removing member:', error);
      snackbar.error(lang.error);
    } finally {
      setShowDeleteConfirmDialog(false);
      setMemberToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant='rectangular' height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (members.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          color: darkMode ? '#ccc' : '#666',
        }}
      >
        <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant='h6'>{lang.noMembers}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: darkMode ? '#2d2d2d' : '#fff' }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
              >
                {lang.name}
              </TableCell>
              <TableCell
                sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
              >
                {lang.email}
              </TableCell>
              <TableCell
                sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
              >
                {lang.designation}
              </TableCell>
              <TableCell
                sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
              >
                {lang.department}
              </TableCell>
              <TableCell
                sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
              >
                {lang.actions}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members
              .filter(
                member => member?.user?.first_name && member?.user?.last_name
              )
              .map(member => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          backgroundColor: generateAvatarColor(
                            member.user?.first_name || 'Unknown'
                          ),
                          mr: 2,
                          width: 32,
                          height: 32,
                          fontSize: '0.75rem',
                        }}
                      >
                        {generateInitials(
                          member.user?.first_name || '',
                          member.user?.last_name || ''
                        )}
                      </Avatar>
                      <Typography sx={{ color: darkMode ? '#fff' : '#000' }}>
                        {member.user?.first_name || 'Unknown'}{' '}
                        {member.user?.last_name || 'User'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#ccc' : '#666' }}>
                    {member.user?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.designation?.title || 'N/A'}
                      size='small'
                      sx={{
                        backgroundColor: '#484c7f',
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#ccc' : '#666' }}>
                    {member.designation?.department?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveMember(member)}
                      sx={{ color: '#d32f2f' }}
                      title={lang.removeMember}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{
          color: darkMode ? '#fff' : '#000',
          '& .MuiTablePagination-selectIcon': {
            color: darkMode ? '#fff' : '#000',
          },
        }}
      />
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            color: darkMode ? '#fff' : '#000',
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
          Confirm Remove Member
        </DialogTitle>
        <DialogContent>
          {memberToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Are you sure you want to remove{' '}
                <strong>
                  {memberToDelete.user?.first_name}{' '}
                  {memberToDelete.user?.last_name}
                </strong>{' '}
                from the team?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: darkMode ? '#444' : '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Employee:</strong> {memberToDelete.user?.first_name}{' '}
                  {memberToDelete.user?.last_name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Email:</strong> {memberToDelete.user?.email}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Designation:</strong>{' '}
                  {memberToDelete.designation?.title}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Department:</strong> {memberToDelete.designation?.department?.name}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoveMember}
            variant='contained'
            sx={{ backgroundColor: '#d32f2f' }}
          >
            Remove Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamMemberList;
