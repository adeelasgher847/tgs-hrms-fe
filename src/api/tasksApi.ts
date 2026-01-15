import axiosInstance from './axiosInstance';
import type { Task, TaskStatus } from '../Data/taskMockData';

// The backend uses snake_case keys; our frontend uses camelCase Task interface.
// This helper maps an API task object to the frontend Task shape.
function mapApiTaskToTask(apiTask: Record<string, unknown>): Task {
  const assignedToRaw = apiTask.assigned_to ?? apiTask.assignedTo ?? [];
  const assignedTo: string[] = Array.isArray(assignedToRaw)
    ? assignedToRaw
    : assignedToRaw
    ? [assignedToRaw]
    : [];

  // Resolve assignedToName from several possible places: assigned_to_name, assignedToName, or assignedEmployee.user
  const assignedToNameRaw = apiTask.assigned_to_name ?? apiTask.assignedToName ?? apiTask.assignedEmployee ?? undefined;
  let assignedToName: string[] = [];
  if (Array.isArray(assignedToNameRaw)) {
    assignedToName = assignedToNameRaw;
  } else if (typeof assignedToNameRaw === 'string') {
    assignedToName = [assignedToNameRaw];
  } else if (assignedToNameRaw && typeof assignedToNameRaw === 'object') {
    // assignedEmployee may be an object with nested user
    const user = assignedToNameRaw.user ?? assignedToNameRaw;
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    if (name) assignedToName = [name];
    else if (user?.name) assignedToName = [user.name];
  }

  // Normalize status: API may return lowercase 'pending' etc. Convert to Title Case used by frontend
  const rawStatus: string | undefined = apiTask.status ?? apiTask.task_status ?? undefined;
  const normalizeStatus = (s?: string): TaskStatus => {
    if (!s) return 'Pending';
    const lower = String(s).toLowerCase();
    if (lower.includes('progress')) return 'In Progress';
    if (lower.includes('completed') || lower.includes('complete')) return 'Completed';
    return 'Pending';
  };

  // Creator name resolution
  const creatorRaw = apiTask.creator ?? apiTask.created_by_user ?? undefined;
  let createdByName: string | undefined = apiTask.created_by_name ?? apiTask.createdByName ?? undefined;
  if (!createdByName && creatorRaw && typeof creatorRaw === 'object') {
    const user = creatorRaw.user ?? creatorRaw;
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    if (name) createdByName = name;
    else if (user?.name) createdByName = user.name;
  }

  return {
    id: apiTask.id ?? apiTask.task_id ?? apiTask.taskId,
    title: apiTask.title ?? apiTask.task_title ?? apiTask.name ?? '',
    description: apiTask.description ?? apiTask.task_description ?? '',
    assignedTo,
    assignedToName,
    status: normalizeStatus(rawStatus),
    createdBy: apiTask.created_by ?? apiTask.createdBy ?? '',
    createdByName,
    createdAt: apiTask.created_at ?? apiTask.createdAt ?? new Date().toISOString(),
    deadline: apiTask.deadline ?? apiTask.deadline_at ?? apiTask.due_date ?? undefined,
    updatedAt: apiTask.updated_at ?? apiTask.updatedAt ?? new Date().toISOString(),
    teamId: apiTask.team_id ?? apiTask.teamId ?? apiTask.team?.id ?? '',
  } as Task;
}

// Get single task by id
export async function getTask(taskId: string): Promise<Task> {
  const res = await axiosInstance.get(`/tasks/${taskId}`);
  return mapApiTaskToTask(res.data);
}

// Get list of tasks, optional query params
export async function getTasks(params?: Record<string, unknown>): Promise<Task[]> {
  const res = await axiosInstance.get('/tasks', { params });
  const data = res.data ?? [];
  if (Array.isArray(data)) return data.map(mapApiTaskToTask);
  // If API wraps list in an object like { items: [...] }
  if (Array.isArray(data.items)) return data.items.map(mapApiTaskToTask);
  return [];
}

// Create a new task. `payload` should follow backend contract (snake_case or camelCase).
export async function createTask(payload: Record<string, unknown>): Promise<Task> {
  // Sanitize payload according to backend validation rules:
  // - Do not send server-managed fields like `status` or `created_by`.
  // - `assigned_to` must be a single UUID string (not an array).
  const sanitized: Record<string, unknown> = {};

  if (payload.title) sanitized.title = payload.title;
  if (payload.description) sanitized.description = payload.description;

  // Normalize assigned_to (accept either `assigned_to` or `assignedTo`)
  let assigned: unknown = payload.assigned_to ?? payload.assignedTo ?? undefined;
  if (Array.isArray(assigned)) assigned = assigned[0];
  if (assigned) sanitized.assigned_to = assigned;

  // Team id
  if (payload.team_id) sanitized.team_id = payload.team_id;
  if (payload.teamId) sanitized.team_id = payload.teamId;

  // Deadline / due date
  if (payload.deadline) sanitized.deadline = payload.deadline;
  if (payload.due_date) sanitized.due_date = payload.due_date;
  // Do NOT include tenant_id here — the backend determines tenant from the
  // authenticated request (token) and will reject tenant_id in the payload.

  const res = await axiosInstance.post('/tasks', sanitized);
  return mapApiTaskToTask(res.data);
}

// Update an existing task
export async function updateTask(taskId: string, payload: Record<string, unknown>): Promise<Task> {
  // Only send allowed/simple updatable fields. The backend returns a 400
  // if server-managed relationship fields are present (e.g. assigned_to,
  // team_id, tenant_id). Send a minimal payload containing only editable
  // primitive fields.
  const sanitized: Record<string, unknown> = {};
  if (payload.title !== undefined) sanitized.title = payload.title;
  if (payload.description !== undefined) sanitized.description = payload.description;
  if (payload.deadline !== undefined) sanitized.deadline = payload.deadline;
  if (payload.due_date !== undefined) sanitized.due_date = payload.due_date;
  if (payload.status !== undefined) sanitized.status = payload.status;
  if (payload.priority !== undefined) sanitized.priority = payload.priority;

  const res = await axiosInstance.put(`/tasks/${taskId}`, sanitized);
  return mapApiTaskToTask(res.data);
}

// Delete a task
export async function deleteTask(taskId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await axiosInstance.delete(`/tasks/${taskId}`);
  const ok = res.status >= 200 && res.status < 300;
  const data = res.data as Record<string, unknown>;
  const message = (data && (data['message'] ?? data['msg'])) as string | undefined;
  return { ok, message };
}

// Patch task status (backend provides a dedicated endpoint)
export async function patchTaskStatus(taskId: string, status: string): Promise<Task> {
  const res = await axiosInstance.patch(`/tasks/${taskId}/status`, { status });
  return mapApiTaskToTask(res.data);
}

// Example helper to convert a frontend Task to backend payload (snake_case)
export function mapTaskToApiPayload(task: Partial<Task>): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigned_to: task.assignedTo,
    assigned_to_name: task.assignedToName,
    status: task.status,
    created_by: task.createdBy,
    created_at: task.createdAt,
    deadline: task.deadline,
    updated_at: task.updatedAt,
    team_id: task.teamId,
  };
}

export default {
  getTask,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  patchTaskStatus,
  mapApiTaskToTask,
  mapTaskToApiPayload,
};
