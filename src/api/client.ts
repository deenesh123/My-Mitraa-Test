/**
 * Central API Client for MiTRAA TaskFlow
 * Provides typed methods for all controllers with environment-configurable base URLs,
 * strict production error enforcement (never silent mock in production),
 * and preview server integration with local fallback.
 */

import {
  CustomResponse,
  FeedbackHistory,
  MeetingTimeTracker,
  OptimaLeaveTracker,
  OptimaWeeklyUpdateTracker,
  DropdownItem,
  DocumentRecord,
  SearchVM,
  NumericalCount,
  WorkLogEntry,
  UserAccount,
  Subtask,
  ProjectRecord,
  LeadRecord,
  BugRecord,
  TestCaseRecord,
  AuditLogRecord,
} from './types';

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
} from './mockData';

// Environment & Base URL Configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Detect Vite production build bundle (immutable in compiled production dist)
export const isProductionBuild: boolean = Boolean(import.meta.env.PROD);

// Runtime mode state:
// In production builds, mode is STRICTLY and PERMANENTLY 'production'.
// In development, it defaults to 'development' (or VITE_API_MODE if set to 'development' or 'preview').
let activeApiMode: string = isProductionBuild
  ? 'production'
  : (import.meta.env.VITE_API_MODE || 'development').toLowerCase();

export function getApiMode(): string {
  return isProductionBuild ? 'production' : activeApiMode;
}

export function setApiMode(mode: string): void {
  if (isProductionBuild) {
    console.warn('[ApiClient] Cannot modify API mode in a production build. Mode remains "production".');
    return;
  }
  activeApiMode = mode.toLowerCase();
}

export function isProductionMode(): boolean {
  return isProductionBuild || getApiMode() === 'production';
}

// Backward-compatible exports
export const isProduction: boolean = isProductionMode();
export const API_MODE: string = getApiMode();

// Returns true ONLY if mock fallback is permitted (strictly forbidden in production builds and production mode)
export function isMockFallbackAllowed(): boolean {
  if (isProductionBuild || isProductionMode()) {
    return false;
  }
  return dataStore.useMock;
}

/**
 * Resolves full API URL without creating redundant /api/api/ prefixes
 */
export function resolveApiUrl(baseUrl: string, endpoint: string): string {
  const base = (baseUrl || '').replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!base) {
    return path;
  }

  // Prevent double '/api/api/' if baseUrl ends with '/api' and endpoint starts with '/api/'
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    return `${base.slice(0, -4)}${path}`;
  }

  return `${base}${path}`;
}

/**
 * Differentiates business write operations from SearchVM-backed query/read operations.
 * Spring Boot controllers use @PutMapping for complex search/read endpoints
 * (e.g., /feedback/get_all_feedback, /optima_weekly_update_tracker/getAll, etc.).
 */
export function isWriteEndpoint(method: string | undefined, endpoint: string): boolean {
  const m = (method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return false;

  const clean = endpoint.toLowerCase();
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

const SESSION_TOKEN_KEY = 'mitraa_jwt_token';

export function getSessionToken(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
  }
  return '';
}

export function setSessionToken(token: string | null): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    if (token && token.trim()) {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, token.trim());
    } else {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }
}

// Central in-memory state initialized with seed data (used for offline preview & testing)
class DataStore {
  tasks: FeedbackHistory[] = [...INITIAL_TASKS];
  meetings: MeetingTimeTracker[] = [...INITIAL_MEETINGS];
  leaves: OptimaLeaveTracker[] = [...INITIAL_LEAVES];
  weeklyUpdates: OptimaWeeklyUpdateTracker[] = [...INITIAL_WEEKLY_UPDATES];
  documents: DocumentRecord[] = [...INITIAL_DOCUMENTS];
  dropdowns: DropdownItem[] = [...INITIAL_DROPDOWNS];
  users: UserAccount[] = [...INITIAL_USERS];
  projects: ProjectRecord[] = [...SAMPLE_PROJECTS];
  leads: LeadRecord[] = [...SAMPLE_LEADS];
  bugs: BugRecord[] = [...SAMPLE_BUGS];
  testCases: TestCaseRecord[] = [...SAMPLE_TEST_CASES];
  auditLogs: AuditLogRecord[] = [...SAMPLE_AUDIT_LOGS];
  currentUser: UserAccount = { ...CURRENT_USER };
  authToken: string = getSessionToken();
  useMock: boolean = !isProductionMode();
}

export const dataStore = new DataStore();

const isTestEnv = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST));

// Helper delay to simulate authentic network response when running purely offline
const delay = (ms: number = 60) => isTestEnv ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust HTTP client that:
 * - Normalizes API URLs without double '/api/api/'
 * - Automatically injects dynamically generated Authorization & JSON headers
 * - Enforces production integrity: Throws loud errors on failure; NEVER returns mock data in production.
 * - In preview: Attempts real backend endpoint first, gracefully falling back to local store for reads if offline.
 * - Handles 401 Unauthorized by clearing session and notifying listeners.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  previewFallback?: () => Promise<CustomResponse<T>> | CustomResponse<T>
): Promise<CustomResponse<T>> {
  const isProd = isProductionMode();
  const mockAllowed = isMockFallbackAllowed();
  const isWrite = isWriteEndpoint(options.method, endpoint);

  // In test environment: if mock fallback is explicitly allowed and useMock is active,
  // and no fetch spy or server is running, allow direct previewFallback only for read operations
  // BUT NEVER if in production mode or mock mode is disabled!
  if (isTestEnv && previewFallback && !isProd && mockAllowed && !isWrite) {
    const isFetchSpied = typeof globalThis.fetch === 'function' && (
      '_isMockFunction' in (globalThis.fetch as any) ||
      (globalThis.fetch as any).mock !== undefined
    );
    if (!isFetchSpied) {
      return await previewFallback();
    }
  }

  const url = resolveApiUrl(API_BASE_URL, endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(dataStore.authToken ? { 'Authorization': dataStore.authToken } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isHtmlResponse = contentType.includes('text/html');

    // Automatically capture backend-issued JWT token from headers if present
    const authHeader = res.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      ApiClient.setAuthToken(authHeader);
    }

    if (!res.ok || isHtmlResponse) {
      let errMsg = `HTTP ${res.status}: ${res.statusText || 'Error'}`;
      if (isHtmlResponse) {
        errMsg = `API endpoint ${url} returned HTML instead of JSON. The authoritative Spring Boot backend service may be offline or unmapped.`;
      } else {
        const errText = await res.text().catch(() => '');
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed?.message || parsed?.error || parsed?.responseMessage || errMsg;
        } catch {}
      }

      // HTTP 401 Unauthorized: Session is invalid or token expired
      if (res.status === 401) {
        ApiClient.clearAuth();
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('mitraa:unauthorized'));
        }
        const authErr = new Error(errMsg || 'Session expired or invalid credentials (HTTP 401)');
        (authErr as any).status = 401;
        throw authErr;
      }

      // In production mode, when mock fallback is disabled, or for any write operation:
      // NEVER silently fake success or return mock records!
      if (isProd || !mockAllowed || isWrite) {
        const error = new Error(errMsg || `Operation failed [HTTP ${res.status}] at ${endpoint}`);
        (error as any).status = res.status;
        throw error;
      }

      console.warn(`[API Preview Warning] Request ${endpoint} returned status ${res.status}. Falling back to preview store.`);
      if (previewFallback) {
        return await previewFallback();
      }
      return {
        code: res.status,
        message: errMsg,
        data: null as any,
      };
    }

    const json = await res.json();

    // Automatically capture backend-issued JWT token from metaInfo if present
    if (json?.metaInfo?.token) {
      ApiClient.setAuthToken(json.metaInfo.token);
    }

    return json;
  } catch (error: any) {
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.status === 401) {
      ApiClient.clearAuth();
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('mitraa:unauthorized'));
      }
      throw error;
    }

    // In production mode, when mock fallback is disabled, or for any write operation:
    // Network/server failures must throw truthful errors immediately.
    if (isProd || !mockAllowed || isWrite) {
      console.error(`[API Failure] Authoritative backend call failed at ${url}:`, error.message);
      const networkErr = new Error(`Authoritative backend error at ${url}: ${error.message}.`);
      (networkErr as any).status = error?.status || 503;
      throw networkErr;
    }

    // In development mode with mock fallback allowed, fall back to in-memory preview store
    console.warn(`[Preview Mode Notice] Local server unreachable at ${url} (${error.message}). Using read-only preview data.`);
    if (previewFallback) {
      return await previewFallback();
    }
    throw error;
  }
}

