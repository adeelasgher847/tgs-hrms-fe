import React, { useState } from 'react';
import { Box, Typography, Chip, IconButton, TextField } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppCard from '../../common/AppCard';
import AppDropdown from '../../common/AppDropdown';

type LocalTask = {
  id: string;
  title: string;
  assignee: string;
  status: string;
};

const mockTasks: Record<string, LocalTask[]> = {
  'team-1': [
    {
      id: 't1',
      title: 'Build onboarding flow',
      assignee: 'Jalal',
      status: 'In Progress',
    },
    {
      id: 't2',
      title: 'API integration',
      assignee: 'Noman',
      status: 'Pending',
    },
    {
      id: 't3',
      title: 'Refactor auth',
      assignee: 'Sobia',
      status: 'Completed',
    },
  ],
  'team-2': [
    {
      id: 't4',
      title: 'Landing page concept',
      assignee: 'Dana',
      status: 'Pending',
    },
  ],
  'team-3': [],
};

// Mock members per team so tasks can be assigned
const mockMembers: Record<string, { id: string; name: string }[]> = {
  'team-1': [
    { id: 'u1', name: 'Jalal' },
    { id: 'u2', name: 'Noman' },
    { id: 'u3', name: 'Sobia' },
    { id: 'u4', name: 'Kishwar' },
  ],
  'team-2': [{ id: 'u4', name: 'Dana' }],
  'team-3': [],
};

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

