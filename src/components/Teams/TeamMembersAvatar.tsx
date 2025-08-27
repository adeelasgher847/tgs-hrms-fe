import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Stack,
  Tooltip,
  Box,
  Typography,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { getUserRole } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';

interface TeamMembersAvatarProps {
  maxAvatars?: number;
  onOpenInviteModal?: () => void;
  darkMode?: boolean;
}

const TeamMembersAvatar: React.FC<TeamMembersAvatarProps> = ({
  maxAvatars = 4,
  onOpenInviteModal,
  darkMode = false,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMembersDialog, setShowAllMembersDialog] = useState(false);

  const { language } = useLanguage();

  const labels = {
    en: {
      teamMembers: 'Team Members',
      noMembers: 'No team members',
      addMember: 'Add Member',
      manager: 'Manager',
      employee: 'Employee',
      department: 'Department',
      designation: 'Designation',
    },
    ar: {
      teamMembers: 'أعضاء الفريق',
      noMembers: 'لا يوجد أعضاء في الفريق',
      addMember: 'إضافة عضو',
      manager: 'مدير',
      employee: 'موظف',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
    },
  };

  const lang = labels[language];

  // Generate initials from name
  const generateInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  // Generate avatar color based on name
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
      '#ff8f00',
      '#6d4c41',
      '#455a64',
      '#5d4037',
      '#424242',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Check if user is a manager
  const isManager = (): boolean => {
    const userRole = getUserRole();
    return userRole === 'manager' || userRole === 'Manager';
  };

  // Load team members for avatar display
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading team members for avatar display...');
        const response = await teamApiService.getMyTeamMembers(1);
        console.log('📊 Team members avatar response:', response);
        console.log('📋 Avatar members data:', response.items);

        if (response.items && response.items.length > 0) {
          console.log('👤 First avatar member sample:', response.items[0]);
          console.log(
            '🏢 Department data available:',
            response.items[0].department
          );
          console.log(
            '💼 Designation data available:',
            response.items[0].designation
          );
        }

        setTeamMembers(response.items || []);
      } catch (err) {
        console.error('❌ Error loading team members:', err);
        console.error('Failed to load team members');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  // Render avatar with tooltip
  const renderAvatar = (member: TeamMember) => {
    try {
      // Add null checks to prevent errors
      if (!member?.user || !member.user.first_name || !member.user.last_name) {
        console.warn('Invalid team member data:', member);
        return null;
      }

      const initials = generateInitials(
        member.user.first_name,
        member.user.last_name
      );
      const avatarColor = generateAvatarColor(member.user.first_name);
      const fullName = `${member.user.first_name} ${member.user.last_name}`;

      return (
        <Tooltip
          key={member.id}
          title={
            <Box sx={{ p: 1 }}>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 600, color: 'white' }}
              >
                {fullName}
              </Typography>
              <Typography
                variant='caption'
                sx={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {member.user.email || 'N/A'}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={member.designation?.title || 'N/A'}
                  size='small'
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: '20px',
                  }}
                />
              </Box>
              <Typography
                variant='caption'
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  display: 'block',
                  mt: 0.5,
                }}
              >
                {lang.department}:{' '}
                {(() => {
                  const designationTitle = member.designation?.title;
                  let departmentName = member.department?.name;

                  if (!departmentName && designationTitle) {
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

                    departmentName =
                      designationToDepartment[designationTitle] ||
                      'Information Technology';
                  }

                  return departmentName || 'Information Technology';
                })()}
              </Typography>
            </Box>
          }
          arrow
          placement='bottom'
        >
          <Avatar
            alt={fullName}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: avatarColor,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '2px solid white',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            {initials}
          </Avatar>
        </Tooltip>
      );
    } catch (error) {
      console.error('Error rendering avatar for member:', member, error);
      return null;
    }
  };

  // Show loading skeletons
  if (loading) {
    return (
      <Stack direction='row' spacing={-1}>
        {[...Array(3)].map((_, index) => (
          <Skeleton
            key={index}
            variant='circular'
            width={32}
            height={32}
            sx={{
              backgroundColor: darkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </Stack>
    );
  }

  // Show team members avatars
  if (isManager() && teamMembers.length > 0) {
    // Filter out invalid members
    const validMembers = teamMembers.filter(
      member => member?.user?.first_name && member?.user?.last_name
    );

    if (validMembers.length === 0) {
      // No valid members, show default
      return (
        <>
          <Stack
            direction='row'
            spacing={-1}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#4b4f73',
                cursor: 'pointer',
              }}
            >
              <GroupIcon fontSize='small' />
            </Avatar>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#4b4f73',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#3a3f5f',
                },
              }}
              onClick={onOpenInviteModal}
            >
              <AddIcon fontSize='small' />
            </Avatar>
          </Stack>
        </>
      );
    }

    const displayMembers = validMembers.slice(0, maxAvatars);
    const remainingCount = validMembers.length - maxAvatars;

    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          {displayMembers.map(member => renderAvatar(member)).filter(Boolean)}

          {remainingCount > 0 && (
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant='subtitle2'
                    sx={{ color: 'white', mb: 1, fontWeight: 600 }}
                  >
                    {remainingCount} more team members:
                  </Typography>
                  {validMembers.slice(maxAvatars).map((member, index) => (
                    <Typography
                      key={member.id}
                      variant='body2'
                      sx={{
                        color: 'white',
                        mb: 0.5,
                        fontSize: '0.8rem',
                      }}
                    >
                      • {member.user?.first_name} {member.user?.last_name} (
                      {member.designation?.title})
                    </Typography>
                  ))}
                </Box>
              }
              arrow
              placement='bottom'
            >
              <Avatar
                onClick={() => setShowAllMembersDialog(true)}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#4b4f73',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  border: '2px solid white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#3a3f5f',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              >
                +{remainingCount}
              </Avatar>
            </Tooltip>
          )}

          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#4b4f73',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#3a3f5f',
              },
            }}
            onClick={onOpenInviteModal}
          >
            <AddIcon fontSize='small' />
          </Avatar>
        </Stack>

        {/* All Team Members Dialog */}
        <Dialog
          open={showAllMembersDialog}
          onClose={() => setShowAllMembersDialog(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              color: darkMode ? '#fff' : '#000',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {lang.teamMembers} ({teamMembers.length})
            </Typography>
            <IconButton
              onClick={() => setShowAllMembersDialog(false)}
              sx={{ color: darkMode ? '#ccc' : '#666' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {teamMembers.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  {lang.noMembers}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {teamMembers
                  .filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  )
                  .map((member, index) => (
                    <ListItem
                      key={member.id}
                      sx={{
                        borderBottom: `1px solid ${darkMode ? '#444' : '#f0f0f0'}`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: generateAvatarColor(
                              member.user?.first_name || 'Unknown'
                            ),
                            width: 40,
                            height: 40,
                            fontSize: '0.9rem',
                          }}
                        >
                          {generateInitials(
                            member.user?.first_name || '',
                            member.user?.last_name || ''
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant='subtitle1'
                            sx={{
                              fontWeight: 600,
                              color: darkMode ? '#fff' : '#000',
                            }}
                          >
                            {member.user?.first_name} {member.user?.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant='body2'
                              sx={{
                                color: darkMode ? '#ccc' : '#666',
                                mb: 0.5,
                              }}
                            >
                              {member.user?.email}
                            </Typography>
                            <Box
                              sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                            >
                              <Chip
                                label={member.designation?.title || 'N/A'}
                                size='small'
                                sx={{
                                  backgroundColor: '#484c7f',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                              <Chip
                                label={member.department?.name || 'N/A'}
                                size='small'
                                variant='outlined'
                                sx={{
                                  borderColor: darkMode ? '#666' : '#ccc',
                                  color: darkMode ? '#ccc' : '#666',
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show default avatars for non-managers or when no team members
  return (
    <>
      <Stack
        direction='row'
        spacing={-1}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: '#4b4f73',
            cursor: 'pointer',
          }}
        >
          <GroupIcon fontSize='small' />
        </Avatar>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: '#4b4f73',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#3a3f5f',
            },
          }}
          onClick={onOpenInviteModal}
        >
          <AddIcon fontSize='small' />
        </Avatar>
      </Stack>
    </>
  );
};

export default TeamMembersAvatar;