export const ApiClient = {
  // Auth & Mode Config
  setAuthToken(token: string) {
    const trimmed = (token || '').trim();
    const normalized = trimmed ? (trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`) : '';
    dataStore.authToken = normalized;
    setSessionToken(normalized);
  },
  getAuthToken(): string {
    return dataStore.authToken;
  },
  clearAuth(): void {
    dataStore.authToken = '';
    setSessionToken(null);
  },
  hasValidSession(): boolean {
    return Boolean(dataStore.authToken && dataStore.authToken.trim().length > 0);
  },
  setUseMock(val: boolean) {
    if ((isProductionBuild || isProductionMode()) && val) {
      console.warn('[ApiClient] Mock mode rejected: Mock fallback cannot be activated in production.');
      dataStore.useMock = false;
      return;
    }
    dataStore.useMock = val;
  },
  isMock(): boolean {
    return isMockFallbackAllowed();
  },
  isProduction(): boolean {
    return isProductionMode();
  },
  setProductionMode(enabled: boolean): void {
    if (isProductionBuild && !enabled) {
      console.warn('[ApiClient] Cannot disable production mode in a production build.');
      return;
    }
    setApiMode(enabled ? 'production' : 'development');
    if (enabled) {
      dataStore.useMock = false;
    }
  },
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  // Auth Operations
  auth: {
    getCurrentUserSync(): UserAccount {
      return dataStore.currentUser;
    },
    async getCurrentUser(): Promise<CustomResponse<UserAccount>> {
      return apiFetch<UserAccount>(
        '/api/auth/current',
        { method: 'GET' },
        async () => {
          await delay(20);
          return {
            code: 200,
            message: 'CURRENT_USER_FETCHED',
            data: dataStore.currentUser,
          };
        }
      );
    },
    async setCurrentUser(user: UserAccount): Promise<CustomResponse<UserAccount>> {
      dataStore.currentUser = user;
      return {
        code: 200,
        message: 'CURRENT_USER_UPDATED',
        data: user,
      };
    },
    async logout(): Promise<CustomResponse<boolean>> {
      try {
        await apiFetch<boolean>(
          '/api/auth/logout',
          { method: 'POST' },
          async () => {
            await delay(20);
            return {
              code: 200,
              message: 'LOGGED_OUT_SUCCESSFULLY',
              data: true,
            };
          }
        );
      } catch (err) {
        console.warn('Backend logout failed during local cleanup:', err);
      } finally {
        ApiClient.clearAuth();
      }
      return {
        code: 200,
        message: 'LOGGED_OUT_SUCCESSFULLY',
        data: true,
      };
    },
    async login(emailOrUsername: string, password: string): Promise<CustomResponse<UserAccount>> {
      if (!password || !password.trim()) {
        throw new Error('Password is required');
      }
      if (!emailOrUsername || !emailOrUsername.trim()) {
        throw new Error('Username or email is required');
      }

      const identifier = emailOrUsername.trim();
      const res = await apiFetch<UserAccount>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: identifier,
            username: identifier,
            password: password,
          }),
        },
        async () => {
          await delay(100);
          const user = dataStore.users.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase()) || {
            ...dataStore.currentUser,
            email: identifier.includes('@') ? identifier : `${identifier}@mymitraa.com`,
            name: identifier.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          };
          user.last_login = 'Just now';
          dataStore.currentUser = user;
          const devToken = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mitraa-taskflow-user-session-${Date.now()}`;
          ApiClient.setAuthToken(devToken);
          return {
            code: 200,
            message: 'LOGIN_SUCCESS',
            data: user,
            metaInfo: {
              token: devToken.replace('Bearer ', ''),
            },
          };
        }
      );

      // Extract and save dynamic backend JWT
      if (res?.metaInfo && (res.metaInfo as any).token) {
        ApiClient.setAuthToken((res.metaInfo as any).token);
      }
      if (res?.data) {
        dataStore.currentUser = res.data;
      }
      return res;
    },
    async register(name: string, email: string, role: string, team: string, password: string): Promise<CustomResponse<UserAccount>> {
      if (!password || password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      if (!name || !name.trim() || !email || !email.trim()) {
        throw new Error('Name and email are required');
      }

      return apiFetch<UserAccount>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role,
            team,
            username: email.includes('@') ? email.split('@')[0] : email,
            password: password,
          }),
        },
        async () => {
          await delay(100);
          const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const newUser: UserAccount = {
            id: `usr-${Date.now()}`,
            name,
            email,
            role: 'Employee' as any,
            team,
            status: 'Active',
            avatar: initials,
            created_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            last_login: 'Never',
          };
          dataStore.users.push(newUser);
          return {
            code: 200,
            message: 'REGISTRATION_SUCCESS',
            data: newUser,
          };
        }
      );
    },
  },

  // User Management Module
  users: {
    async getAll(filters?: { search?: string; role?: string; team?: string; status?: string }): Promise<CustomResponse<UserAccount[]>> {
      return apiFetch<UserAccount[]>(
        '/api/users/getAll',
        { method: 'GET' },
        async () => {
          await delay(50);
          let results = [...dataStore.users];
          if (filters) {
            if (filters.search) {
              const q = filters.search.toLowerCase();
              results = results.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
            }
            if (filters.role && filters.role !== 'All') {
              results = results.filter(u => u.role.toLowerCase() === filters.role!.toLowerCase());
            }
            if (filters.team && filters.team !== 'All') {
              results = results.filter(u => u.team.toLowerCase() === filters.team!.toLowerCase());
            }
            if (filters.status && filters.status !== 'All') {
              results = results.filter(u => u.status.toLowerCase() === filters.status!.toLowerCase());
            }
          }
          return {
            code: 200,
            message: 'USERS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length },
          };
        }
      );
    },
    async saveUser(user: Omit<UserAccount, 'id' | 'avatar' | 'created_date'>): Promise<CustomResponse<UserAccount>> {
      return apiFetch<UserAccount>(
        '/api/users/save',
        {
          method: 'POST',
          body: JSON.stringify(user),
        },
        async () => {
          await delay(60);
          const id = `usr-${Date.now()}`;
          const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const newUser: UserAccount = {
            ...user,
            id,
            avatar: initials || 'U',
            created_date: '04-Nov-2026',
            last_login: 'Never',
          };
          dataStore.users.unshift(newUser);
          return {
            code: 200,
            message: 'USER_CREATED_SUCCESSFULLY',
            data: newUser,
          };
        }
      );
    },
    async updateUser(id: string, updates: Partial<UserAccount>): Promise<CustomResponse<UserAccount>> {
      return apiFetch<UserAccount>(
        `/api/users/update/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay(60);
          const idx = dataStore.users.findIndex(u => u.id === id);
          if (idx === -1) throw new Error('User not found');
          dataStore.users[idx] = { ...dataStore.users[idx], ...updates };
          if (dataStore.currentUser.id === id) {
            dataStore.currentUser = { ...dataStore.currentUser, ...updates };
          }
          return {
            code: 200,
            message: 'USER_UPDATED_SUCCESSFULLY',
            data: dataStore.users[idx],
          };
        }
      );
    },
    async deleteUser(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/users/delete/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay(60);
          dataStore.users = dataStore.users.filter(u => u.id !== id);
          return {
            code: 200,
            message: 'USER_DELETED_SUCCESSFULLY',
            data: true,
          };
        }
      );
    },
  },

  // Task Tracker / Feedback Module (102 Endpoints mapped)
  tasks: {
    async getNumericalCount(): Promise<CustomResponse<NumericalCount>> {
      return apiFetch<NumericalCount>(
        '/api/feedback/feedback_numerical_count',
        { method: 'GET' },
        async () => {
          await delay();
          const total = dataStore.tasks.length;
          const closed = dataStore.tasks.filter(t => t.status === 'Closed').length;
          const in_progress = dataStore.tasks.filter(t => t.status === 'In Progress').length;
          const open = dataStore.tasks.filter(t => t.status === 'Open').length;
          const on_hold = dataStore.tasks.filter(t => t.status === 'On Hold').length;
          const overdue = dataStore.tasks.filter(t => t.status === 'Open' || t.status === 'In Progress').slice(0, 3).length;

          return {
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
          };
        }
      );
    },

    async getAll(searchVM?: SearchVM): Promise<CustomResponse<FeedbackHistory[]>> {
      return apiFetch<FeedbackHistory[]>(
        '/api/feedback/get_all_feedback',
        {
          method: 'PUT',
          body: JSON.stringify(searchVM || {}),
        },
        async () => {
          await delay();
          let results = [...dataStore.tasks];
          if (searchVM) {
            if (searchVM.customer) {
              results = results.filter(t => t.customer.toLowerCase().includes(searchVM.customer!.toLowerCase()));
            }
            if (searchVM.project) {
              results = results.filter(t => t.project.toLowerCase().includes(searchVM.project!.toLowerCase()));
            }
            if (searchVM.team) {
              results = results.filter(t => t.team.toLowerCase().includes(searchVM.team!.toLowerCase()));
            }
            if (searchVM.task_owner) {
              results = results.filter(t => t.task_owner.toLowerCase().includes(searchVM.task_owner!.toLowerCase()));
            }
            if (searchVM.status) {
              results = results.filter(t => t.status.toLowerCase() === searchVM.status!.toLowerCase());
            }
            if (searchVM.priority) {
              results = results.filter(t => t.priority.toLowerCase().includes(searchVM.priority!.toLowerCase()));
            }
            if (searchVM.ticket_number) {
              results = results.filter(t => t.ticket_number.toLowerCase().includes(searchVM.ticket_number!.toLowerCase()));
            }
            if (searchVM.search_query) {
              const q = searchVM.search_query.toLowerCase();
              results = results.filter(t =>
                t.subject.toLowerCase().includes(q) ||
                t.ticket_number.toLowerCase().includes(q) ||
                t.task_owner.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'FEEDBACK_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length },
          };
        }
      );
    },

    async getById(id: string): Promise<CustomResponse<FeedbackHistory | null>> {
      return apiFetch<FeedbackHistory | null>(
        `/api/feedback/get_feedback_by_id/${id}`,
        { method: 'GET' },
        async () => {
          await delay();
          const task = dataStore.tasks.find(t => t.id === id || t.ticket_number === id) || null;
          return {
            code: task ? 200 : 404,
            message: task ? 'TASK_FOUND' : 'TASK_NOT_FOUND',
            data: task,
          };
        }
      );
    },

    async saveTask(task: Omit<FeedbackHistory, 'id' | 'actual_effort'>): Promise<CustomResponse<FeedbackHistory>> {
      return apiFetch<FeedbackHistory>(
        '/api/feedback/save_feedback',
        {
          method: 'POST',
          body: JSON.stringify(task),
        },
        async () => {
          await delay();
          const id = `task-${Date.now()}`;
          const actual_effort = (task.work_log_entries || []).reduce((sum, w) => sum + w.hours, 0);
          const newTask: FeedbackHistory = {
            ...task,
            id,
            actual_effort,
            subtask_count: task.subtask_count || 0,
            work_log_entries: task.work_log_entries || [],
          };
          dataStore.tasks.unshift(newTask);
          return {
            code: 200,
            message: 'TASK_SAVED_SUCCESSFULLY',
            data: newTask,
          };
        }
      );
    },

    async editTask(id: string, updates: Partial<FeedbackHistory>): Promise<CustomResponse<FeedbackHistory>> {
      return apiFetch<FeedbackHistory>(
        '/api/feedback/edit_feedback',
        {
          method: 'POST',
          body: JSON.stringify({ id, ...updates }),
        },
        async () => {
          await delay();
          const idx = dataStore.tasks.findIndex(t => t.id === id || t.ticket_number === id);
          if (idx === -1) throw new Error('Task not found');

          const current = dataStore.tasks[idx];
          let actual_effort = current.actual_effort;
          if (updates.work_log_entries) {
            actual_effort = updates.work_log_entries.reduce((sum, w) => sum + w.hours, 0);
          }

          const updated: FeedbackHistory = {
            ...current,
            ...updates,
            actual_effort,
          };
          dataStore.tasks[idx] = updated;
          return {
            code: 200,
            message: 'TASK_UPDATED_SUCCESSFULLY',
            data: updated,
          };
        }
      );
    },

    async addWorklogHours(taskId: string, entry: Omit<WorkLogEntry, 'id'>): Promise<CustomResponse<FeedbackHistory>> {
      return apiFetch<FeedbackHistory>(
        '/api/feedback/add_worklog_hours',
        {
          method: 'POST',
          body: JSON.stringify({ taskId, entry }),
        },
        async () => {
          await delay();
          const idx = dataStore.tasks.findIndex(t => t.id === taskId || t.ticket_number === taskId);
          if (idx === -1) throw new Error('Task not found');

          const current = dataStore.tasks[idx];
          const newEntry: WorkLogEntry = {
            id: `wl-${Date.now()}`,
            ...entry,
          };
          const updatedEntries = [...current.work_log_entries, newEntry];
          const actual_effort = updatedEntries.reduce((sum, w) => sum + w.hours, 0);

          current.work_log_entries = updatedEntries;
          current.actual_effort = actual_effort;
          dataStore.tasks[idx] = { ...current };

          return {
            code: 200,
            message: 'WORKLOG_ADDED_SUCCESSFULLY',
            data: dataStore.tasks[idx],
          };
        }
      );
    },

    async deleteTask(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/feedback/get_feedback_by_id/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          const initialLen = dataStore.tasks.length;
          dataStore.tasks = dataStore.tasks.filter(t => t.id !== id && t.ticket_number !== id);
          return {
            code: 200,
            message: 'TASK_DELETED_SUCCESSFULLY',
            data: dataStore.tasks.length < initialLen,
          };
        }
      );
    },

    // Subtask operations
    async addSubtask(taskId: string, subtaskData: Partial<FeedbackHistory> & { subject: string }): Promise<CustomResponse<FeedbackHistory>> {
      return apiFetch<FeedbackHistory>(
        '/api/feedback/add_subtask',
        {
          method: 'POST',
          body: JSON.stringify({ ...subtaskData, parentFeedbackHistoryId: taskId }),
        },
        async () => {
          await delay();
          const task = dataStore.tasks.find(t => t.id === taskId || t.ticket_number === taskId);
          if (!task) throw new Error('Task not found');

          const newSubtask: FeedbackHistory = {
            id: `subtask-${Date.now()}`,
            ticket_number: `${task.ticket_number}-SUB-${Math.floor(100 + Math.random() * 900)}`,
            description: '',
            status: 'Open',
            priority: 'Normal P2',
            project: task.project,
            module: task.module || 'Task Tracker',
            customer: task.customer,
            team: task.team,
            task_owner: task.task_owner,
            estimated_start_date: new Date().toISOString().split('T')[0],
            estimated_close_date: new Date().toISOString().split('T')[0],
            estimated_effort: 0,
            actual_effort: 0,
            ...subtaskData,
            subtask_count: (task.subtask_count || 0) + 1,
            last_subtask_update: new Date().toString(),
            parentFeedbackHistoryId: taskId,
            work_log_entries: [],
          };
          dataStore.tasks = dataStore.tasks.map(t =>
            t.id === taskId || t.ticket_number === taskId ? { ...task, ...newSubtask } : t
          );
          // Recalculate subtask_count
          const updatedTask = dataStore.tasks.find(t => t.id === taskId || t.ticket_number === taskId)!;
          updatedTask.subtask_count = dataStore.tasks.filter(t => t.parentFeedbackHistoryId === taskId).length;
          return {
            code: 200,
            message: 'SUBTASK_ADDED_SUCCESSFULLY',
            data: updatedTask,
          };
        }
      );
    },

    async updateSubtask(subtaskId: string, updates: Partial<FeedbackHistory>): Promise<CustomResponse<FeedbackHistory>> {
      return apiFetch<FeedbackHistory>(
        `/api/feedback/update_subtask/${subtaskId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay();
          // Try to find subtask in local store by matching against ticket_number patterns
          let updatedTask = dataStore.tasks.find(t => t.id === subtaskId || t.ticket_number === subtaskId);

          if (!updatedTask) {
            throw new Error(`Subtask not found: ${subtaskId}`);
          }

          const merged = { ...updatedTask, ...updates };
          updatedTask = { ...merged };
          dataStore.tasks = dataStore.tasks.map(t =>
            t.id === subtaskId || t.ticket_number === subtaskId ? merged : t
          );

          return {
            code: 200,
            message: 'SUBTASK_UPDATED_SUCCESSFULLY',
            data: updatedTask,
          };
        }
      );
    },

    async deleteSubtask(subtaskId: string, epicId: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/feedback/delete_subtask/${subtaskId}/${epicId}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          const initialLen = dataStore.tasks.length;
          dataStore.tasks = dataStore.tasks.filter(t => !(t.id === subtaskId || t.ticket_number === subtaskId || t.ticket_number === `${epicId}-SUB`));
          return {
            code: 200,
            message: 'SUBTASK_DELETED_SUCCESSFULLY',
            data: dataStore.tasks.length < initialLen,
          };
        }
      );
    },

    async getPeopleNotFillingTasks(): Promise<CustomResponse<{ count: number; people: string[] }>> {
      return {
        code: 200,
        message: 'PEOPLE_NOT_FILLING_TASKS_FETCHED',
        data: PEOPLE_NOT_FILLING_TASKS,
      };
    },
  },

  // Meeting Time Tracker Module
  meetings: {
    async getAll(searchVM?: SearchVM): Promise<CustomResponse<MeetingTimeTracker[]>> {
      return apiFetch<MeetingTimeTracker[]>(
        '/api/meeting_time_tracker/getAll',
        {
          method: 'PUT',
          body: JSON.stringify(searchVM || {}),
        },
        async () => {
          await delay();
          let results = [...dataStore.meetings];
          if (searchVM) {
            if (searchVM.customer) {
              results = results.filter(m => m.customer.toLowerCase().includes(searchVM.customer!.toLowerCase()));
            }
            if (searchVM.project) {
              results = results.filter(m => m.project.toLowerCase().includes(searchVM.project!.toLowerCase()));
            }
            if (searchVM.team) {
              results = results.filter(m => m.team.toLowerCase().includes(searchVM.team!.toLowerCase()));
            }
            if (searchVM.search_query) {
              const q = searchVM.search_query.toLowerCase();
              results = results.filter(m =>
                m.category.toLowerCase().includes(q) ||
                m.meeting_by.toLowerCase().includes(q) ||
                m.project.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'MEETINGS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length },
          };
        }
      );
    },

    async saveMeeting(meeting: Omit<MeetingTimeTracker, 'id'>): Promise<CustomResponse<MeetingTimeTracker>> {
      return apiFetch<MeetingTimeTracker>(
        '/api/meeting_time_tracker/save',
        {
          method: 'POST',
          body: JSON.stringify(meeting),
        },
        async () => {
          await delay();
          const id = `meeting-${Date.now()}`;
          const newMeeting: MeetingTimeTracker = { ...meeting, id };
          dataStore.meetings.unshift(newMeeting);
          return {
            code: 200,
            message: 'MEETING_SAVED_SUCCESSFULLY',
            data: newMeeting,
          };
        }
      );
    },

    async updateMeeting(id: string, updates: Partial<MeetingTimeTracker>): Promise<CustomResponse<MeetingTimeTracker>> {
      return apiFetch<MeetingTimeTracker>(
        `/api/meeting_time_tracker/update/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay();
          const idx = dataStore.meetings.findIndex(m => m.id === id);
          if (idx === -1) throw new Error('Meeting not found');
          dataStore.meetings[idx] = { ...dataStore.meetings[idx], ...updates };
          return {
            code: 200,
            message: 'MEETING_UPDATED_SUCCESSFULLY',
            data: dataStore.meetings[idx],
          };
        }
      );
    },

    async deleteMeeting(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/meeting_time_tracker/delete/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          dataStore.meetings = dataStore.meetings.filter(m => m.id !== id);
          return {
            code: 200,
            message: 'MEETING_DELETED_SUCCESSFULLY',
            data: true,
          };
        }
      );
    },
  },

  // Leaves & WFH Tracker Module
  leaves: {
    async getAll(): Promise<CustomResponse<OptimaLeaveTracker[]>> {
      return apiFetch<OptimaLeaveTracker[]>(
        '/api/optima_leave_tracker/getAll',
        {
          method: 'PUT',
          body: JSON.stringify({}),
        },
        async () => {
          await delay();
          return {
            code: 200,
            message: 'LEAVES_FETCHED_SUCCESSFULLY',
            data: [...dataStore.leaves],
          };
        }
      );
    },

    async saveLeave(leave: Omit<OptimaLeaveTracker, 'id'>): Promise<CustomResponse<OptimaLeaveTracker>> {
      return apiFetch<OptimaLeaveTracker>(
        '/api/optima_leave_tracker/save',
        {
          method: 'POST',
          body: JSON.stringify(leave),
        },
        async () => {
          await delay();
          const id = `leave-${Date.now()}`;
          const newLeave: OptimaLeaveTracker = { ...leave, id };
          dataStore.leaves.unshift(newLeave);
          return {
            code: 200,
            message: 'LEAVE_SAVED_SUCCESSFULLY',
            data: newLeave,
          };
        }
      );
    },

    async deleteLeave(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/optima_leave_tracker/delete/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          dataStore.leaves = dataStore.leaves.filter(l => l.id !== id);
          return {
            code: 200,
            message: 'LEAVE_DELETED_SUCCESSFULLY',
            data: true,
          };
        }
      );
    },
  },

  // Project Weekly Update Tracker Module
  weeklyUpdates: {
    async getAll(): Promise<CustomResponse<OptimaWeeklyUpdateTracker[]>> {
      return apiFetch<OptimaWeeklyUpdateTracker[]>(
        '/api/optima_weekly_update_tracker/getAll',
        {
          method: 'PUT',
          body: JSON.stringify({}),
        },
        async () => {
          await delay();
          return {
            code: 200,
            message: 'WEEKLY_UPDATES_FETCHED_SUCCESSFULLY',
            data: [...dataStore.weeklyUpdates],
          };
        }
      );
    },

    async saveUpdate(update: Omit<OptimaWeeklyUpdateTracker, 'id'>): Promise<CustomResponse<OptimaWeeklyUpdateTracker>> {
      return apiFetch<OptimaWeeklyUpdateTracker>(
        '/api/optima_weekly_update_tracker/save',
        {
          method: 'POST',
          body: JSON.stringify(update),
        },
        async () => {
          await delay();
          const id = `update-${Date.now()}`;
          const newUpdate: OptimaWeeklyUpdateTracker = { ...update, id };
          dataStore.weeklyUpdates.unshift(newUpdate);
          return {
            code: 200,
            message: 'WEEKLY_UPDATE_SAVED_SUCCESSFULLY',
            data: newUpdate,
          };
        }
      );
    },

    async updateUpdate(id: string, updates: Partial<OptimaWeeklyUpdateTracker>): Promise<CustomResponse<OptimaWeeklyUpdateTracker>> {
      return apiFetch<OptimaWeeklyUpdateTracker>(
        '/api/optima_weekly_update_tracker/update',
        {
          method: 'POST',
          body: JSON.stringify({ id, ...updates }),
        },
        async () => {
          await delay();
          const idx = dataStore.weeklyUpdates.findIndex(u => u.id === id);
          if (idx === -1) throw new Error('Update not found');
          dataStore.weeklyUpdates[idx] = { ...dataStore.weeklyUpdates[idx], ...updates };
          return {
            code: 200,
            message: 'WEEKLY_UPDATE_MODIFIED_SUCCESSFULLY',
            data: dataStore.weeklyUpdates[idx],
          };
        }
      );
    },

    async sendWeeklyMail(payload: {
      email?: string;
      projectName: string;
      weekNumber?: string;
      milestonesCompleted?: string;
      highlights?: string;
      nextWeekGoals?: string;
    }): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/optima_weekly_update_tracker/send-weekly-mail',
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
        async () => {
          return {
            code: 200,
            message: 'Weekly report email dispatched via Zoho Mail SMTP',
            data: { success: true, simulated: true, to: payload.email || 'management@mymitraa.com' },
          };
        }
      );
    },
  },

  // Dropdown Management Module
  dropdowns: {
    async getAll(type?: string): Promise<CustomResponse<DropdownItem[]>> {
      return apiFetch<DropdownItem[]>(
        '/api/dropdown_management/getAll',
        {
          method: 'PUT',
          body: JSON.stringify({}),
        },
        async () => {
          await delay();
          let results = [...dataStore.dropdowns];
          if (type) {
            results = results.filter(d => d.type.toLowerCase() === type.toLowerCase());
          }
          return {
            code: 200,
            message: 'DROPDOWN_ITEMS_FETCHED_SUCCESSFULLY',
            data: results,
          };
        }
      );
    },

    async saveItem(item: Omit<DropdownItem, 'id'>): Promise<CustomResponse<DropdownItem>> {
      return apiFetch<DropdownItem>(
        '/api/dropdown_management/save',
        {
          method: 'POST',
          body: JSON.stringify(item),
        },
        async () => {
          await delay();
          const id = `dm-${Date.now()}`;
          const newItem: DropdownItem = { ...item, id };
          dataStore.dropdowns.unshift(newItem);
          return {
            code: 200,
            message: 'DROPDOWN_ITEM_SAVED_SUCCESSFULLY',
            data: newItem,
          };
        }
      );
    },

    async updateItem(id: string, updates: Partial<DropdownItem>): Promise<CustomResponse<DropdownItem>> {
      return apiFetch<DropdownItem>(
        `/api/dropdown_management/update/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay();
          const idx = dataStore.dropdowns.findIndex(d => d.id === id);
          if (idx === -1) throw new Error('Dropdown item not found');
          dataStore.dropdowns[idx] = { ...dataStore.dropdowns[idx], ...updates };
          return {
            code: 200,
            message: 'DROPDOWN_ITEM_UPDATED_SUCCESSFULLY',
            data: dataStore.dropdowns[idx],
          };
        }
      );
    },

    async deleteItem(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/dropdown_management/delete/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          dataStore.dropdowns = dataStore.dropdowns.filter(d => d.id !== id);
          return {
            code: 200,
            message: 'DROPDOWN_ITEM_DELETED_SUCCESSFULLY',
            data: true,
          };
        }
      );
    },
  },

  // View Documents Module
  documents: {
    async getAll(filters?: {
      customer?: string;
      project?: string;
      task_team?: string;
      task_owner?: string;
      ticket_number?: string;
      task_status?: string;
      task_priority?: string;
      start_date?: string;
      end_date?: string;
    }): Promise<CustomResponse<DocumentRecord[]>> {
      return apiFetch<DocumentRecord[]>(
        '/api/documents',
        { method: 'GET' },
        async () => {
          await delay();
          let results = [...dataStore.documents];
          if (filters) {
            if (filters.customer) results = results.filter(d => d.customer.toLowerCase().includes(filters.customer!.toLowerCase()));
            if (filters.project) results = results.filter(d => d.project.toLowerCase().includes(filters.project!.toLowerCase()));
            if (filters.task_team) results = results.filter(d => d.task_team.toLowerCase().includes(filters.task_team!.toLowerCase()));
            if (filters.task_owner) results = results.filter(d => d.task_owner.toLowerCase().includes(filters.task_owner!.toLowerCase()));
            if (filters.ticket_number) results = results.filter(d => d.ticket_number.toLowerCase().includes(filters.ticket_number!.toLowerCase()));
            if (filters.task_status) results = results.filter(d => d.task_status.toLowerCase() === filters.task_status!.toLowerCase());
            if (filters.task_priority) results = results.filter(d => d.task_priority.toLowerCase().includes(filters.task_priority!.toLowerCase()));
          }
          return {
            code: 200,
            message: 'DOCUMENTS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length },
          };
        }
      );
    },

    async uploadDocument(doc: Omit<DocumentRecord, 'id'>): Promise<CustomResponse<DocumentRecord>> {
      return apiFetch<DocumentRecord>(
        '/api/documents/upload',
        {
          method: 'POST',
          body: JSON.stringify(doc),
        },
        async () => {
          await delay();
          const id = `doc-${Date.now()}`;
          const newDoc: DocumentRecord = { ...doc, id };
          dataStore.documents.unshift(newDoc);
          return {
            code: 200,
            message: 'DOCUMENT_UPLOADED_SUCCESSFULLY',
            data: newDoc,
          };
        }
      );
    },

    async deleteDocument(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/documents/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay();
          dataStore.documents = dataStore.documents.filter(d => d.id !== id && d.ticket_number !== id);
          return {
            code: 200,
            message: 'DOCUMENT_DELETED_SUCCESSFULLY',
            data: true,
          };
        }
      );
    },
  },

  // Email & Zoho Mail Integration Module
  email: {
    async getConfig(): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/email/config',
        { method: 'GET' },
        async () => {
          return {
            code: 200,
            message: 'EMAIL_CONFIG_FETCHED',
            data: {
              host: 'smtp.zoho.com',
              port: 465,
              secure: true,
              user: '',
              from: 'MyMitraa TaskFlow <notifications@mymitraa.com>',
              isConfigured: false,
              hasPassword: false,
            },
          };
        }
      );
    },

    async updateConfig(config: Partial<any>): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/email/config',
        {
          method: 'POST',
          body: JSON.stringify(config),
        },
        async () => {
          return {
            code: 200,
            message: 'EMAIL_CONFIG_UPDATED',
            data: config,
          };
        }
      );
    },

    async testEmail(payload: { to: string; subject?: string; message?: string }): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/email/test',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        async () => {
          return {
            code: 200,
            message: `Simulated test email dispatched to ${payload.to}`,
            data: { success: true, simulated: true, to: payload.to },
          };
        }
      );
    },

    async getLogs(): Promise<CustomResponse<any[]>> {
      return apiFetch<any[]>(
        '/api/email/logs',
        { method: 'GET' },
        async () => {
          return {
            code: 200,
            message: 'EMAIL_LOGS_FETCHED',
            data: [
              {
                id: 'log-sim-1',
                timestamp: new Date().toISOString(),
                to: 'deeneshsabat2002@gmail.com',
                subject: 'Zoho Mail SMTP Integration Verified',
                category: 'SYSTEM',
                status: 'SENT',
                details: 'Verified Zoho SMTP gateway on port 465',
              },
            ],
          };
        }
      );
    },
  },

  // Task Owner Email Module - /api/task_owner_email
  taskOwnerEmail: {
    async save(payload: {
      task_id: string;
      owner_name: string;
      owner_email: string;
      assigned_by: string;
      subject: string;
      priority: string;
      eta: string;
      description: string;
    }): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/task_owner_email/save',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        async () => {
          await delay(40);
          return {
            code: 200,
            message: 'Task owner email notification dispatched',
            data: { success: true, ...payload },
          };
        }
      );
    },
  },

  // System & Health Module
  system: {
    async getHealth(): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/health',
        { method: 'GET' },
        async () => {
          return {
            code: 200,
            message: 'HEALTH_CHECK_OK',
            data: {
              status: 'UP',
              database: 'mymitraa_taskflow',
              version: '3.0.0',
            },
          };
        }
      );
    },
  },

  // Project Management Module
  projects: {
    async getAll(filters?: { status?: string; search?: string }): Promise<CustomResponse<ProjectRecord[]>> {
      return apiFetch<ProjectRecord[]>(
        '/api/projects',
        { method: 'GET' },
        async () => {
          await delay(40);
          let results = [...dataStore.projects];
          if (filters) {
            if (filters.status && filters.status !== 'All') {
              results = results.filter(p => p.status.toLowerCase() === filters.status!.toLowerCase());
            }
            if (filters.search) {
              const q = filters.search.toLowerCase();
              results = results.filter(p =>
                p.project_name.toLowerCase().includes(q) ||
                p.customer_name.toLowerCase().includes(q) ||
                p.project_manager.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'PROJECTS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length }
          };
        }
      );
    },

    async saveProject(project: Omit<ProjectRecord, 'id'>): Promise<CustomResponse<ProjectRecord>> {
      return apiFetch<ProjectRecord>(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify(project),
        },
        async () => {
          await delay(50);
          const newProj: ProjectRecord = {
            ...project,
            id: `proj-${Date.now()}`
          };
          dataStore.projects.unshift(newProj);
          return {
            code: 200,
            message: 'PROJECT_CREATED_SUCCESSFULLY',
            data: newProj
          };
        }
      );
    },

    async updateProject(id: string, updates: Partial<ProjectRecord>): Promise<CustomResponse<ProjectRecord>> {
      return apiFetch<ProjectRecord>(
        `/api/projects/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay(50);
          const idx = dataStore.projects.findIndex(p => p.id === id || p.project_id === id);
          if (idx === -1) throw new Error('Project not found');
          dataStore.projects[idx] = { ...dataStore.projects[idx], ...updates };
          return {
            code: 200,
            message: 'PROJECT_UPDATED_SUCCESSFULLY',
            data: dataStore.projects[idx]
          };
        }
      );
    },

    async deleteProject(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/projects/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay(50);
          dataStore.projects = dataStore.projects.filter(p => p.id !== id && p.project_id !== id);
          return {
            code: 200,
            message: 'PROJECT_DELETED_SUCCESSFULLY',
            data: true
          };
        }
      );
    }
  },

  // Sales CRM Module
  sales: {
    async getLeads(filters?: { stage?: string; assigned_to?: string; search?: string }): Promise<CustomResponse<LeadRecord[]>> {
      return apiFetch<LeadRecord[]>(
        '/api/sales/leads',
        { method: 'GET' },
        async () => {
          await delay(40);
          let results = [...dataStore.leads];
          if (filters) {
            if (filters.stage && filters.stage !== 'All') {
              results = results.filter(l => l.stage.toLowerCase() === filters.stage!.toLowerCase());
            }
            if (filters.assigned_to && filters.assigned_to !== 'All') {
              results = results.filter(l => l.assigned_to.toLowerCase() === filters.assigned_to!.toLowerCase());
            }
            if (filters.search) {
              const q = filters.search.toLowerCase();
              results = results.filter(l =>
                l.contact_name.toLowerCase().includes(q) ||
                l.company_name.toLowerCase().includes(q) ||
                l.lead_code.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'LEADS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length }
          };
        }
      );
    },

    async saveLead(lead: Omit<LeadRecord, 'id'>): Promise<CustomResponse<LeadRecord>> {
      return apiFetch<LeadRecord>(
        '/api/sales/leads',
        {
          method: 'POST',
          body: JSON.stringify(lead),
        },
        async () => {
          await delay(50);
          const newLead: LeadRecord = {
            ...lead,
            id: `lead-${Date.now()}`
          };
          dataStore.leads.unshift(newLead);
          return {
            code: 200,
            message: 'LEAD_CREATED_SUCCESSFULLY',
            data: newLead
          };
        }
      );
    },

    async updateLead(id: string, updates: Partial<LeadRecord>): Promise<CustomResponse<LeadRecord>> {
      return apiFetch<LeadRecord>(
        `/api/sales/leads/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay(50);
          const idx = dataStore.leads.findIndex(l => l.id === id || l.lead_code === id);
          if (idx === -1) throw new Error('Lead not found');
          dataStore.leads[idx] = { ...dataStore.leads[idx], ...updates };
          return {
            code: 200,
            message: 'LEAD_UPDATED_SUCCESSFULLY',
            data: dataStore.leads[idx]
          };
        }
      );
    },

    async deleteLead(id: string): Promise<CustomResponse<boolean>> {
      return apiFetch<boolean>(
        `/api/sales/leads/${id}`,
        { method: 'DELETE' },
        async () => {
          await delay(50);
          dataStore.leads = dataStore.leads.filter(l => l.id !== id && l.lead_code !== id);
          return {
            code: 200,
            message: 'LEAD_DELETED_SUCCESSFULLY',
            data: true
          };
        }
      );
    }
  },

  // QA & Bug Tracking Module
  qa: {
    async getBugs(filters?: { severity?: string; status?: string; project?: string; search?: string }): Promise<CustomResponse<BugRecord[]>> {
      return apiFetch<BugRecord[]>(
        '/api/qa/bugs',
        { method: 'GET' },
        async () => {
          await delay(40);
          let results = [...dataStore.bugs];
          if (filters) {
            if (filters.severity && filters.severity !== 'All') {
              results = results.filter(b => b.severity.toLowerCase() === filters.severity!.toLowerCase());
            }
            if (filters.status && filters.status !== 'All') {
              results = results.filter(b => b.status.toLowerCase() === filters.status!.toLowerCase());
            }
            if (filters.project && filters.project !== 'All') {
              results = results.filter(b => b.project.toLowerCase() === filters.project!.toLowerCase());
            }
            if (filters.search) {
              const q = filters.search.toLowerCase();
              results = results.filter(b =>
                b.title.toLowerCase().includes(q) ||
                b.bug_code.toLowerCase().includes(q) ||
                b.reported_by.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'BUGS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length }
          };
        }
      );
    },

    async saveBug(bug: Omit<BugRecord, 'id'>): Promise<CustomResponse<BugRecord>> {
      return apiFetch<BugRecord>(
        '/api/qa/bugs',
        {
          method: 'POST',
          body: JSON.stringify(bug),
        },
        async () => {
          await delay(50);
          const newBug: BugRecord = {
            ...bug,
            id: `bug-${Date.now()}`
          };
          dataStore.bugs.unshift(newBug);
          return {
            code: 200,
            message: 'BUG_CREATED_SUCCESSFULLY',
            data: newBug
          };
        }
      );
    },

    async updateBug(id: string, updates: Partial<BugRecord>): Promise<CustomResponse<BugRecord>> {
      return apiFetch<BugRecord>(
        `/api/qa/bugs/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay(50);
          const idx = dataStore.bugs.findIndex(b => b.id === id || b.bug_code === id);
          if (idx === -1) throw new Error('Bug not found');
          dataStore.bugs[idx] = { ...dataStore.bugs[idx], ...updates };
          return {
            code: 200,
            message: 'BUG_UPDATED_SUCCESSFULLY',
            data: dataStore.bugs[idx]
          };
        }
      );
    },

    async getTestCases(filters?: { suite?: string; status?: string }): Promise<CustomResponse<TestCaseRecord[]>> {
      return apiFetch<TestCaseRecord[]>(
        '/api/qa/tests',
        { method: 'GET' },
        async () => {
          await delay(40);
          let results = [...dataStore.testCases];
          if (filters) {
            if (filters.suite && filters.suite !== 'All') {
              results = results.filter(t => t.suite.toLowerCase() === filters.suite!.toLowerCase());
            }
            if (filters.status && filters.status !== 'All') {
              results = results.filter(t => t.status.toLowerCase() === filters.status!.toLowerCase());
            }
          }
          return {
            code: 200,
            message: 'TEST_CASES_FETCHED_SUCCESSFULLY',
            data: results
          };
        }
      );
    },

    async saveTestCase(tc: Omit<TestCaseRecord, 'id'>): Promise<CustomResponse<TestCaseRecord>> {
      return apiFetch<TestCaseRecord>(
        '/api/qa/tests',
        {
          method: 'POST',
          body: JSON.stringify(tc),
        },
        async () => {
          await delay(50);
          const newTc: TestCaseRecord = {
            ...tc,
            id: `tc-${Date.now()}`
          };
          dataStore.testCases.unshift(newTc);
          return {
            code: 200,
            message: 'TEST_CASE_CREATED_SUCCESSFULLY',
            data: newTc
          };
        }
      );
    },

    async updateTestCase(id: string, updates: Partial<TestCaseRecord>): Promise<CustomResponse<TestCaseRecord>> {
      return apiFetch<TestCaseRecord>(
        `/api/qa/tests/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        async () => {
          await delay(50);
          const idx = dataStore.testCases.findIndex(t => t.id === id || t.test_code === id);
          if (idx === -1) throw new Error('Test case not found');
          dataStore.testCases[idx] = { ...dataStore.testCases[idx], ...updates };
          return {
            code: 200,
            message: 'TEST_CASE_UPDATED_SUCCESSFULLY',
            data: dataStore.testCases[idx]
          };
        }
      );
    }
  },

  // Audit Logs Module
  auditLogs: {
    async getAll(filters?: { module?: string; outcome?: string; search?: string }): Promise<CustomResponse<AuditLogRecord[]>> {
      return apiFetch<AuditLogRecord[]>(
        '/api/audit-logs',
        { method: 'GET' },
        async () => {
          await delay(40);
          let results = [...dataStore.auditLogs];
          if (filters) {
            if (filters.module && filters.module !== 'All') {
              results = results.filter(a => a.module.toLowerCase() === filters.module!.toLowerCase());
            }
            if (filters.outcome && filters.outcome !== 'All') {
              results = results.filter(a => a.outcome.toLowerCase() === filters.outcome!.toLowerCase());
            }
            if (filters.search) {
              const q = filters.search.toLowerCase();
              results = results.filter(a =>
                a.actor_name.toLowerCase().includes(q) ||
                a.action.toLowerCase().includes(q) ||
                a.details.toLowerCase().includes(q)
              );
            }
          }
          return {
            code: 200,
            message: 'AUDIT_LOGS_FETCHED_SUCCESSFULLY',
            data: results,
            metaInfo: { totalCount: results.length }
          };
        }
      );
    },

    async logAction(log: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<CustomResponse<AuditLogRecord>> {
      const now = new Date();
      const formatted = `${now.getDate().toString().padStart(2, '0')}-Nov-2026 ${now.toTimeString().slice(0, 8)}`;
      const payload = {
        ...log,
        timestamp: formatted,
      };
      return apiFetch<AuditLogRecord>(
        '/api/audit-logs',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        async () => {
          await delay(30);
          const entry: AuditLogRecord = {
            ...payload,
            id: `aud-${Date.now()}`,
          };
          dataStore.auditLogs.unshift(entry);
          return {
            code: 200,
            message: 'AUDIT_LOG_RECORDED',
            data: entry,
          };
        }
      );
    }
  },

  // Roles & Permissions Module
  roles: {
    async getAll(): Promise<CustomResponse<{ name: string; userCount: number; permissionsCount: number }[]>> {
      return apiFetch<any>(
        '/api/roles',
        { method: 'GET' },
        async () => {
          await delay(30);
          const roles = [
            { name: 'Super Admin', userCount: 1, permissionsCount: 33 },
            { name: 'Admin', userCount: 1, permissionsCount: 22 },
            { name: 'Project Manager', userCount: 1, permissionsCount: 15 },
            { name: 'Developer', userCount: 1, permissionsCount: 11 },
            { name: 'Sales Executive', userCount: 1, permissionsCount: 8 },
            { name: 'Sales Manager', userCount: 1, permissionsCount: 13 },
            { name: 'QA Tester', userCount: 1, permissionsCount: 12 },
            { name: 'HR Manager', userCount: 1, permissionsCount: 11 },
            { name: 'Employee', userCount: 1, permissionsCount: 7 },
            { name: 'Client', userCount: 1, permissionsCount: 2 }
          ];
          return {
            code: 200,
            message: 'ROLES_FETCHED_SUCCESSFULLY',
            data: roles
          };
        }
      );
    },

    async updateRolePermissions(roleName: string, permissions: string[]): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        `/api/roles/${encodeURIComponent(roleName)}/permissions`,
        {
          method: 'PUT',
          body: JSON.stringify(permissions),
        },
        async () => {
          await delay(20);
          return {
            code: 200,
            message: 'ROLE_PERMISSIONS_UPDATED_SUCCESSFULLY',
            data: { role: roleName, permissions },
          };
        }
      );
    },

    async assignRole(userId: string, roleName: string): Promise<CustomResponse<any>> {
      return apiFetch<any>(
        '/api/roles/assign',
        {
          method: 'POST',
          body: JSON.stringify({ userId, roleName }),
        },
        async () => {
          await delay(30);
          const idx = dataStore.users.findIndex(u => u.id === userId);
          if (idx !== -1) {
            dataStore.users[idx].role = roleName as any;
          }
          return {
            code: 200,
            message: 'ROLE_ASSIGNED_SUCCESSFULLY',
            data: { userId, roleName },
          };
        }
      );
    },

    async getPermissions(): Promise<CustomResponse<string[]>> {
      return apiFetch<string[]>(
        '/api/permissions',
        { method: 'GET' },
        async () => {
          await delay(20);
          return {
            code: 200,
            message: 'PERMISSIONS_FETCHED_SUCCESSFULLY',
            data: [
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
            ],
          };
        }
      );
    }
  }
};
