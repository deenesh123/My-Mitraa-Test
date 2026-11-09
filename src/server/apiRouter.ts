import { Router, Request, Response } from 'express';
import {
  INITIAL_TASKS,
  INITIAL_MEETINGS,
  INITIAL_LEAVES,
  INITIAL_WEEKLY_UPDATES,
  INITIAL_DOCUMENTS,
  INITIAL_DROPDOWNS,
  INITIAL_USERS,
  CURRENT_USER,
  PEOPLE_NOT_FILLING_TASKS,
  SAMPLE_PROJECTS,
  SAMPLE_LEADS,
  SAMPLE_BUGS,
  SAMPLE_TEST_CASES,
  SAMPLE_AUDIT_LOGS,
} from '../api/mockData.ts';

export const apiRouter = Router();

// Server-side in-memory datastore
const db = {
  tasks: [...INITIAL_TASKS],
  meetings: [...INITIAL_MEETINGS],
  leaves: [...INITIAL_LEAVES],
  weeklyUpdates: [...INITIAL_WEEKLY_UPDATES],
  documents: [...INITIAL_DOCUMENTS],
  dropdowns: [...INITIAL_DROPDOWNS],
  users: [...INITIAL_USERS],
  projects: [...SAMPLE_PROJECTS],
  leads: [...SAMPLE_LEADS],
  bugs: [...SAMPLE_BUGS],
  testCases: [...SAMPLE_TEST_CASES],
  auditLogs: [...SAMPLE_AUDIT_LOGS],
  currentUser: { ...CURRENT_USER },
  emailConfig: {
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true,
    user: process.env.ZOHO_SMTP_USER || '',
    from: `${process.env.ZOHO_FROM_NAME || 'MyMitraa TaskFlow'} <${process.env.ZOHO_FROM_EMAIL || 'notifications@mymitraa.com'}>`,
    isConfigured: Boolean(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASSWORD),
    hasPassword: Boolean(process.env.ZOHO_SMTP_PASSWORD),
  },
  emailLogs: [
    {
      id: 'log-sys-1',
      timestamp: new Date().toISOString(),
      to: 'deeneshsabat2002@gmail.com',
      subject: 'MyMitraa TaskFlow System Ready',
      category: 'SYSTEM',
      status: 'SENT',
      details: 'All modules initialized in Node.js runtime.',
    },
  ],
};

// Protection: Differentiate write operations from SearchVM-backed query/read operations
function isWriteEndpoint(method: string, path: string): boolean {
  const m = method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return false;

  const clean = path.toLowerCase();
  if (m === 'PUT') {
    if (
      clean.includes('/getall') ||
      clean.includes('/get_all') ||
      clean.includes('/advance_search') ||
      clean.includes('/get_with_pagination') ||
      clean.includes('/dashboard') ||
      clean.includes('/download')
    ) {
      return false; // Search/read query!
    }
  }

  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m);
}

// Protection: Disable in-memory write persistence across business endpoints
apiRouter.use((req: Request, res: Response, next) => {
  const isWrite = isWriteEndpoint(req.method, req.path);
  const isDevLogin = req.path === '/auth/login' || req.path === '/auth/logout';

  if (isWrite && !isDevLogin) {
    return res.status(503).json({
      code: 503,
      statusCode: 503,
      error: 'Authoritative Persistence Required',
      message: 'In-memory business persistence is disabled. Write operations must be processed by the authoritative Spring Boot backend and persisted to MongoDB.',
      data: null,
    });
  }
  next();
});

// --- Health Check ---
apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    status: 'UP',
    application: 'MyMitraa TaskFlow',
    runtime: 'Node.js 22 Development Support Proxy',
    authoritativeBackend: 'Spring Boot (com.mymitraa.taskflow)',
    authoritativeDatabase: 'MongoDB (mymitraa_taskflow)',
    inMemoryPersistence: 'DISABLED (Authoritative MongoDB Required)',
    modules: {
      tasks: db.tasks.length,
      meetings: db.meetings.length,
      leaves: db.leaves.length,
      weeklyUpdates: db.weeklyUpdates.length,
      users: db.users.length,
      documents: db.documents.length,
      projects: db.projects.length,
    },
  });
});

