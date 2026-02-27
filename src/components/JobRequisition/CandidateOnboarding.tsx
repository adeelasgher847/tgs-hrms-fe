import React, { useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Chip,
    Divider,
    Fade,
    Skeleton,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    MenuItem,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Tabs,
    Tab,
    LinearProgress,
    Stack,
    TextField,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { onboardingTemplatesMock, activeOnboardingsMock } from '../../Data/onboardingMockData';
import type { EmployeeOnboarding, OnboardingTemplate, OnboardingTask, OnboardingTaskStatus } from '../../types/onboarding';
import { candidateApiService } from '../../api/candidateApi';
import employeeApiService from '../../api/employeeApi';
import type { Application, Candidate } from '../../types/candidate';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppPageTitle from '../common/AppPageTitle';
import { useLanguage } from '../../hooks/useLanguage';
import { designationApiService } from '../../api/designationApi';
import AppTable from '../common/AppTable';
import AppFormModal from '../common/AppFormModal';
import AppButton from '../common/AppButton';
import AppInputField from '../common/AppInputField';

const CandidateOnboarding: React.FC = () => {
    const queryClient = useQueryClient();
    const { language } = useLanguage();
    const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

    const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [currentTab, setCurrentTab] = useState(0);

    // View Modal State
    const [viewOnboardingOpen, setViewOnboardingOpen] = useState(false);
    const [selectedOnboarding, setSelectedOnboarding] = useState<EmployeeOnboarding | null>(null);

    // Create Template State
    const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
    const [templateTasks, setTemplateTasks] = useState<Array<{ title: string; description: string }>>([
        { title: '', description: '' }
    ]);

    // Template Management State
    const [templates, setTemplates] = useState<OnboardingTemplate[]>(onboardingTemplatesMock);
    const [activeOnboardings, setActiveOnboardings] = useState<EmployeeOnboarding[]>(activeOnboardingsMock);

    // Fetch applications in 'Hired' stage
    const { data: applications = [], isLoading: appsLoading } = useQuery({
        queryKey: ['hired-applications'],
        queryFn: async () => {
            const apps = await candidateApiService.getApplicationsMock();
            return apps.filter(app => app.currentStage === 'Hired');
        },
    });

    // Fetch candidates for details
    const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
        queryKey: ['all-candidates'],
        queryFn: () => candidateApiService.getCandidatesMock(),
    });

    const candidatesMap = React.useMemo(() => {
        return candidates.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
        }, {} as Record<string, Candidate>);
    }, [candidates]);

    // Handle Onboarding Flow
    const handleInitiateOnboarding = (app: Application) => {
        setSelectedApplication(app);
        setOnboardingDialogOpen(true);
    };

    const handleViewOnboarding = (onb: EmployeeOnboarding) => {
        setSelectedOnboarding(onb);
        setViewOnboardingOpen(true);
    };

    const handleCreateTemplate = () => {
        if (!newTemplate.name || templateTasks.some(t => !t.title)) {
            showError('Please provide a name and at least one task title.');
            return;
        }

        const tpl: OnboardingTemplate = {
            id: `TPL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            name: newTemplate.name,
            description: newTemplate.description,
            tasks: templateTasks.filter(t => t.title.trim() !== ''),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setTemplates(prev => [tpl, ...prev]);
        setCreateTemplateOpen(false);
        setNewTemplate({ name: '', description: '' });
        setTemplateTasks([{ title: '', description: '' }]);
        showSuccess('Template created successfully!');
    };

    const handleAddTemplateTask = () => {
        setTemplateTasks(prev => [...prev, { title: '', description: '' }]);
    };

    const handleRemoveTemplateTask = (index: number) => {
        setTemplateTasks(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateTemplateTask = (index: number, field: 'title' | 'description', value: string) => {
        setTemplateTasks(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleUpdateTaskStatus = (onboardingId: string, taskId: string, newStatus: OnboardingTaskStatus) => {
        setActiveOnboardings(prev => {
            return prev.map(onb => {
                if (onb.id !== onboardingId) return onb;

                const updatedTasks = onb.tasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus, completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined } : task
                );

                const completedCount = updatedTasks.filter(t => t.status === 'Completed').length;
                const progress = Math.round((completedCount / updatedTasks.length) * 100);

                let overallStatus = onb.status;
                if (progress === 100) overallStatus = 'Completed';
                else if (progress > 0) overallStatus = 'In Progress';
                else overallStatus = 'In Progress'; // Stay in progress if started

                const updatedOnb = { ...onb, tasks: updatedTasks, progress, status: overallStatus as any };

                // Update selected onboarding if modal is open
                if (selectedOnboarding?.id === onboardingId) {
                    setSelectedOnboarding(updatedOnb);
                }

                return updatedOnb;
            });
        });
    };

    const handleCompleteOnboarding = async () => {
        if (!selectedApplication) return;
        const candidate = candidatesMap[selectedApplication.candidateId];
        if (!candidate) return;

        try {
            const desigs = await designationApiService.getAllDesignations();

            const [firstName, ...lastNameParts] = candidate.name.split(' ');
            const lastName = lastNameParts.join(' ') || 'Candidate';

            await employeeApiService.createEmployee({
                first_name: firstName,
                last_name: lastName,
                email: candidate.email,
                phone: candidate.phone || '+1234567890',
                designationId: desigs[0]?.id || 'mock-desig-id',
                gender: 'Other',
                role_name: 'Employee',
            });

            const template = templates[0];
            const newOnboarding: EmployeeOnboarding = {
                id: `ONB-${Math.random().toString(36).substr(2, 9)}`,
                employeeId: `EMP-${Math.random().toString(36).substr(2, 5)}`,
                employeeName: candidate.name,
                templateId: template?.id,
                status: 'In Progress',
                startDate: new Date().toISOString(),
                tasks: template?.tasks.map(t => ({
                    ...t,
                    id: `TSK-${Math.random().toString(36).substr(2, 5)}`,
                    status: 'Pending',
                    assignedToId: 'EMP-001',
                    assignedToName: 'System Admin'
                })) as OnboardingTask[],
                progress: 0
            };

            setActiveOnboardings(prev => [newOnboarding, ...prev]);
            showSuccess(`Successfully started onboarding for ${candidate.name}!`);
            setOnboardingDialogOpen(false);
            setCurrentTab(1);
            queryClient.invalidateQueries({ queryKey: ['hired-applications'] });
        } catch (error) {
            showError('Failed to complete onboarding.');
        }
    };

    if (appsLoading || candidatesLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <AppPageTitle>Employee Onboarding</AppPageTitle>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    <Skeleton width="60%" />
                </Typography>
                <Stack spacing={2}>
                    <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <AppPageTitle>Employee Onboarding</AppPageTitle>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage full employee onboarding lifecycle from hired to fully integrated
            </Typography>

            <Tabs
                value={currentTab}
                onChange={(_e, val) => setCurrentTab(val)}
                variant="scrollable"
                scrollButtons={false}
                allowScrollButtonsMobile
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab icon={<PersonAddIcon />} label="Hired Candidates" iconPosition="start" />
                <Tab icon={<VisibilityIcon />} label="Active Onboardings" iconPosition="start" />
                <Tab icon={<AddIcon />} label="Onboarding Templates" iconPosition="start" />
            </Tabs>

            {/* TAB 0: Hired Candidates */}
            <Fade in={currentTab === 0} timeout={400}>
                <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
                    <AppTable>
                        <TableHead>
                            <TableRow>
                                <TableCell>Candidate</TableCell>
                                <TableCell>Role Applied</TableCell>
                                <TableCell>Hired Date</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {applications.length > 0 ? (
                                applications.map((app) => {
                                    const candidate = candidatesMap[app.candidateId];
                                    return (
                                        <TableRow key={app.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
                                                        {candidate?.name.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {candidate?.name || 'Unknown Candidate'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {candidate?.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>Software Engineer</TableCell>
                                            <TableCell>{new Date(app.updatedAt).toLocaleDateString()}</TableCell>
                                            <TableCell align="center">
                                                <AppButton
                                                    size="small"
                                                    startIcon={<PersonAddIcon />}
                                                    variant="contained"
                                                    variantType="primary"
                                                    onClick={() => handleInitiateOnboarding(app)}
                                                >
                                                    Start Onboarding
                                                </AppButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">No hired candidates pending.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </AppTable>
                </Box>
            </Fade>

            {/* TAB 1: Active Onboardings */}
            <Fade in={currentTab === 1} timeout={400}>
                <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
                    <AppTable>
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Tasks Progress</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activeOnboardings.map((onb) => (
                                <TableRow key={onb.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{onb.employeeName}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={onb.status}
                                            size="small"
                                            color={onb.status === 'Completed' ? 'success' : 'primary'}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 200 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={onb.progress}
                                                    sx={{ height: 10, borderRadius: 5 }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{onb.progress}%</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{new Date(onb.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View Details">
                                            <IconButton size="small" color="primary" onClick={() => handleViewOnboarding(onb)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </AppTable>
                </Box>
            </Fade>

            {/* TAB 2: Onboarding Templates */}
            <Fade in={currentTab === 2} timeout={400}>
                <Box sx={{ display: currentTab === 2 ? 'block' : 'none' }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <AppButton variant="contained" variantType="primary" startIcon={<AddIcon />} onClick={() => setCreateTemplateOpen(true)}>
                            New Template
                        </AppButton>
                    </Box>
                    <Grid container spacing={3}>
                        {templates.map((tpl) => (
                            <Grid size={{ xs: 12, md: 6 }} key={tpl.id}>
                                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700}>{tpl.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '3em' }}>
                                            {tpl.description}
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                            Tasks ({tpl.tasks.length}):
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {tpl.tasks.map((task, idx) => (
                                                <Chip key={idx} label={task.title} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Fade>

            {/* Create Template Modal */}
            <AppFormModal
                open={createTemplateOpen}
                onClose={() => setCreateTemplateOpen(false)}
                onSubmit={handleCreateTemplate}
                title="Create New Onboarding Template"
                submitLabel="Create Template"
                maxWidth="md"
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <AppInputField
                            label="Template Name"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            required
                            placeholder="e.g. Finance Team Onboarding"
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <AppInputField
                            label="Description"
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                            multiline
                            rows={2}
                            placeholder="Briefly describe the purpose of this template"
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={600}>Template Tasks</Typography>
                            <AppButton size="small" startIcon={<AddIcon />} variant="outlined" variantType="primary" onClick={handleAddTemplateTask}>
                                Add Task
                            </AppButton>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                            {templateTasks.map((task, index) => (
                                <Stack key={index} direction="row" spacing={2} sx={{ mb: 2, alignItems: 'flex-start' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <AppInputField
                                            label={`Task ${index + 1} Title`}
                                            value={task.title}
                                            onChange={(e) => handleUpdateTemplateTask(index, 'title', e.target.value)}
                                            placeholder="Task Title"
                                        />
                                        <AppInputField
                                            label="Task Description"
                                            value={task.description}
                                            onChange={(e) => handleUpdateTemplateTask(index, 'description', e.target.value)}
                                            multiline
                                            rows={1}
                                            placeholder="Task Description"
                                            containerSx={{ mt: 1 }}
                                        />
                                    </Box>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveTemplateTask(index)}
                                        sx={{ mt: 4 }}
                                        disabled={templateTasks.length === 1}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </AppFormModal>

            {/* View Onboarding Details Modal */}
            <AppFormModal
                open={viewOnboardingOpen}
                onClose={() => setViewOnboardingOpen(false)}
                title={`Onboarding Details - ${selectedOnboarding?.employeeName}`}
                hideActions
                maxWidth="lg"
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>Overall Progress</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress variant="determinate" value={selectedOnboarding?.progress || 0} sx={{ flexGrow: 1, height: 12, borderRadius: 6 }} />
                        <Typography variant="h6" color="primary.main">{selectedOnboarding?.progress}%</Typography>
                        <Chip
                            label={selectedOnboarding?.status}
                            color={selectedOnboarding?.status === 'Completed' ? 'success' : 'primary'}
                            size="small"
                        />
                    </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>Onboarding Task List</Typography>
                <AppTable>
                    <TableHead>
                        <TableRow>
                            <TableCell>Task Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Assigned To</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedOnboarding?.tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell sx={{ fontWeight: 600 }}>{task.title}</TableCell>
                                <TableCell>
                                    <TextField
                                        select
                                        size="small"
                                        value={task.status}
                                        onChange={(e) => handleUpdateTaskStatus(selectedOnboarding.id, task.id, e.target.value as OnboardingTaskStatus)}
                                        sx={{ minWidth: 120 }}
                                        InputProps={{
                                            sx: {
                                                borderRadius: 2,
                                                fontSize: '0.875rem',
                                                bgcolor: task.status === 'Completed' ? 'success.lighter' : task.status === 'In Progress' ? 'warning.lighter' : 'action.hover'
                                            }
                                        }}
                                    >
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Completed">Completed</MenuItem>
                                        <MenuItem value="Skipped">Skipped</MenuItem>
                                    </TextField>
                                </TableCell>
                                <TableCell>{task.assignedToName}</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{task.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </AppTable>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <AppButton variant="contained" variantType="primary" onClick={() => setViewOnboardingOpen(false)}>
                        Done
                    </AppButton>
                </Box>
            </AppFormModal>

            {/* Assign Template Modal */}
            <AppFormModal
                open={onboardingDialogOpen}
                onClose={() => setOnboardingDialogOpen(false)}
                onSubmit={handleCompleteOnboarding}
                title="Assign Onboarding Template"
                submitLabel="Confirm & Initiate"
            >
                <Typography gutterBottom>
                    Start onboarding for <strong>{selectedApplication && candidatesMap[selectedApplication.candidateId]?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select a template to automatically assign tasks.
                </Typography>
                <AppInputField
                    select
                    label="Select Template"
                    value={templates[0]?.id}
                    onChange={() => { }} // Handle template selection if needed in state
                >
                    {templates.map(tpl => (
                        <MenuItem key={tpl.id} value={tpl.id}>{tpl.name}</MenuItem>
                    ))}
                </AppInputField>
            </AppFormModal>

            <ErrorSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={closeSnackbar}
            />
        </Box>
    );
};

export default CandidateOnboarding;