export default function TeamTasks() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LocalTask[]>(
    mockTasks[teamId || 'team-1'] || []
  );
  const [members] = useState<{ id: string; name: string }[]>(
    mockMembers[teamId || 'team-1'] || []
  );
  // Local mock members fallback for quick frontend testing when backend is absent
  const mockLocalMembers = [
    { id: 'u1', name: 'Jalal' },
    { id: 'u2', name: 'Noman' },
    { id: 'u3', name: 'Sobia' },
    { id: 'u4', name: 'Kishwar' },
  ];
  const membersList = members && members.length ? members : mockLocalMembers;
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>(
    members[0]?.name || ''
  );
  const templateOptions = [
    { key: 'onboard', title: 'Build onboarding flow', assignee: 'Alice' },
    { key: 'api', title: 'API integration', assignee: 'Bob' },
    { key: 'refactor', title: 'Refactor auth', assignee: 'Charlie' },
  ];

  const onSelectTemplate = (templateKey: string) => {
    const t = templateOptions.find(x => x.key === templateKey);
    if (!t) return;
    setNewTaskTitle(t.title);
    setNewTaskAssignee(t.assignee);
  };

  const onChangeStatus = (taskId: string, newStatus: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const onChangeAssignee = (taskId: string, newAssignee: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
  };

  const addMockTask = () => {
    if (!newTaskTitle.trim()) return;
    const id = `t_${Date.now()}`;
    const task = {
      id,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee || (members[0]?.name ?? 'Unassigned'),
      status: 'Pending',
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setNewTaskAssignee(members[0]?.name || '');
  };

  return (
    <Box>
      <IconButton
        size='small'
        onClick={() => navigate(-1)}
        aria-label='back'
        sx={{ color: 'black' }}
      >
        <ArrowBackIcon fontSize='small' />
      </IconButton>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h5' sx={{ color: 'black' }}>
            Team Tasks
          </Typography>
        </Box>
      </Box>

      <AppCard sx={{ mb: 2 }}>
        <Box
          display='flex'
          gap={2}
          alignItems='center'
          sx={{
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            alignItems: { xs: 'stretch', md: 'center' },
          }}
        >
          <AppDropdown
            options={[
              { value: '', label: 'Choose template' },
              ...templateOptions.map(t => ({ value: t.key, label: t.title })),
            ]}
            value={''}
            onChange={e => onSelectTemplate(String(e.target.value))}
            placeholder='Templates'
            containerSx={{ minWidth: { xs: '100%', sm: '100%', md: 200 } }}
            label={''}
          />
          <TextField
            variant='outlined'
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder='New task title'
            size='small'
            sx={{
              minWidth: { xs: '100%', sm: '100%', md: 260 },
              alignSelf: { xs: 'stretch', md: 'flex-start' },
              mt: { xs: 0, md: '20px' },
              '& .MuiOutlinbdInput-root': {
                borderRadius: '12px',
                minHeight: { xs: '40px', sm: '44px' },
                padding: '0 !important',
              },
              '& .MuiOutlinedInput-input': {
                padding: { xs: '8px 12px', sm: '10px 16px' },
              },
            }}
          />
          <AppDropdown
            options={[
              { value: '', label: 'Select assignee' },
              ...membersList.map(m => ({ value: m.name, label: m.name })),
            ]}
            value={newTaskAssignee || ''}
            onChange={e => setNewTaskAssignee(String(e.target.value))}
            placeholder='Assignee'
            containerSx={{ minWidth: { xs: '100%', sm: '100%', md: 160 } }}
            label={''}
          />
          <Box
            sx={{
              /* Shift the Add Task button to the right on tablet (md) and large (lg) */
              ml: { xs: 0, sm: 0, md: 'auto', lg: 'auto' },
              width: { xs: '100%', sm: '100%', md: 'auto', lg: 'auto' },
            }}
          >
            <AppCard
              sx={{
                display: 'inline-block',
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              <Box
                component='button'
                onClick={addMockTask}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    textAlign: 'center',
                  }}
                >
                  Add Task
                </Box>
              </Box>
            </AppCard>
          </Box>
        </Box>
      </AppCard>

      {tasks.length === 0 ? (
        <AppCard>
          <Typography>No tasks for this team.</Typography>
        </AppCard>
      ) : (
        <Box
          display='flex'
          flexWrap='wrap'
          gap={2}
          sx={{
            justifyContent: {
              xs: 'center',
              sm: 'flex-start',
            },
          }}
        >
          {tasks.map(task => (
            <Box
              key={task.id}
              sx={{
                flex: {
                  xs: '0 0 100%',
                  sm: '0 0 calc(50% - 16px)', // 2 cards
                  md: '0 0 calc(33.333% - 16px)', // 3 cards
                  lg: '0 0 calc(25% - 16px)', // 4 cards
                },
                display: 'flex',
              }}
            >
              <AppCard
                sx={{
                  width: '100%',
                  height: '100%', // equal height
                }}
              >
                <Box display='flex' flexDirection='column' gap={1}>
                  {/* Title + Status */}
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Typography
                      variant='subtitle1'
                      sx={{
                        textDecoration:
                          task.status === 'Completed' ? 'line-through' : 'none',
                        color:
                          task.status === 'Completed'
                            ? 'text.disabled'
                            : 'inherit',
                      }}
                    >
                      {task.title}
                    </Typography>

                    <Chip
                      label={task.status}
                      color={
                        task.status === 'Completed'
                          ? 'success'
                          : task.status === 'In Progress'
                            ? 'warning'
                            : 'default'
                      }
                      size='small'
                    />
                  </Box>

                  {/* Assignee */}
                  <Typography variant='body2' color='text.secondary'>
                    Assigned to
                  </Typography>
                  <Box display='flex' gap={2} alignItems='center'>
                    <TextField
                      variant='outlined'
                      size='small'
                      value={task.assignee}
                      onChange={e =>
                        onChangeAssignee(task.id, String(e.target.value))
                      }
                      placeholder='Assignee'
                      sx={{ width: { xs: '100%', md: 280 } }}
                    />
                  </Box>

                  {/* Status */}
                  <Box mt={1}>
                    <AppDropdown
                      options={statusOptions}
                      value={task.status}
                      onChange={e =>
                        onChangeStatus(task.id, String(e.target.value))
                      }
                      placeholder='Status'
                      containerSx={{ width: { xs: '100%', md: 280 } }}
                      label={''}
                    />
                  </Box>
                </Box>
              </AppCard>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
