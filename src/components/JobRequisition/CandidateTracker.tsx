import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Grid,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActionArea,
  InputAdornment,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { AppOutletContext } from '../../types/outletContexts';
import candidateApiService, {
  type UpdateApplicationStageDto,
} from '../../api/candidateApi';
import type { Application, Candidate, CandidateStage } from '../../types/candidate';
import { extractErrorMessage } from '../../utils/errorHandler';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import { useLanguage } from '../../hooks/useLanguage';
import jobRequisitionApiService, { type JobRequisition } from '../../api/jobRequisitionApi';
import { jobRequisitionMockData } from '../../Data/jobRequisitionMockData';
import {
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

const stageOrder: CandidateStage[] = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewed',
  'Technical Round',
  'HR Round',
  'Offered',
  'Hired',
  'Rejected',
  'Withdrawn',
];

const stageColors: Record<CandidateStage, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'Applied': 'info',
  'Screening': 'info',
  'Shortlisted': 'primary',
  'Interview Scheduled': 'warning',
  'Interviewed': 'secondary',
  'Technical Round': 'warning',
  'HR Round': 'success',
  'Offered': 'success',
  'Hired': 'success',
  'Rejected': 'error',
  'Withdrawn': 'error',
};

const buttonColors: Record<CandidateStage, 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'Applied': 'inherit',
  'Screening': 'info',
  'Shortlisted': 'primary',
  'Interview Scheduled': 'warning',
  'Interviewed': 'secondary',
  'Technical Round': 'warning',
  'HR Round': 'info',
  'Offered': 'success',
  'Hired': 'success',
  'Rejected': 'error',
  'Withdrawn': 'error',
};

const labels = {
  en: {
    title: 'Candidate Tracker',
    noCandidates: 'No candidates in this stage',
    updateStage: 'Update Stage',
    comments: 'Comments',
    rating: 'Rating',
    cancel: 'Cancel',
    update: 'Update',
    actions: 'Actions',
    viewProfile: 'View Profile',
    view: 'View',
    sendEmail: 'Send Email',
    call: 'Call',
    linkedin: 'LinkedIn',
    portfolio: 'Portfolio',
  },
  ar: {
    title: 'متتبع المرشحين',
    noCandidates: 'لا يوجد مرشحون في هذه المرحلة',
    updateStage: 'تحديث المرحلة',
    comments: 'تعليقات',
    rating: 'التقييم',
    cancel: 'إلغاء',
    update: 'تحديث',
    actions: 'الإجراءات',
    viewProfile: 'عرض الملف الشخصي',
    view: 'عرض',
    sendEmail: 'إرسال بريد إلكتروني',
    call: 'اتصال',
    linkedin: 'لينكد إن',
    portfolio: 'المحفظة',
  },
};

interface CandidateTrackerProps {
  jobRequisitionId?: string;
  onJobSelect?: (jobId: string) => void;
  onBack?: () => void;
}

interface SelectedApplication {
  application: Application | null;
}

