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
  TextField,
  InputAdornment,
} from '@mui/material';
import UserAvatar from '../common/UserAvatar';
import { Avatar } from '@mui/material';
import {
  Group as GroupIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      viewAllTeamMembers: 'View all {count} team members',
      searchMember: 'Search member...',
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
      viewAllTeamMembers: 'عرض جميع {count} أعضاء الفريق',
      searchMember: 'بحث عن عضو...',
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

    const displayMembers = validMembers.slice(0, 2);
    const remainingCount = validMembers.length - 2;
    const totalCount = validMembers.length;

    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: { xs: 'none', md: 'flex' }, borderRadius: '16px' }}
        >
          {displayMembers.map(member => renderAvatar(member)).filter(Boolean)}

          {remainingCount > 0 && (
            <Tooltip
              title={lang.viewAllTeamMembers.replace(
                '{count}',
                String(totalCount)
              )}
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
          maxWidth='xs'
          PaperProps={{
            sx: {
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              color: darkMode ? '#fff' : '#000',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '420px',
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '24px !important',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              // borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
              pb: 2,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {lang.allTeamMembers}{' '}
              <Box component='span' sx={{ color: '#878787' }}>
                (
                {(() => {
                  const validMembers = teamMembers.filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  );
                  const filteredMembers = validMembers.filter(member => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const fullName =
                      `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                    const email = (member.user?.email || '').toLowerCase();
                    const designation = (
                      member.designation?.title || ''
                    ).toLowerCase();
                    const department = (
                      member.department?.name || ''
                    ).toLowerCase();
                    return (
                      fullName.includes(query) ||
                      email.includes(query) ||
                      designation.includes(query) ||
                      department.includes(query)
                    );
                  });
                  return filteredMembers.length;
                })()}
                )
              </Box>
            </Typography>
            <IconButton
              onClick={() => {
                setShowAllMembersDialog(false);
                setSearchQuery('');
              }}
              sx={{ color: darkMode ? '#ccc' : '#666' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box
              sx={{
                p: 2,
              }}
            >
              <TextField
                fullWidth
                size='small'
                placeholder={lang.searchMember}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon sx={{ color: darkMode ? '#999' : '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: darkMode ? '#2d2d2d' : '#f8f8f8',
                    color: darkMode ? '#fff' : '#000',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: darkMode ? '#555' : '#bdbdbd',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? '#777' : '#ccc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#484c7f',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: darkMode ? '#999' : '#999',
                    opacity: 1,
                  },
                }}
              />
            </Box>
            {(() => {
              const validMembers = teamMembers.filter(
                member => member?.user?.first_name && member?.user?.last_name
              );

              const filteredMembers = validMembers.filter(member => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                const fullName =
                  `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                const email = (member.user?.email || '').toLowerCase();
                const designation = (
                  member.designation?.title || ''
                ).toLowerCase();
                const department = (
                  member.department?.name || ''
                ).toLowerCase();
                return (
                  fullName.includes(query) ||
                  email.includes(query) ||
                  designation.includes(query) ||
                  department.includes(query)
                );
              });

              if (filteredMembers.length === 0) {
                return (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#ccc' : '#666' }}
                    >
                      {searchQuery ? 'No members found' : lang.noMembers}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List
                  sx={{
                    p: 0,
                    maxHeight: '320px',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#bdbdbd',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#9e9e9e',
                      },
                    },
                    // Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#bdbdbd transparent',
                  }}
                >
                  {filteredMembers.map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        borderBottom: `2px solid ${darkMode ? '#888888' : '#888888'}`,
                        py: 1.5,
                        px: 2,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
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
                              mb: 0.25,
                            }}
                          >
                            {member.user?.first_name} {member.user?.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='body2'
                              sx={{
                                color: darkMode ? '#999' : '#666',
                                mb: 0.75,
                                fontSize: '0.875rem',
                              }}
                            >
                              {member.user?.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                mt: 0.5,
                              }}
                            >
                              {member.department?.name && (
                                <Chip
                                  label={member.department.name}
                                  size='small'
                                  sx={{
                                    backgroundColor: '#e0e0e0',
                                    color: '#666',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400,
                                  }}
                                />
                              )}
                              {member.designation?.title && (
                                <Chip
                                  label={member.designation.title}
                                  size='small'
                                  sx={{
                                    backgroundColor: '#6054f4',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })()}
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

    const displayMembers = validMembers.slice(0, 2);
    const remainingCount = validMembers.length - 2;
    const totalCount = validMembers.length;

    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: { xs: 'none', md: 'flex' }, borderRadius: '16px' }}
        >
          {displayMembers
            .map(member => renderAdminAvatar(member))
            .filter(Boolean)}

          {remainingCount > 0 && (
            <Tooltip
              title={lang.viewAllTeamMembers.replace(
                '{count}',
                String(totalCount)
              )}
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
          maxWidth='xs'
          PaperProps={{
            sx: {
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              color: darkMode ? '#fff' : '#000',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '420px',
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '24px !important',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              // borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
              pb: 2,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {lang.allTeamMembers}{' '}
              <Box component='span' sx={{ color: '#878787' }}>
                (
                {(() => {
                  const validMembers = adminTeamMembers.filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  );
                  const filteredMembers = validMembers.filter(member => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const fullName =
                      `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                    const email = (member.user?.email || '').toLowerCase();
                    const designation = (
                      member.designation?.title || ''
                    ).toLowerCase();
                    const department = (
                      member.department?.name || ''
                    ).toLowerCase();
                    const teamName = (member.team?.name || '').toLowerCase();
                    return (
                      fullName.includes(query) ||
                      email.includes(query) ||
                      designation.includes(query) ||
                      department.includes(query) ||
                      teamName.includes(query)
                    );
                  });
                  return filteredMembers.length;
                })()}
                )
              </Box>
            </Typography>
            <IconButton
              onClick={() => {
                setShowAllMembersDialog(false);
                setSearchQuery('');
              }}
              sx={{ color: darkMode ? '#ccc' : '#666' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              p: 0,
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <Box
              sx={{
                p: 2,
              }}
            >
              <TextField
                fullWidth
                size='small'
                placeholder={lang.searchMember}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon sx={{ color: darkMode ? '#999' : '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: darkMode ? '#2d2d2d' : '#f8f8f8',
                    color: darkMode ? '#fff' : '#000',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: darkMode ? '#555' : '#bdbdbd',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? '#777' : '#ccc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#484c7f',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: darkMode ? '#999' : '#999',
                    opacity: 1,
                  },
                }}
              />
            </Box>
            {(() => {
              const validMembers = adminTeamMembers.filter(
                member => member?.user?.first_name && member?.user?.last_name
              );

              const filteredMembers = validMembers.filter(member => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                const fullName =
                  `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                const email = (member.user?.email || '').toLowerCase();
                const designation = (
                  member.designation?.title || ''
                ).toLowerCase();
                const department = (
                  member.department?.name || ''
                ).toLowerCase();
                const teamName = (member.team?.name || '').toLowerCase();
                return (
                  fullName.includes(query) ||
                  email.includes(query) ||
                  designation.includes(query) ||
                  department.includes(query) ||
                  teamName.includes(query)
                );
              });

              if (filteredMembers.length === 0) {
                return (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#ccc' : '#666' }}
                    >
                      {searchQuery ? 'No members found' : lang.noMembers}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List
                  sx={{
                    p: 0,
                    maxHeight: '320px',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#bdbdbd',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#9e9e9e',
                      },
                    },
                    // Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#bdbdbd transparent',
                  }}
                >
                  {filteredMembers.map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        borderBottom: `1px solid ${darkMode ? '#444' : '#dcdcdc'}`,
                        py: 1.5,
                        px: 2,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
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
                              mb: 0.25,
                            }}
                          >
                            {member.user?.first_name} {member.user?.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='body2'
                              sx={{
                                color: darkMode ? '#999' : '#666',
                                mb: 0.75,
                                fontSize: '0.875rem',
                              }}
                            >
                              {member.user?.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                mt: 0.5,
                              }}
                            >
                              {member.department?.name && (
                                <Chip
                                  label={member.department.name}
                                  size='small'
                                  sx={{
                                    backgroundColor: '#e0e0e0',
                                    color: '#666',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400,
                                  }}
                                />
                              )}
                              {member.designation?.title && (
                                <Chip
                                  label={member.designation.title}
                                  size='small'
                                  sx={{
                                    backgroundColor: '#9c27b0',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400,
                                  }}
                                />
                              )}
                              {member.team?.name && (
                                <Chip
                                  label={member.team.name}
                                  size='small'
                                  sx={{
                                    backgroundColor: '#008b95',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 400,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })()}
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
