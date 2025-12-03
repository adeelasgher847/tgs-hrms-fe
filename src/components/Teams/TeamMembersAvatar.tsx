import React, { useState, useEffect } from 'react';
import {
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
import UserAvatar from '../common/UserAvatar';
import { Avatar } from '@mui/material';
import { Group as GroupIcon, Close as CloseIcon } from '@mui/icons-material';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';

// Extended interface for admin team members with team info
interface AdminTeamMember extends TeamMember {
  team?: {
    id: string;
    name: string;
  };
}
import { getUserRole, isAdmin } from '../../utils/auth';
import { useLanguage } from '../../hooks/useLanguage';

interface TeamMembersAvatarProps {
  maxAvatars?: number;
  darkMode?: boolean;
}

const TeamMembersAvatar: React.FC<TeamMembersAvatarProps> = ({
  maxAvatars = 4,
  darkMode = false,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [adminTeamMembers, setAdminTeamMembers] = useState<AdminTeamMember[]>(
    []
  );
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
      team: 'Team',
      allTeamMembers: 'All Team Members',
    },
    ar: {
      teamMembers: 'أعضاء الفريق',
      noMembers: 'لا يوجد أعضاء في الفريق',
      addMember: 'إضافة عضو',
      manager: 'مدير',
      employee: 'موظف',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      team: 'الفريق',
      allTeamMembers: 'جميع أعضاء الفريق',
    },
  };

  const lang = labels[language];

  // Generate from name
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

        if (isManager()) {
          // Load manager's team members
          const response = await teamApiService.getMyTeamMembers(1);
          setTeamMembers(response.items || []);
          setAdminTeamMembers([]);
        } else if (isAdmin()) {
          // Load all team members across all teams for admin
          const response = await teamApiService.getAllTeamMembers(1);
          setAdminTeamMembers(response.items || []);
          setTeamMembers([]);
        } else {
          // For other roles, don't load any team members
          setTeamMembers([]);
          setAdminTeamMembers([]);
        }
      } catch {
        setTeamMembers([]);
        setAdminTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  // Render admin team member avatar with team info in tooltip
  const renderAdminAvatar = (member: AdminTeamMember) => {
    try {
      // Add null checks to prevent errors
      if (!member?.user || !member.user.first_name || !member.user.last_name) {
        return null;
      }

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
                {lang.team}: {member.team?.name || 'N/A'}
              </Typography>
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
          <UserAvatar
            user={{
              id: member.user.id,
              first_name: member.user.first_name,
              last_name: member.user.last_name,
              profile_pic: member.user.profile_pic,
            }}
            size={38}
            clickable={true}
            sx={{
              border: '2px solid white',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                border: '2px solid #000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          />
        </Tooltip>
      );
    } catch {
      return null;
    }
  };

  // Render avatar with tooltip
  const renderAvatar = (member: TeamMember) => {
    try {
      // Add null checks to prevent errors
      if (!member?.user || !member.user.first_name || !member.user.last_name) {
        return null;
      }

      // Generate initials and avatar color for styling
      generateInitials(member.user.first_name, member.user.last_name);
      generateAvatarColor(member.user.first_name);
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
          <UserAvatar
            user={{
              id: member.user.id,
              first_name: member.user.first_name,
              last_name: member.user.last_name,
              profile_pic: member.user.profile_pic,
            }}
            size={38}
            clickable={true}
            sx={{
              border: '2px solid white',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                border: '2px solid #000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          />
        </Tooltip>
      );
    } catch {
      return null;
    }
  };

  // Show loading skeletons
  if (loading) {
    return (
      <Stack direction='row' spacing={-1}>
        {[...Array(3)].map((_, _index) => (
          <Skeleton
            key={_index}
            variant='circular'
            width={38}
            height={38}
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

  // Show team members avatars for managers
  if (isManager() && teamMembers.length > 0) {
    // Filter out invalid members
    const validMembers = teamMembers.filter(
      member => member?.user?.first_name && member?.user?.last_name
    );

    if (validMembers.length === 0) {
      // No valid members, show default without plus button
      return (
        <>
          <Stack
            direction='row'
            spacing={-1}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                backgroundColor: '#4b4f73',
                cursor: 'pointer',
                border: '2px solid white',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: '#3a3f5f',
                  border: '2px solid #000',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
              }}
            >
              <GroupIcon fontSize='medium' />
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
          sx={{ display: { xs: 'none', md: 'flex' } }}
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
                  {validMembers.slice(maxAvatars).map(member => (
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
                  width: 38,
                  height: 38,
                  backgroundColor: '#484c7f',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '2px solid white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#3a3f5f',
                    transform: 'scale(1.05)',
                    border: '2px solid #000',
                    boxShadow: '0 4px 12px rgba(72, 76, 127, 0.3)',
                  },
                }}
              >
                +{remainingCount}
              </Avatar>
            </Tooltip>
          )}
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
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
              pb: 1,
              flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 600,
                  width: '100%',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {lang.teamMembers} ({teamMembers.length})
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowAllMembersDialog(false)}
              sx={{ color: darkMode ? '#ccc' : '#666' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, direction: 'ltr' }}>
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
                  .map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        borderBottom: `1px solid ${darkMode ? '#444' : '#f0f0f0'}`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar>
                        <UserAvatar
                          user={{
                            id: member.user?.id,
                            first_name: member.user?.first_name || '',
                            last_name: member.user?.last_name || '',
                            profile_pic: member.user?.profile_pic,
                          }}
                          size={40}
                          clickable={false}
                        />
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

  // Show all team members avatars for admins
  if (isAdmin() && adminTeamMembers.length > 0) {
    // Filter out invalid members
    const validMembers = adminTeamMembers.filter(
      member => member?.user?.first_name && member?.user?.last_name
    );

    if (validMembers.length === 0) {
      // No valid members, show default
      return (
        <>
          <Stack
            direction='row'
            spacing={-1}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                backgroundColor: '#4b4f73',
                cursor: 'pointer',
                border: '2px solid white',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: '#3a3f5f',
                  border: '2px solid #000',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
              }}
            >
              <GroupIcon fontSize='medium' />
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
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {displayMembers
            .map(member => renderAdminAvatar(member))
            .filter(Boolean)}

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
                  {validMembers.slice(maxAvatars).map(member => (
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
                      {member.designation?.title}) - {member.team?.name}
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
                  width: 38,
                  height: 38,
                  backgroundColor: '#484c7f',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '2px solid white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#3a3f5f',
                    transform: 'scale(1.05)',
                    border: '2px solid #000',
                    boxShadow: '0 4px 12px rgba(72, 76, 127, 0.3)',
                  },
                }}
              >
                +{remainingCount}
              </Avatar>
            </Tooltip>
          )}
        </Stack>

        {/* All Team Members Dialog for Admin */}
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
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
              pb: 1,
              flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 600,
                  width: '100%',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {lang.allTeamMembers} ({adminTeamMembers.length})
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowAllMembersDialog(false)}
              sx={{ color: darkMode ? '#ccc' : '#666' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, direction: 'ltr' }}>
            {adminTeamMembers.length === 0 ? (
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
                {adminTeamMembers
                  .filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  )
                  .map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        borderBottom: `1px solid ${darkMode ? '#444' : '#f0f0f0'}`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar>
                        <UserAvatar
                          user={{
                            id: member.user?.id,
                            first_name: member.user?.first_name || '',
                            last_name: member.user?.last_name || '',
                            profile_pic: member.user?.profile_pic,
                          }}
                          size={40}
                          clickable={false}
                        />
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
                                label={member.team?.name || 'N/A'}
                                size='small'
                                sx={{
                                  backgroundColor: '#1976d2',
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

  // Show default avatars for managers when no team members
  if (isManager()) {
    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: '#4b4f73',
              cursor: 'pointer',
              border: '2px solid white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: '#3a3f5f',
                border: '2px solid #000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <GroupIcon fontSize='medium' />
          </Avatar>
        </Stack>
      </>
    );
  }

  // Show default avatar for admins when no team members
  if (isAdmin()) {
    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: '#4b4f73',
              cursor: 'pointer',
              border: '2px solid white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: '#3a3f5f',
                border: '2px solid #000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <GroupIcon fontSize='medium' />
          </Avatar>
        </Stack>
      </>
    );
  }

  // Return null for other roles (user, etc.)
  return null;
};

export default TeamMembersAvatar;
