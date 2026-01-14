import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Icons } from '../../assets/icons';
import AppFormModal, { FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppCard from '../common/AppCard';
import * as tasksApi from '../../api/tasksApi';
import { teamApiService } from '../../api/teamApi';
import { type Task, getTeamById } from '../../Data/taskMockData';

function formatDateLocal(isoDate?: string) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmployeeTasks() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  // Removed unused edit-id and edit-form state to satisfy lint rules
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    status: 'Pending',
    deadline: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    (async () => {
      try {
        const all = await tasksApi.getTasks();
        const filtered = all.filter((t: Task) =>
          (t.assignedTo || []).includes(employeeId)
        );
        if (mounted) setTasks(filtered);
      } catch (err) {
        console.error('Failed to load tasks for employee', employeeId, err);
      }

      try {
        const resp = await teamApiService.getAllTeamMembers(1);
        const found = resp.items?.find((m: Record<string, unknown>) => {
          const id = m['id'] as string | undefined;
          const user = m['user'] as Record<string, unknown> | undefined;
          const userId = user ? (user['id'] as string | undefined) : undefined;
          return id === employeeId || userId === employeeId;
        });
        if (mounted) setEmployee(found ?? undefined);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const startEdit = (t: Task) => {
    // Open modal-based edit
    setCurrentTask(t);
    setFormState({
      title: t.title || '',
      description: t.description || '',
      status: t.status || 'Pending',
      deadline: t.deadline ? t.deadline.slice(0, 10) : '',
    });
    setEditModalOpen(true);
  };

  const cancelEdit = () => {
    setEditModalOpen(false);
    setCurrentTask(null);
    setFormState({
      title: '',
      description: '',
      status: 'Pending',
      deadline: '',
    });
  };

  const saveEdit = (id: string) => {
    // Save from modal
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              title: formState.title,
              description: formState.description,
              status: formState.status as string,
              deadline: formState.deadline
                ? new Date(formState.deadline).toISOString()
                : undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    cancelEdit();
  };

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return setDeleteDialogOpen(false);
    setTasks(prev => prev.filter(t => t.id !== deleteTargetId));
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <Box>
      <IconButton size='small' onClick={() => navigate(-1)} aria-label='back'>
        <ArrowBackIcon fontSize='small' />
      </IconButton>

      <Box
        mb={2}
        display='flex'
        alignItems='center'
        justifyContent='space-between'
      >
        <Typography variant='h5'>
          Tasks for {employee?.name ?? 'Employee'}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <AppCard>
          <Typography>No tasks for this employee.</Typography>
        </AppCard>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              md: 'repeat(3,1fr)',
              lg: 'repeat(3,1fr)',
            },
            gap: 2,
          }}
        >
          {tasks.map(t => (
            <AppCard key={t.id}>
              <Box display='flex' flexDirection='column' gap={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    {t.title}
                  </Typography>
                </Box>

                <Typography variant='body2' color='text.secondary'>
                  {t.description}
                </Typography>

                <Box display='flex' gap={2} flexDirection='row' flexWrap='wrap'>
                  <Typography variant='caption' color='text.secondary'>
                    Team: {getTeamById(t.teamId)?.name ?? t.teamId}
                  </Typography>

                  {t.deadline ? (
                    <Typography variant='caption' color='text.secondary'>
                      Deadline: {formatDateLocal(t.deadline)}
                    </Typography>
                  ) : null}
                </Box>

                {/* Footer actions: edit/delete shown below the card content */}
                <Box mt={1} display='flex' justifyContent='flex-end' gap={1}>
                  <IconButton
                    size='small'
                    onClick={() => startEdit(t)}
                    aria-label={`edit-${t.id}`}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <Box
                      component='img'
                      src={Icons.edit}
                      alt='Edit'
                      sx={{
                        width: { xs: 16, sm: 20 },
                        height: { xs: 16, sm: 20 },
                      }}
                    />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => openDeleteDialog(t.id)}
                    aria-label={`delete-${t.id}`}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <Box
                      component='img'
                      src={Icons.delete}
                      alt='Delete'
                      sx={{
                        width: { xs: 16, sm: 20 },
                        height: { xs: 16, sm: 20 },
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>
            </AppCard>
          ))}
        </Box>
      )}

      <AppFormModal
        maxWidth='md'
        paperSx={{
          width: { xs: '100%', sm: '92%', lg: '800px' },
          maxHeight: '82vh',
        }}
        open={editModalOpen}
        onClose={cancelEdit}
        onSubmit={() => {
          if (currentTask) saveEdit(currentTask.id);
        }}
        title={currentTask ? 'Edit Task' : 'Edit Task'}
        fields={(() => {
          const fields: FormField[] = [
            {
              name: 'title',
              label: 'Title',
              value: formState.title,
              onChange: v =>
                setFormState(prev => ({ ...prev, title: String(v) })),
              required: true,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              value: formState.description,
              onChange: v =>
                setFormState(prev => ({ ...prev, description: String(v) })),
              rows: 4,
            },
            {
              name: 'status',
              label: 'Status',
              type: 'dropdown',
              value: formState.status,
              options: [
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
              ],
              onChange: v =>
                setFormState(prev => ({ ...prev, status: String(v) })),
            },
            {
              name: 'deadline',
              label: 'Deadline',
              value: formState.deadline,
              onChange: v =>
                setFormState(prev => ({ ...prev, deadline: String(v) })),
              component: (
                <AppInputField
                  label='Deadline'
                  type='date'
                  value={formState.deadline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState(prev => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              ),
            },
          ];
          return fields;
        })()}
        submitLabel='Save'
        cancelLabel='Cancel'
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        message={'This action will permanently delete the task.'}
      />
    </Box>
  );
}