const CandidateTracker: React.FC<CandidateTrackerProps> = ({ jobRequisitionId, onJobSelect, onBack }) => {
  const theme = useTheme();
  const { language } = useLanguage();
  const lang = labels[language];
  const { darkMode } = useOutletContext<AppOutletContext>();
  const queryClient = useQueryClient();
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobRequisitionId || '');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewCandidateDialog, setViewCandidateDialog] = useState<{
    open: boolean;
    application: Application | null;
  }>({
    open: false,
    application: null,
  });

  // Fetch jobs for selector
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-for-candidates'],
    queryFn: async () => {
      try {
        const response = await jobRequisitionApiService.getRequisitions(1, 100);
        return response.data || jobRequisitionMockData;
      } catch {
        return jobRequisitionMockData;
      }
    },
  });

  // Update selected job when prop changes
  useEffect(() => {
    if (jobRequisitionId) {
      setSelectedJobId(jobRequisitionId);
    }
  }, [jobRequisitionId]);

  // Set default job if none selected
  useEffect(() => {
    if (!selectedJobId && jobs && jobs.length > 0) {
      const firstJobId = jobs[0].id;
      setSelectedJobId(firstJobId);
      onJobSelect?.(firstJobId);
    }
  }, [jobs, selectedJobId, onJobSelect]);

  const effectiveJobId = selectedJobId || jobRequisitionId;
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [stageUpdateDialog, setStageUpdateDialog] = useState<{
    open: boolean;
    application: Application | null;
    newStage: CandidateStage | null;
  }>({
    open: false,
    application: null,
    newStage: null,
  });
  const [updateForm, setUpdateForm] = useState({
    comments: '',
    rating: 0,
  });
  const [activeTab, setActiveTab] = useState('Applied');
  const [showAll, setShowAll] = useState(false);

  const [offerLetterDialog, setOfferLetterDialog] = useState<{
    open: boolean;
    application: Application | null;
    candidate: Candidate | null;
    activeStep: number;
    selectedTemplate: string | null;
    offerDetails: {
      baseSalary: string;
      joiningDate: string;
      expirationDate: string;
      bonus: string;
      stockOptions: string;
      probationPeriod: string;
    };
  }>({
    open: false,
    application: null,
    candidate: null,
    activeStep: 0,
    selectedTemplate: 'Professional',
    offerDetails: {
      baseSalary: '5000',
      joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bonus: '0',
      stockOptions: '0',
      probationPeriod: '3 months',
    },
  });

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications', effectiveJobId],
    queryFn: () => candidateApiService.getApplicationsMock(effectiveJobId),
    enabled: !!effectiveJobId,
  });

  // Fetch candidates
  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidateApiService.getCandidatesMock(),
  });

  // Create candidates map for quick lookup
  const candidatesMap = useMemo(() => {
    return candidates.reduce((acc, candidate) => {
      acc[candidate.id] = candidate;
      return acc;
    }, {} as Record<string, Candidate>);
  }, [candidates]);

  // Group applications by stage
  const applicationsByStage = useMemo(() => {
    const grouped: Record<CandidateStage, Application[]> = {} as Record<CandidateStage, Application[]>;
    stageOrder.forEach(stage => {
      grouped[stage] = [];
    });

    applications.forEach(app => {
      if (grouped[app.currentStage]) {
        grouped[app.currentStage].push(app);
      }
    });

    return grouped;
  }, [applications]);

  // Filter stages based on active tab
  const filteredStages = useMemo(() => {
    if (activeTab === 'All') return stageOrder;
    return [activeTab as CandidateStage];
  }, [activeTab]);

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationStageDto }) =>
      candidateApiService.updateApplicationStageMock(id, data),
    onMutate: async (newUpdate) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['applications', effectiveJobId] });

      // Snapshot the previous value
      const previousApplications = queryClient.getQueryData<Application[]>(['applications', effectiveJobId]);

      // Optimistically update to the new value
      if (previousApplications) {
        queryClient.setQueryData<Application[]>(['applications', effectiveJobId], (old) => {
          return old?.map(app =>
            app.id === newUpdate.id
              ? { ...app, currentStage: newUpdate.data.stage, updatedAt: new Date().toISOString() }
              : app
          );
        });
      }

      return { previousApplications };
    },
    onSuccess: () => {
      showSuccess('Stage updated successfully');
      setStageUpdateDialog({ open: false, application: null, newStage: null });
      setUpdateForm({ comments: '', rating: 0 });
    },
    onError: (error, _variables, context) => {
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications', effectiveJobId], context.previousApplications);
      }
      showError(extractErrorMessage(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', effectiveJobId] });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, application: Application) => {
    setMenuAnchor(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedApplication(null);
  };

  const handleStageUpdate = (application: Application, newStage: CandidateStage) => {
    setStageUpdateDialog({ open: true, application, newStage });
    setUpdateForm({ comments: '', rating: 0 });
  };

  const handleStageUpdateConfirm = () => {
    if (!stageUpdateDialog.application || !stageUpdateDialog.newStage) return;

    updateStageMutation.mutate({
      id: stageUpdateDialog.application.id,
      data: {
        stage: stageUpdateDialog.newStage,
        comments: updateForm.comments || undefined,
        rating: updateForm.rating || undefined,
      },
    });
  };

  const handleAction = (action: string) => {
    if (!selectedApplication) return;

    const candidate = candidatesMap[selectedApplication.candidateId];
    if (!candidate) return;

    switch (action) {
      case 'email':
        window.open(`mailto:${candidate.email}`, '_blank');
        break;
      case 'call':
        if (candidate.phone) {
          window.open(`tel:${candidate.phone}`, '_blank');
        }
        break;
      case 'linkedin':
        if (candidate.linkedinUrl) {
          window.open(candidate.linkedinUrl, '_blank');
        }
        break;
      case 'portfolio':
        if (candidate.portfolioUrl) {
          window.open(candidate.portfolioUrl, '_blank');
        }
        break;
    }
    handleMenuClose();
  };

  if (applicationsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1400, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onBack && <AppButton onClick={onBack} variant="outlined">Back</AppButton>}
            <AppPageTitle sx={{ color: theme.palette.text.primary, mb: 0 }}>
              {lang.title}
            </AppPageTitle>
          </Box>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 350 }, maxWidth: { sm: 500 } }}>
            <InputLabel>Select Job Requisition</InputLabel>
            <Select
              value={selectedJobId}
              onChange={(e) => {
                const jobId = e.target.value;
                setSelectedJobId(jobId);
                onJobSelect?.(jobId);
              }}
              label="Select Job Requisition"
            >
              {jobs.map((job) => (
                <MenuItem key={job.id} value={job.id}>
                  {job.jobTitle} - {job.department?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 4,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTabs-scrollButtons': { display: { xs: 'inline-flex', md: 'none' } }
          }}
        >
          <Tab value="Applied" label="Applied" />
          <Tab value="Screening" label="Screening" />
          <Tab value="Shortlisted" label="Shortlisted" />
          <Tab value="Interview Scheduled" label="Interview Scheduled" />
          <Tab value="Interviewed" label="Interviews" />
          <Tab value="Technical Round" label="Technical Round" />
          <Tab value="HR Round" label="HR Round" />
          <Tab value="Offered" label="Offered" />
          <Tab value="Hired" label="Hired" />
          <Tab value="Rejected" label="Rejected" />
          <Tab value="Withdrawn" label="Withdrawn" />
        </Tabs>

        {!effectiveJobId || jobsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading candidates...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {filteredStages.map((stage) => {
                const stageApplications = applicationsByStage[stage] || [];
                const displayedApplications = showAll ? stageApplications : stageApplications.slice(0, 9);

                if (stageApplications.length === 0) {
                  return (
                    <Box key={stage} sx={{ gridColumn: '1 / -1', py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        {lang.noCandidates} for {stage}
                      </Typography>
                    </Box>
                  );
                }

                return displayedApplications.map((application) => {
                  const candidate = candidatesMap[application.candidateId];
                  if (!candidate) return null;

                  const stageColor = stageColors[application.currentStage];
                  const paletteColor = theme.palette[stageColor === 'default' ? 'grey' : stageColor];
                  const stageHex = 'main' in paletteColor ? paletteColor.main : (paletteColor as any)[500];

                  return (
                    <Paper
                      key={application.id}
                      sx={{
                        p: { xs: 2.5, sm: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        boxShadow: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: `0 20px 25px -5px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                          borderColor: stageHex,
                          backgroundColor: theme.palette.background.paper,
                        },
                      }}
                      onClick={() => {
                        setSelectedApplication(application);
                        setViewCandidateDialog({ open: true, application });
                      }}
                    >
                      {/* Card Header: Avatar & Name */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
                        <Avatar
                          sx={{
                            width: { xs: 48, sm: 64 },
                            height: { xs: 48, sm: 64 },
                            bgcolor: stageHex,
                            color: theme.palette.getContrastText(stageHex),
                            fontSize: { xs: '1.2rem', sm: '1.6rem' },
                            fontWeight: 'bold',
                            boxShadow: `0 8px 16px -4px ${stageHex}40`
                          }}
                        >
                          {candidate.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 0, sm: 0.5 } }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontSize: { xs: '1rem', sm: '1.15rem' },
                              fontWeight: 800,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                              color: theme.palette.text.primary,
                              mb: 0.5
                            }}
                          >
                            {candidate.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            {candidate.email}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, application);
                          }}
                          sx={{ mt: -0.5, mr: -1 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Card Body: Info & Tags */}
                      <Box sx={{ mb: 3, flex: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <Chip
                            label={candidate.experience}
                            size="medium"
                            variant="filled"
                            sx={{
                              fontWeight: 600,
                              bgcolor: theme.palette.action.selected,
                              color: theme.palette.text.primary
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {candidate.location}
                          </Typography>
                        </Stack>

                        {candidate.currentCompany && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                              Current Company
                            </Typography>
                            <Typography
                              variant="body1"
                              color="primary.main"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.95rem'
                              }}
                            >
                              {candidate.currentCompany}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Divider sx={{ mb: 2.5, opacity: 0.8 }} />

                      {/* Card Footer: Rating & Stage */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {application.rating ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                bgcolor: theme.palette.warning.light,
                                color: theme.palette.warning.dark,
                                px: 1,
                                py: 0.25,
                                borderRadius: 1.5,
                                fontWeight: 'bold'
                              }}
                            >
                              <StarIcon sx={{ fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {application.rating}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.5 }}>
                              <StarIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontWeight: 600 }}>Unrated</Typography>
                            </Box>
                          )}
                        </Box>

                        <Chip
                          label={stage}
                          size="medium"
                          color={stageColors[stage]}
                          sx={{
                            fontWeight: 700,
                            px: 1,
                            height: 28,
                            boxShadow: `0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
                          }}
                        />
                      </Box>
                    </Paper>
                  );
                });
              })}
            </Box>

            {filteredStages.some(stage => (applicationsByStage[stage]?.length || 0) > 9) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 3 }}>
                <AppButton
                  variant="outlined"
                  variantType="primary"
                  onClick={() => setShowAll(!showAll)}
                  text={showAll ? 'Show Less' : 'View All Candidates'}
                  sx={{ px: 4 }}
                />
              </Box>
            )}
          </Box>
        )}
        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedApplication) {
              setViewCandidateDialog({ open: true, application: selectedApplication });
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.view}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('email')}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{lang.sendEmail}</ListItemText>
          </MenuItem>
          {selectedApplication && candidatesMap[selectedApplication.candidateId]?.phone && (
            <MenuItem onClick={() => handleAction('call')}>
              <ListItemIcon>
                <PhoneIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{lang.call}</ListItemText>
            </MenuItem>
          )}
          {selectedApplication && candidatesMap[selectedApplication.candidateId]?.linkedinUrl && (
            <MenuItem onClick={() => handleAction('linkedin')}>
              <ListItemIcon>
                <LinkedInIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{lang.linkedin}</ListItemText>
            </MenuItem>
          )}
          {selectedApplication && candidatesMap[selectedApplication.candidateId]?.portfolioUrl && (
            <MenuItem onClick={() => handleAction('portfolio')}>
              <ListItemIcon>
                <WebsiteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{lang.portfolio}</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Stage Update Dialog */}
        <Dialog
          open={stageUpdateDialog.open}
          onClose={() => setStageUpdateDialog({ open: false, application: null, newStage: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{lang.updateStage}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Select New Stage
              </Typography>
              <Tabs
                value={stageUpdateDialog.newStage || ''}
                onChange={(_, newValue) => setStageUpdateDialog(prev => ({ ...prev, newStage: newValue }))}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 3,
                  '& .MuiTabs-scrollButtons': { display: 'inline-flex' }
                }}
              >
                {stageOrder.map((stage) => (
                  <Tab
                    key={stage}
                    value={stage}
                    label={stage === 'Interviewed' ? 'Interviews' : stage}
                    sx={{ minWidth: 100 }}
                  />
                ))}
              </Tabs>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={lang.comments}
                value={updateForm.comments}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, comments: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{lang.rating}:</Typography>
                <Rating
                  value={updateForm.rating}
                  onChange={(_, value) => setUpdateForm(prev => ({ ...prev, rating: value || 0 }))}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStageUpdateDialog({ open: false, application: null, newStage: null })}>
              {lang.cancel}
            </Button>
            <AppButton
              onClick={handleStageUpdateConfirm}
              loading={updateStageMutation.isPending}
            >
              {lang.update}
            </AppButton>
          </DialogActions>
        </Dialog>

        {/* Candidate View Dialog */}
        <Dialog
          open={viewCandidateDialog.open}
          onClose={() => setViewCandidateDialog({ open: false, application: null })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: '20px', sm: '30px' },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 3, sm: 4 },
            pt: { xs: 3, sm: 4 }
          }}>
            <Typography variant="h5" fontWeight="bold">Candidate Details</Typography>
            {viewCandidateDialog.application && (
              <Chip
                label={viewCandidateDialog.application.currentStage}
                color={stageColors[viewCandidateDialog.application.currentStage]}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              px: { xs: 3, sm: 4 },
              py: 3,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {viewCandidateDialog.application && candidatesMap[viewCandidateDialog.application.candidateId] && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Basic Info */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 3 },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Avatar sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    flexShrink: 0
                  }}>
                    {candidatesMap[viewCandidateDialog.application.candidateId].name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {candidatesMap[viewCandidateDialog.application.candidateId].name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {candidatesMap[viewCandidateDialog.application.candidateId].experience} • {candidatesMap[viewCandidateDialog.application.candidateId].location}
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 2 },
                      mt: 1,
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{candidatesMap[viewCandidateDialog.application.candidateId].email}</Typography>
                      </Box>
                      {candidatesMap[viewCandidateDialog.application.candidateId].phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{candidatesMap[viewCandidateDialog.application.candidateId].phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Profile Summary / Cover Letter */}
                {candidatesMap[viewCandidateDialog.application.candidateId].profileSummary && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>Profile Summary</Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {candidatesMap[viewCandidateDialog.application.candidateId].profileSummary}
                      </Typography>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Professional Details */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Current Role</Typography>
                    <Typography variant="body1">
                      {candidatesMap[viewCandidateDialog.application.candidateId].currentCompany || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Skills</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {candidatesMap[viewCandidateDialog.application.candidateId].skills.map((skill: string) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                </Grid>

                <Divider />

                {/* Resume Section */}
                {viewCandidateDialog.application && candidatesMap[viewCandidateDialog.application.candidateId]?.resumeUrl && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Resume</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        const resumeUrl = viewCandidateDialog.application ? candidatesMap[viewCandidateDialog.application.candidateId]?.resumeUrl : null;
                        if (resumeUrl) window.open(resumeUrl, '_blank');
                      }}
                    >
                      View Resume
                    </Button>
                  </Box>
                )}

                <Divider />

                {/* Application Details */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Application Summary</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.action.hover }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Applied Date</Typography>
                        <Typography variant="body2">
                          {viewCandidateDialog.application && new Date(viewCandidateDialog.application.id.includes('-') ? Date.now() : parseInt(viewCandidateDialog.application.appliedAt)).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Current Stage</Typography>
                        <Typography variant="body2">{viewCandidateDialog.application?.currentStage}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Rating</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={viewCandidateDialog.application?.rating || 0} readOnly size="small" />
                        </Box>
                      </Grid>
                    </Grid>
                    {viewCandidateDialog.application?.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Latest Notes</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          "{viewCandidateDialog.application.notes}"
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: { xs: 3, sm: 4 }, py: 2, gap: 1 }}>
            <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {viewCandidateDialog.application && candidatesMap[viewCandidateDialog.application.candidateId].linkedinUrl && (
                <Tooltip title="LinkedIn">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const candidateId = viewCandidateDialog.application?.candidateId;
                      if (candidateId) window.open(candidatesMap[candidateId].linkedinUrl, '_blank');
                    }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                </Tooltip>
              )}
              {viewCandidateDialog.application && candidatesMap[viewCandidateDialog.application.candidateId].portfolioUrl && (
                <Tooltip title="Portfolio">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const candidateId = viewCandidateDialog.application?.candidateId;
                      if (candidateId) window.open(candidatesMap[candidateId].portfolioUrl, '_blank');
                    }}
                  >
                    <WebsiteIcon />
                  </IconButton>
                </Tooltip>
              )}
              {viewCandidateDialog.application && candidatesMap[viewCandidateDialog.application.candidateId].websiteUrl && (
                <Tooltip title="Website">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const candidateId = viewCandidateDialog.application?.candidateId;
                      if (candidateId) window.open(candidatesMap[candidateId].websiteUrl, '_blank');
                    }}
                  >
                    <WebsiteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {viewCandidateDialog.application && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="status-select-label">Update Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={viewCandidateDialog.application.currentStage}
                    label="Update Status"
                    onChange={(e) => {
                      const newStage = e.target.value as CandidateStage;
                      if (viewCandidateDialog.application) {
                        updateStageMutation.mutate({
                          id: viewCandidateDialog.application.id,
                          data: { stage: newStage }
                        });
                        // Update local state to reflect change immediately if mutation succeeds
                        setViewCandidateDialog(prev => ({
                          ...prev,
                          application: prev.application ? { ...prev.application, currentStage: newStage } : null
                        }));
                      }
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    {[
                      'Applied',
                      'Screening',
                      'Shortlisted',
                      'Interview Scheduled',
                      'Interviewed',
                      'Technical Round',
                      'HR Round',
                      'Offered',
                      'Hired'
                    ].map((stage) => (
                      <MenuItem key={stage} value={stage}>
                        {stage === 'Interviewed' ? 'Interview' : stage}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {viewCandidateDialog.application?.currentStage === 'Hired' && (
                <Button
                  onClick={() => {
                    const app = viewCandidateDialog.application;
                    if (app) {
                      setOfferLetterDialog(prev => ({
                        ...prev,
                        open: true,
                        application: app,
                        candidate: candidatesMap[app.candidateId],
                        activeStep: 0
                      }));
                    }
                  }}
                  variant="outlined"
                  color="success"
                  startIcon={<DescriptionIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Generate Offer Letter
                </Button>
              )}
              <Button
                onClick={() => setViewCandidateDialog({ open: false, application: null })}
                variant="contained"
                sx={{ px: 4, borderRadius: 2 }}
              >
                Close
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Offer Letter Workflow Dialog */}
        <Dialog
          open={offerLetterDialog.open}
          onClose={() => setOfferLetterDialog(prev => ({ ...prev, open: false }))}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, height: '80vh' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            Generate Offer Letter - {offerLetterDialog.candidate?.name}
            <Stepper activeStep={offerLetterDialog.activeStep} sx={{ mt: 3, mb: 2 }}>
              {['Template', 'Details', 'Preview'].map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ p: 4, overflowY: 'auto' }}>
            {offerLetterDialog.activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Select a Template</Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {['Professional', 'Casual', 'Executive'].map((template) => (
                    <Grid item xs={12} sm={4} key={template}>
                      <Card
                        sx={{
                          height: '100%',
                          border: `2px solid ${offerLetterDialog.selectedTemplate === template ? theme.palette.primary.main : 'transparent'}`,
                          boxShadow: offerLetterDialog.selectedTemplate === template ? theme.shadows[4] : theme.shadows[1],
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: theme.shadows[3],
                            transform: offerLetterDialog.selectedTemplate === template ? 'none' : 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardActionArea
                          onClick={() => setOfferLetterDialog(prev => ({ ...prev, selectedTemplate: template }))}
                          sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                        >
                          <DescriptionIcon sx={{ fontSize: 48, color: offerLetterDialog.selectedTemplate === template ? 'primary.main' : 'text.secondary', mb: 2 }} />
                          <Typography variant="subtitle1" fontWeight="bold">{template}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template === 'Professional' && 'Standard corporate formal style.'}
                            {template === 'Casual' && 'Friendly and welcoming for startups.'}
                            {template === 'Executive' && 'High-level, detailed for leadership.'}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {offerLetterDialog.activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Offer Details</Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Base Salary (Monthly)"
                      type="number"
                      value={offerLetterDialog.offerDetails.baseSalary}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, baseSalary: e.target.value } }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Joining Date"
                      type="date"
                      value={offerLetterDialog.offerDetails.joiningDate}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, joiningDate: e.target.value } }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Offer Expiration Date"
                      type="date"
                      value={offerLetterDialog.offerDetails.expirationDate}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, expirationDate: e.target.value } }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Probation Period"
                      value={offerLetterDialog.offerDetails.probationPeriod}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, probationPeriod: e.target.value } }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Joining Bonus"
                      type="number"
                      value={offerLetterDialog.offerDetails.bonus}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, bonus: e.target.value } }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stock Options"
                      type="number"
                      value={offerLetterDialog.offerDetails.stockOptions}
                      onChange={(e) => setOfferLetterDialog(prev => ({ ...prev, offerDetails: { ...prev.offerDetails, stockOptions: e.target.value } }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {offerLetterDialog.activeStep === 2 && (
              <Box sx={{ bgcolor: darkMode ? 'grey.900' : 'grey.50', p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Paper sx={{ p: 6, mx: 'auto', maxWidth: '600px', minHeight: '400px', boxShadow: 3 }}>
                  <Typography variant="h5" align="center" sx={{ mb: 4, fontWeight: 'bold' }}>OFFER LETTER</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>Date: {new Date().toLocaleDateString()}</Typography>
                  <Typography variant="body1" sx={{ mb: 4 }}>
                    To,<br />
                    <strong>{offerLetterDialog.candidate?.name}</strong><br />
                    {offerLetterDialog.candidate?.location}
                  </Typography>

                  <Typography variant="body1" paragraph>
                    {offerLetterDialog.selectedTemplate === 'Casual' ? "Hey! We're super excited to have you join our team." : "We are pleased to offer you the position as per our recent discussions."}
                  </Typography>

                  <Typography variant="body1" paragraph>
                    Your monthly base salary will be <strong>${offerLetterDialog.offerDetails.baseSalary}</strong>.
                    {parseFloat(offerLetterDialog.offerDetails.bonus) > 0 && ` Additionally, you will receive a joining bonus of $${offerLetterDialog.offerDetails.bonus}.`}
                  </Typography>

                  <Typography variant="body1" paragraph>
                    Your joining date is scheduled for <strong>{offerLetterDialog.offerDetails.joiningDate}</strong>.
                    The probation period will be <strong>{offerLetterDialog.offerDetails.probationPeriod}</strong>.
                  </Typography>

                  <Typography variant="body1" sx={{ mt: 6 }}>
                    Sincerely,<br />
                    <strong>HR Department</strong><br />
                    TechCorp HRMS
                  </Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 3 }}>
            <Button
              disabled={offerLetterDialog.activeStep === 0}
              onClick={() => setOfferLetterDialog(prev => ({ ...prev, activeStep: prev.activeStep - 1 }))}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {offerLetterDialog.activeStep < 2 ? (
              <Button
                variant="contained"
                onClick={() => setOfferLetterDialog(prev => ({ ...prev, activeStep: prev.activeStep + 1 }))}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  showSuccess('Offer letter has been successfully generated!');
                  setOfferLetterDialog(prev => ({ ...prev, open: false }));
                }}
              >
                Generate & Send
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <ErrorSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </Box >
  );
};

export default CandidateTracker;