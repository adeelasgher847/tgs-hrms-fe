import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import UserAvatar from '../common/UserAvatar';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { useLanguage } from '../../context/LanguageContext';

interface TeamMembersModalProps {
  open: boolean;
  onClose: () => void;
  onOpenInviteModal: () => void;
  darkMode?: boolean;
}

const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  open,
  onClose,
  onOpenInviteModal,
  darkMode = false,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Team Members',
      noMembers: 'No team members found',
      addMember: 'Add Member',
      loading: 'Loading team members...',
      error: 'Failed to load team members',
    },
    ar: {
      title: 'أعضاء الفريق',
      noMembers: 'لا يوجد أعضاء في الفريق',
      addMember: 'إضافة عضو',
      loading: 'جاري تحميل الأعضاء...',
      error: 'فشل في تحميل الأعضاء',
    },
  };

  const lang = labels[language];

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamApiService.getMyTeamMembers(1);
        setTeamMembers(response.items || []);
      } catch (_err) {
        setError(lang.error);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadTeamMembers();
    }
  }, [open, lang.error]);

  const handleAddMember = () => {
    onClose();
    onOpenInviteModal();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
          color: darkMode ? '#fff' : '#000',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon sx={{ color: darkMode ? '#ccc' : '#666' }} />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {lang.title} ({teamMembers.length})
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: darkMode ? '#ccc' : '#666' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography
              variant='body2'
              sx={{ mt: 1, color: darkMode ? '#ccc' : '#666' }}
            >
              {lang.loading}
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity='error'>{error}</Alert>
          </Box>
        ) : teamMembers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <GroupIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography
              variant='body2'
              sx={{ color: darkMode ? '#ccc' : '#666', mb: 2 }}
            >
              {lang.noMembers}
            </Typography>
            <IconButton
              onClick={handleAddMember}
              sx={{
                color: 'white',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {teamMembers
                .filter(
                  member => member?.user?.first_name && member?.user?.last_name
                )
                .map((member, _index) => (
                  <React.Fragment key={member.id}>
                    <ListItem
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
                  </React.Fragment>
                ))}
            </List>
            <Divider sx={{ my: 1 }} />
            {/* <Box sx={{ p: 2, textAlign: 'center' }}>
              <IconButton
                onClick={handleAddMember}
                sx={{
                  backgroundColor: '#484c7f',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#3a3f5f',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant='body2'
                sx={{ mt: 1, color: darkMode ? '#ccc' : '#666' }}
              >
                {lang.addMember}
              </Typography>
            </Box> */}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamMembersModal;