// --- Auth Endpoints ---
apiRouter.get('/auth/current', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'CURRENT_USER_FETCHED',
    data: db.currentUser,
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, username, password } = req.body || {};
  const query = (email || username || '').trim().toLowerCase();

  if (!query || !password || !password.trim()) {
    return res.status(401).json({
      code: 401,
      message: 'Both identifier (email or username) and password are required for login',
    });
  }

  const user = db.users.find(u => u.email.toLowerCase() === query || u.name.toLowerCase() === query);
  if (!user) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid username/email or password',
    });
  }

  user.last_login = 'Just now';
  db.currentUser = user;

  const token = `dev-jwt-session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  res.setHeader('Authorization', 'Bearer ' + token);

  return res.json({
    code: 200,
    message: 'LOGIN_SUCCESS',
    data: user,
    metaInfo: {
      token: token,
    },
  });
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'LOGGED_OUT_SUCCESSFULLY',
    data: true,
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, role, team } = req.body || {};
  
  // Security constraint: Public registration always assigns the default Employee role.
  // Client-supplied role information must never override the server-assigned role.
  const assignedRole = 'Employee';

  const initials = (name || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const newUser = {
    id: `usr-${Date.now()}`,
    name: name || 'New User',
    email: email || 'user@mymitraa.com',
    role: assignedRole,
    team: team || 'General',
    status: 'Active' as const,
    avatar: initials || 'U',
    created_date: new Date().toLocaleDateString('en-GB'),
    last_login: 'Just now',
  };
  db.users.unshift(newUser as any);
  db.currentUser = newUser as any;
  return res.json({
    code: 200,
    message: 'REGISTRATION_SUCCESS',
    data: newUser,
  });
});

// --- User Management ---
apiRouter.get('/users/getAll', (req: Request, res: Response) => {
  const { search, role, team, status } = req.query as Record<string, string>;
  let results = [...db.users];
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role && role !== 'All') {
    results = results.filter(u => u.role.toLowerCase() === role.toLowerCase());
  }
  if (team && team !== 'All') {
    results = results.filter(u => u.team.toLowerCase() === team.toLowerCase());
  }
  if (status && status !== 'All') {
    results = results.filter(u => u.status.toLowerCase() === status.toLowerCase());
  }
  return res.json({
    code: 200,
    message: 'USERS_FETCHED_SUCCESSFULLY',
    data: results,
    metaInfo: { totalCount: results.length },
  });
});

apiRouter.post('/users/save', (req: Request, res: Response) => {
  const userData = req.body || {};
  const isCallerSuperAdmin = db.currentUser.role === 'Super Admin';
  if (userData.role === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Only Super Admin can provision Super Admin accounts' });
  }

  const id = `usr-${Date.now()}`;
  const initials = (userData.name || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const newUser = {
    ...userData,
    id,
    avatar: initials || 'U',
    created_date: new Date().toLocaleDateString('en-GB'),
    last_login: 'Never',
  };
  db.users.unshift(newUser);
  return res.json({
    code: 200,
    message: 'USER_CREATED_SUCCESSFULLY',
    data: newUser,
  });
});

apiRouter.put('/users/update/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body || {};
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ code: 404, message: 'User not found' });
  }

  const target = db.users[idx];
  const isCallerSuperAdmin = db.currentUser.role === 'Super Admin';

  // Safeguard: Admin cannot modify Super Admin accounts
  if (target.role === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Admins cannot modify Super Admin accounts' });
  }

  // Safeguard: Only Super Admin can assign the Super Admin role
  if (updates.role === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Only Super Admin can assign the Super Admin role' });
  }

  db.users[idx] = { ...db.users[idx], ...updates };
  return res.json({
    code: 200,
    message: 'USER_UPDATED_SUCCESSFULLY',
    data: db.users[idx],
  });
});

apiRouter.delete('/users/delete/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.users.find(u => u.id === id);
  if (!target) {
    return res.status(404).json({ code: 404, message: 'User not found' });
  }

  const isCallerSuperAdmin = db.currentUser.role === 'Super Admin';
  if (target.role === 'Super Admin') {
    return res.status(403).json({ code: 403, message: 'Super Admin accounts cannot be deleted' });
  }

  if (target.role === 'Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Only Super Admin can delete Admin accounts' });
  }

  db.users = db.users.filter(u => u.id !== id);
  return res.json({
    code: 200,
    message: 'USER_DELETED_SUCCESSFULLY',
    data: true,
  });
});

// --- Role & Permission Management ---
apiRouter.get('/roles', (_req: Request, res: Response) => {
  const roleSummaries = [
    { name: 'Super Admin', userCount: db.users.filter(u => u.role === 'Super Admin').length, permissionsCount: 33 },
    { name: 'Admin', userCount: db.users.filter(u => u.role === 'Admin').length, permissionsCount: 22 },
    { name: 'Project Manager', userCount: db.users.filter(u => u.role === 'Project Manager').length, permissionsCount: 15 },
    { name: 'Developer', userCount: db.users.filter(u => u.role === 'Developer').length, permissionsCount: 11 },
    { name: 'Sales Executive', userCount: db.users.filter(u => u.role === 'Sales Executive').length, permissionsCount: 8 },
    { name: 'Sales Manager', userCount: db.users.filter(u => u.role === 'Sales Manager').length, permissionsCount: 13 },
    { name: 'QA Tester', userCount: db.users.filter(u => u.role === 'QA Tester').length, permissionsCount: 12 },
    { name: 'HR Manager', userCount: db.users.filter(u => u.role === 'HR Manager').length, permissionsCount: 11 },
    { name: 'Employee', userCount: db.users.filter(u => u.role === 'Employee').length, permissionsCount: 7 },
    { name: 'Client', userCount: db.users.filter(u => u.role === 'Client').length, permissionsCount: 2 }
  ];
  return res.json({
    code: 200,
    message: 'ROLES_FETCHED_SUCCESSFULLY',
    data: roleSummaries,
  });
});

apiRouter.post('/roles/assign', (req: Request, res: Response) => {
  const { userId, roleName } = req.body || {};
  const isCallerSuperAdmin = db.currentUser.role === 'Super Admin';
  if (roleName === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Only Super Admin can assign the Super Admin role' });
  }
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: 'User not found' });
  }
  if (user.role === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Admins cannot modify Super Admin accounts' });
  }
  user.role = roleName;
  return res.json({
    code: 200,
    message: 'ROLE_ASSIGNED_SUCCESSFULLY',
    data: user,
  });
});

apiRouter.put('/roles/:name/permissions', (req: Request, res: Response) => {
  const { name } = req.params;
  const isCallerSuperAdmin = db.currentUser.role === 'Super Admin';
  if (name === 'Super Admin' && !isCallerSuperAdmin) {
    return res.status(403).json({ code: 403, message: 'Admins cannot modify Super Admin permissions' });
  }
  return res.json({
    code: 200,
    message: 'ROLE_PERMISSIONS_UPDATED_SUCCESSFULLY',
    data: { role: name, permissions: req.body },
  });
});

apiRouter.get('/permissions', (_req: Request, res: Response) => {
  const allPermissions = [
    'users.view', 'users.create', 'users.update', 'users.delete', 'users.assign_role',
    'roles.manage', 'permissions.manage',
    'projects.view', 'projects.create', 'projects.update', 'projects.delete',
    'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.update', 'tasks.delete',
    'sales.leads.view', 'sales.leads.create', 'sales.leads.update', 'sales.leads.delete', 'sales.reports.view',
    'qa.tests.view', 'qa.tests.create', 'qa.tests.execute', 'qa.bugs.view', 'qa.bugs.create', 'qa.bugs.update',
    'hr.employees.view', 'hr.employees.manage', 'hr.leave.view', 'hr.leave.apply', 'hr.leave.approve', 'hr.attendance.manage',
    'meetings.view', 'meetings.manage',
    'reports.view', 'reports.export',
    'documents.upload', 'documents.download',
    'audit.view', 'settings.manage', 'email.manage'
  ];
  return res.json({
    code: 200,
    message: 'PERMISSIONS_FETCHED_SUCCESSFULLY',
    data: allPermissions,
  });
});

// --- Feedback / Task Tracker ---
apiRouter.get('/feedback/feedback_numerical_count', (_req: Request, res: Response) => {
  const total = db.tasks.length;
  const closed = db.tasks.filter(t => t.status === 'Closed').length;
  const in_progress = db.tasks.filter(t => t.status === 'In Progress').length;
  const open = db.tasks.filter(t => t.status === 'Open').length;
  const on_hold = db.tasks.filter(t => t.status === 'On Hold').length;
  const overdue = db.tasks.filter(t => t.status === 'Open' || t.status === 'In Progress').slice(0, 3).length;

  return res.json({
    code: 200,
    message: 'FEEDBACK_NUMERICAL_COUNT_FETCHED_SUCCESSFULLY',
    data: {
      total,
      closed,
      in_progress,
      open,
      on_hold,
      overdue,
      total_trend: '+8%',
      in_progress_trend: '+5%',
      closed_trend: '+15%',
      open_trend: '-3%',
    },
  });
});

const handleGetAllFeedback = (req: Request, res: Response) => {
  const searchVM = (req.method === 'PUT' ? req.body : req.query) || {};
  let results = [...db.tasks];

  if (searchVM.customer) {
    results = results.filter(t => t.customer.toLowerCase().includes(String(searchVM.customer).toLowerCase()));
  }
  if (searchVM.project) {
    results = results.filter(t => t.project.toLowerCase().includes(String(searchVM.project).toLowerCase()));
  }
  if (searchVM.team) {
    results = results.filter(t => t.team.toLowerCase().includes(String(searchVM.team).toLowerCase()));
  }
  if (searchVM.task_owner) {
    results = results.filter(t => t.task_owner.toLowerCase().includes(String(searchVM.task_owner).toLowerCase()));
  }
  if (searchVM.status) {
    results = results.filter(t => t.status.toLowerCase() === String(searchVM.status).toLowerCase());
  }
  if (searchVM.priority) {
    results = results.filter(t => t.priority.toLowerCase().includes(String(searchVM.priority).toLowerCase()));
  }
  if (searchVM.ticket_number) {
    results = results.filter(t => t.ticket_number.toLowerCase().includes(String(searchVM.ticket_number).toLowerCase()));
  }
  if (searchVM.search_query) {
    const q = String(searchVM.search_query).toLowerCase();
    results = results.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.ticket_number.toLowerCase().includes(q) ||
      t.task_owner.toLowerCase().includes(q)
    );
  }

  return res.json({
    code: 200,
    message: 'FEEDBACK_FETCHED_SUCCESSFULLY',
    data: results,
    metaInfo: { totalCount: results.length },
  });
};

apiRouter.get('/feedback/get_all_feedback', handleGetAllFeedback);
apiRouter.put('/feedback/get_all_feedback', handleGetAllFeedback);

apiRouter.get('/feedback/get_feedback_by_id/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const task = db.tasks.find(t => t.id === id || t.ticket_number === id);
  if (!task) {
    return res.status(404).json({ code: 404, message: 'TASK_NOT_FOUND', data: null });
  }
  return res.json({ code: 200, message: 'TASK_FOUND', data: task });
});

apiRouter.delete('/feedback/get_feedback_by_id/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const prevLen = db.tasks.length;
  db.tasks = db.tasks.filter(t => t.id !== id && t.ticket_number !== id);
  return res.json({ code: 200, message: 'TASK_DELETED_SUCCESSFULLY', data: db.tasks.length < prevLen });
});

apiRouter.post('/feedback/save_feedback', (req: Request, res: Response) => {
  const task = req.body || {};
  const id = `task-${Date.now()}`;
  const actual_effort = (task.work_log_entries || []).reduce((sum: number, w: any) => sum + (w.hours || 0), 0);
  const newTask = {
    ...task,
    id,
    actual_effort,
    subtask_count: task.subtask_count || 0,
    work_log_entries: task.work_log_entries || [],
  };
  db.tasks.unshift(newTask);
  return res.json({ code: 200, message: 'TASK_SAVED_SUCCESSFULLY', data: newTask });
});

apiRouter.post('/feedback/edit_feedback', (req: Request, res: Response) => {
  const { id, ...updates } = req.body || {};
  const idx = db.tasks.findIndex(t => t.id === id || t.ticket_number === id);
  if (idx === -1) {
    return res.status(404).json({ code: 404, message: 'Task not found' });
  }
  const current = db.tasks[idx];
  let actual_effort = current.actual_effort;
  if (updates.work_log_entries) {
    actual_effort = updates.work_log_entries.reduce((sum: number, w: any) => sum + (w.hours || 0), 0);
  }
  const updated = { ...current, ...updates, actual_effort };
  db.tasks[idx] = updated;
  return res.json({ code: 200, message: 'TASK_UPDATED_SUCCESSFULLY', data: updated });
});

apiRouter.post('/feedback/add_worklog_hours', (req: Request, res: Response) => {
  const { taskId, entry } = req.body || {};
  const idx = db.tasks.findIndex(t => t.id === taskId || t.ticket_number === taskId);
  if (idx === -1) {
    return res.status(404).json({ code: 404, message: 'Task not found' });
  }
  const current = db.tasks[idx];
  const newEntry = { id: `wl-${Date.now()}`, ...entry };
  const updatedEntries = [...(current.work_log_entries || []), newEntry];
  const actual_effort = updatedEntries.reduce((sum: number, w: any) => sum + (w.hours || 0), 0);
  current.work_log_entries = updatedEntries;
  current.actual_effort = actual_effort;
  db.tasks[idx] = { ...current };
  return res.json({ code: 200, message: 'WORKLOG_ADDED_SUCCESSFULLY', data: db.tasks[idx] });
});

apiRouter.post('/feedback/add_subtask', (req: Request, res: Response) => {
  const subtaskData = req.body || {};
  const taskId = subtaskData.parentFeedbackHistoryId;
  const task = db.tasks.find(t => t.id === taskId || t.ticket_number === taskId);
  if (!task) {
    return res.status(404).json({ code: 404, message: 'Parent task not found' });
  }
  task.subtask_count = (task.subtask_count || 0) + 1;
  return res.json({ code: 200, message: 'SUBTASK_ADDED_SUCCESSFULLY', data: task });
});

apiRouter.put('/feedback/update_subtask/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body || {};
  return res.json({ code: 200, message: 'SUBTASK_UPDATED_SUCCESSFULLY', data: { id, ...updates } });
});

apiRouter.delete('/feedback/delete_subtask/:id/:epicId', (_req: Request, res: Response) => {
  return res.json({ code: 200, message: 'SUBTASK_DELETED_SUCCESSFULLY', data: true });
});

apiRouter.get('/feedback/get_people_not_filling_tasks', (_req: Request, res: Response) => {
  return res.json({ code: 200, message: 'PEOPLE_NOT_FILLING_TASKS_FETCHED', data: PEOPLE_NOT_FILLING_TASKS });
});

// --- Meeting Time Tracker ---
const handleGetMeetings = (req: Request, res: Response) => {
  const searchVM = (req.method === 'PUT' ? req.body : req.query) || {};
  let results = [...db.meetings];
  if (searchVM.customer) {
    results = results.filter(m => m.customer.toLowerCase().includes(String(searchVM.customer).toLowerCase()));
  }
  if (searchVM.project) {
    results = results.filter(m => m.project.toLowerCase().includes(String(searchVM.project).toLowerCase()));
  }
  if (searchVM.team) {
    results = results.filter(m => m.team.toLowerCase().includes(String(searchVM.team).toLowerCase()));
  }
  return res.json({
    code: 200,
    message: 'MEETINGS_FETCHED_SUCCESSFULLY',
    data: results,
    metaInfo: { totalCount: results.length },
  });
};

apiRouter.get('/meeting_time_tracker/getAll', handleGetMeetings);
apiRouter.put('/meeting_time_tracker/getAll', handleGetMeetings);

apiRouter.post('/meeting_time_tracker/save', (req: Request, res: Response) => {
  const newMeeting = { ...req.body, id: `meeting-${Date.now()}` };
  db.meetings.unshift(newMeeting);
  return res.json({ code: 200, message: 'MEETING_SAVED_SUCCESSFULLY', data: newMeeting });
});

apiRouter.put('/meeting_time_tracker/update/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.meetings.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Meeting not found' });
  db.meetings[idx] = { ...db.meetings[idx], ...req.body };
  return res.json({ code: 200, message: 'MEETING_UPDATED_SUCCESSFULLY', data: db.meetings[idx] });
});

apiRouter.delete('/meeting_time_tracker/delete/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.meetings = db.meetings.filter(m => m.id !== id);
  return res.json({ code: 200, message: 'MEETING_DELETED_SUCCESSFULLY', data: true });
});

// --- Leaves Tracker ---
const handleGetLeaves = (_req: Request, res: Response) => {
  return res.json({ code: 200, message: 'LEAVES_FETCHED_SUCCESSFULLY', data: [...db.leaves] });
};
apiRouter.get('/optima_leave_tracker/getAll', handleGetLeaves);
apiRouter.put('/optima_leave_tracker/getAll', handleGetLeaves);

apiRouter.post('/optima_leave_tracker/save', (req: Request, res: Response) => {
  const newLeave = { ...req.body, id: `leave-${Date.now()}` };
  db.leaves.unshift(newLeave);
  return res.json({ code: 200, message: 'LEAVE_SAVED_SUCCESSFULLY', data: newLeave });
});

apiRouter.delete('/optima_leave_tracker/delete/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.leaves = db.leaves.filter(l => l.id !== id);
  return res.json({ code: 200, message: 'LEAVE_DELETED_SUCCESSFULLY', data: true });
});

// --- Weekly Updates ---
const handleGetWeeklyUpdates = (_req: Request, res: Response) => {
  return res.json({ code: 200, message: 'WEEKLY_UPDATES_FETCHED_SUCCESSFULLY', data: [...db.weeklyUpdates] });
};
apiRouter.get('/optima_weekly_update_tracker/getAll', handleGetWeeklyUpdates);
apiRouter.put('/optima_weekly_update_tracker/getAll', handleGetWeeklyUpdates);

apiRouter.post('/optima_weekly_update_tracker/save', (req: Request, res: Response) => {
  const newUpdate = { ...req.body, id: `update-${Date.now()}` };
  db.weeklyUpdates.unshift(newUpdate);
  return res.json({ code: 200, message: 'WEEKLY_UPDATE_SAVED_SUCCESSFULLY', data: newUpdate });
});

apiRouter.post('/optima_weekly_update_tracker/update', (req: Request, res: Response) => {
  const { id, ...updates } = req.body || {};
  const idx = db.weeklyUpdates.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Update not found' });
  db.weeklyUpdates[idx] = { ...db.weeklyUpdates[idx], ...updates };
  return res.json({ code: 200, message: 'WEEKLY_UPDATE_MODIFIED_SUCCESSFULLY', data: db.weeklyUpdates[idx] });
});

apiRouter.put('/optima_weekly_update_tracker/send-weekly-mail', (req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'Weekly report email dispatched via Zoho Mail SMTP',
    data: { success: true, to: req.body?.email || 'management@mymitraa.com' },
  });
});

// --- Dropdown Management ---
const handleGetDropdowns = (req: Request, res: Response) => {
  const type = (req.query.type as string) || '';
  let results = [...db.dropdowns];
  if (type) {
    results = results.filter(d => d.type.toLowerCase() === type.toLowerCase());
  }
  return res.json({ code: 200, message: 'DROPDOWN_ITEMS_FETCHED_SUCCESSFULLY', data: results });
};
apiRouter.get('/dropdown_management/getAll', handleGetDropdowns);
apiRouter.put('/dropdown_management/getAll', handleGetDropdowns);

apiRouter.post('/dropdown_management/save', (req: Request, res: Response) => {
  const newItem = { ...req.body, id: `dm-${Date.now()}` };
  db.dropdowns.unshift(newItem);
  return res.json({ code: 200, message: 'DROPDOWN_ITEM_SAVED_SUCCESSFULLY', data: newItem });
});

apiRouter.put('/dropdown_management/update/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.dropdowns.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Dropdown item not found' });
  db.dropdowns[idx] = { ...db.dropdowns[idx], ...req.body };
  return res.json({ code: 200, message: 'DROPDOWN_ITEM_UPDATED_SUCCESSFULLY', data: db.dropdowns[idx] });
});

apiRouter.delete('/dropdown_management/delete/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.dropdowns = db.dropdowns.filter(d => d.id !== id);
  return res.json({ code: 200, message: 'DROPDOWN_ITEM_DELETED_SUCCESSFULLY', data: true });
});

// --- Documents ---
apiRouter.get('/documents', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'DOCUMENTS_FETCHED_SUCCESSFULLY',
    data: [...db.documents],
    metaInfo: { totalCount: db.documents.length },
  });
});

apiRouter.post('/documents/upload', (req: Request, res: Response) => {
  const newDoc = { ...req.body, id: `doc-${Date.now()}` };
  db.documents.unshift(newDoc);
  return res.json({ code: 200, message: 'DOCUMENT_UPLOADED_SUCCESSFULLY', data: newDoc });
});

apiRouter.delete('/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.documents = db.documents.filter(d => d.id !== id && d.ticket_number !== id);
  return res.json({ code: 200, message: 'DOCUMENT_DELETED_SUCCESSFULLY', data: true });
});

// --- Projects ---
apiRouter.get('/projects', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'PROJECTS_FETCHED_SUCCESSFULLY',
    data: [...db.projects],
    metaInfo: { totalCount: db.projects.length },
  });
});

apiRouter.post('/projects', (req: Request, res: Response) => {
  const newProj = { ...req.body, id: `proj-${Date.now()}` };
  db.projects.unshift(newProj);
  return res.json({ code: 200, message: 'PROJECT_CREATED_SUCCESSFULLY', data: newProj });
});

apiRouter.put('/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.projects.findIndex(p => p.id === id || p.project_id === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Project not found' });
  db.projects[idx] = { ...db.projects[idx], ...req.body };
  return res.json({ code: 200, message: 'PROJECT_UPDATED_SUCCESSFULLY', data: db.projects[idx] });
});

apiRouter.delete('/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.projects = db.projects.filter(p => p.id !== id && p.project_id !== id);
  return res.json({ code: 200, message: 'PROJECT_DELETED_SUCCESSFULLY', data: true });
});

// --- Leads / Sales CRM ---
apiRouter.get('/leads', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'LEADS_FETCHED_SUCCESSFULLY',
    data: [...db.leads],
    metaInfo: { totalCount: db.leads.length },
  });
});

apiRouter.post('/leads', (req: Request, res: Response) => {
  const newLead = { ...req.body, id: `lead-${Date.now()}` };
  db.leads.unshift(newLead);
  return res.json({ code: 200, message: 'LEAD_CREATED_SUCCESSFULLY', data: newLead });
});

apiRouter.put('/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Lead not found' });
  db.leads[idx] = { ...db.leads[idx], ...req.body };
  return res.json({ code: 200, message: 'LEAD_UPDATED_SUCCESSFULLY', data: db.leads[idx] });
});

apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.leads = db.leads.filter(l => l.id !== id);
  return res.json({ code: 200, message: 'LEAD_DELETED_SUCCESSFULLY', data: true });
});

// --- QA Bugs ---
apiRouter.get('/bugs', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'BUGS_FETCHED_SUCCESSFULLY',
    data: [...db.bugs],
    metaInfo: { totalCount: db.bugs.length },
  });
});

apiRouter.post('/bugs', (req: Request, res: Response) => {
  const newBug = { ...req.body, id: `bug-${Date.now()}` };
  db.bugs.unshift(newBug);
  return res.json({ code: 200, message: 'BUG_CREATED_SUCCESSFULLY', data: newBug });
});

apiRouter.put('/bugs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.bugs.findIndex(b => b.id === id || b.bug_code === id);
  if (idx === -1) return res.status(404).json({ code: 404, message: 'Bug not found' });
  db.bugs[idx] = { ...db.bugs[idx], ...req.body };
  return res.json({ code: 200, message: 'BUG_UPDATED_SUCCESSFULLY', data: db.bugs[idx] });
});

apiRouter.delete('/bugs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.bugs = db.bugs.filter(b => b.id !== id && b.bug_code !== id);
  return res.json({ code: 200, message: 'BUG_DELETED_SUCCESSFULLY', data: true });
});

// --- Audit Logs ---
apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'AUDIT_LOGS_FETCHED_SUCCESSFULLY',
    data: [...db.auditLogs],
    metaInfo: { totalCount: db.auditLogs.length },
  });
});

apiRouter.post('/audit-logs', (req: Request, res: Response) => {
  const newLog = {
    ...req.body,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  return res.json({ code: 200, message: 'AUDIT_LOG_RECORDED', data: newLog });
});

// --- Email / Zoho Configuration ---
apiRouter.get('/email/config', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'EMAIL_CONFIG_FETCHED',
    data: db.emailConfig,
  });
});

apiRouter.post('/email/config', (req: Request, res: Response) => {
  db.emailConfig = { ...db.emailConfig, ...req.body };
  return res.json({
    code: 200,
    message: 'EMAIL_CONFIG_UPDATED',
    data: db.emailConfig,
  });
});

apiRouter.post('/email/test', (req: Request, res: Response) => {
  const { to, subject, message } = req.body || {};
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    to: to || 'user@example.com',
    subject: subject || 'Test Notification',
    category: 'TEST',
    status: 'SENT',
    details: message || 'Dispatched via TaskFlow Email Service',
  };
  db.emailLogs.unshift(newLog);
  return res.json({
    code: 200,
    message: `Test email successfully dispatched to ${newLog.to}`,
    data: { success: true, log: newLog },
  });
});

apiRouter.get('/email/logs', (_req: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'EMAIL_LOGS_FETCHED',
    data: db.emailLogs,
  });
});
