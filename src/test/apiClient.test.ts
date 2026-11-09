/**
 * API Client Integration & Resilience Tests
 * Verifies API communication, token injection, and production error enforcement
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, dataStore } from '../api/client';

describe('ApiClient Core Operations & Error Resilience', () => {
  beforeEach(() => {
    // Reset auth token to known state
    ApiClient.setAuthToken('Bearer test-jwt-session-token-123');
  });

  it('manages authorization token correctly in datastore and sessionStorage', () => {
    ApiClient.clearAuth();
    expect(ApiClient.hasValidSession()).toBe(false);
    expect(ApiClient.getAuthToken()).toBe('');

    ApiClient.setAuthToken('test-jwt-token-123');
    expect(ApiClient.hasValidSession()).toBe(true);
    expect(ApiClient.getAuthToken()).toBe('Bearer test-jwt-token-123');

    ApiClient.setAuthToken('Bearer custom-jwt-456');
    expect(ApiClient.getAuthToken()).toBe('Bearer custom-jwt-456');

    ApiClient.clearAuth();
    expect(ApiClient.hasValidSession()).toBe(false);
    expect(ApiClient.getAuthToken()).toBe('');
  });

  it('rejects login attempts with missing or empty password', async () => {
    await expect(ApiClient.auth.login('user@test.com', '')).rejects.toThrow('Password is required');
    await expect(ApiClient.auth.login('user@test.com', '   ')).rejects.toThrow('Password is required');
  });

  it('retrieves current authenticated user synchronously and asynchronously', async () => {
    const userSync = ApiClient.auth.getCurrentUserSync();
    expect(userSync).toBeDefined();
    expect(userSync.email).toBeDefined();

    const userAsync = await ApiClient.auth.getCurrentUser();
    expect(userAsync.code).toBe(200);
    expect(userAsync.data).toBeDefined();
    expect(userAsync.data.name).toBe(userSync.name);
  });

  it('switches current user context and reflects in state', async () => {
    const originalUser = ApiClient.auth.getCurrentUserSync();
    const newUser = {
      ...originalUser,
      id: 'usr-switch-test',
      name: 'Switched Tester',
      role: 'QA Tester' as const,
      email: 'tester.qa@mymitraa.com',
    };

    await ApiClient.auth.setCurrentUser(newUser);
    expect(ApiClient.auth.getCurrentUserSync().name).toBe('Switched Tester');
    expect(ApiClient.auth.getCurrentUserSync().role).toBe('QA Tester');

    // Restore original user
    await ApiClient.auth.setCurrentUser(originalUser);
  });

  it('retrieves numerical task counts for dashboard analytics', async () => {
    const res = await ApiClient.tasks.getNumericalCount();
    expect(res.code).toBe(200);
    expect(res.data).toBeDefined();
    expect(typeof res.data.total).toBe('number');
    expect(typeof res.data.closed).toBe('number');
    expect(typeof res.data.open).toBe('number');
  });

  it('supports filtering tasks by owner, status, and project', async () => {
    const allRes = await ApiClient.tasks.getAll();
    expect(allRes.code).toBe(200);
    expect(Array.isArray(allRes.data)).toBe(true);
    expect(allRes.data.length).toBeGreaterThan(0);

    const filtered = await ApiClient.tasks.getAll({ status: 'Open' });
    expect(filtered.code).toBe(200);
    filtered.data.forEach(task => {
      expect(task.status).toBe('Open');
    });
  });

  it('supports project management retrieval and status filtering', async () => {
    const projects = await ApiClient.projects.getAll();
    expect(projects.code).toBe(200);
    expect(Array.isArray(projects.data)).toBe(true);

    if (projects.data.length > 0) {
      const first = projects.data[0];
      expect(first.project_name).toBeDefined();
      expect(first.project_id).toBeDefined();
    }
  });

  it('supports sales CRM leads retrieval and pipeline management', async () => {
    const leads = await ApiClient.sales.getLeads();
    expect(leads.code).toBe(200);
    expect(Array.isArray(leads.data)).toBe(true);
  });

  it('supports QA bug tracking retrieval', async () => {
    const bugs = await ApiClient.qa.getBugs();
    expect(bugs.code).toBe(200);
    expect(Array.isArray(bugs.data)).toBe(true);
  });

  it('supports audit logs retrieval', async () => {
    const logs = await ApiClient.auditLogs.getAll();
    expect(logs.code).toBe(200);
    expect(Array.isArray(logs.data)).toBe(true);
  });

  it('correctly resolves API URLs without double /api/api/ prefixes', async () => {
    const { resolveApiUrl } = await import('../api/client');
    expect(resolveApiUrl('', '/api/feedback/get_all_feedback')).toBe('/api/feedback/get_all_feedback');
    expect(resolveApiUrl('/api', '/api/feedback/get_all_feedback')).toBe('/api/feedback/get_all_feedback');
    expect(resolveApiUrl('/api/', '/api/optima_weekly_update_tracker/getAll')).toBe('/api/optima_weekly_update_tracker/getAll');
    expect(resolveApiUrl('https://task.mitratechgroup.com', '/api/users/getAll')).toBe('https://task.mitratechgroup.com/api/users/getAll');
    expect(resolveApiUrl('https://task.mitratechgroup.com/api', '/api/users/getAll')).toBe('https://task.mitratechgroup.com/api/users/getAll');
  });

  it('differentiates search query PUT endpoints from data mutation write operations', async () => {
    const { isWriteEndpoint } = await import('../api/client');
    // SearchVM query endpoints use PUT in Spring Boot but are read operations
    expect(isWriteEndpoint('PUT', '/api/feedback/get_all_feedback')).toBe(false);
    expect(isWriteEndpoint('PUT', '/api/optima_weekly_update_tracker/getAll')).toBe(false);
    expect(isWriteEndpoint('PUT', '/api/meeting_time_tracker/getAll')).toBe(false);
    expect(isWriteEndpoint('PUT', '/api/optima_leave_tracker/getAll')).toBe(false);
    expect(isWriteEndpoint('PUT', '/api/dropdown_management/getAll')).toBe(false);
    expect(isWriteEndpoint('PUT', '/api/optima_weekly_update_tracker/advance_search')).toBe(false);

    // Standard GET operations are read operations
    expect(isWriteEndpoint('GET', '/api/users/getAll')).toBe(false);

    // Actual write operations must be identified as writes
    expect(isWriteEndpoint('POST', '/api/users/save')).toBe(true);
    expect(isWriteEndpoint('PUT', '/api/users/update/usr-123')).toBe(true);
    expect(isWriteEndpoint('DELETE', '/api/users/delete/usr-123')).toBe(true);
    expect(isWriteEndpoint('POST', '/api/feedback/save_feedback')).toBe(true);
  });

  it('retrieves weekly updates successfully via weeklyUpdates.getAll', async () => {
    const res = await ApiClient.weeklyUpdates.getAll();
    expect(res.code).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  // ==========================================
  // PHASE 3: API & MOCK ISOLATION TESTS
  // ==========================================

  it('Phase 3: Production backend failure does not return mock records and throws loud error', async () => {
    ApiClient.setProductionMode(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Connection refused: 127.0.0.1:8080 is unreachable')
    );

    await expect(ApiClient.tasks.getAll()).rejects.toThrow(/Authoritative backend error/i);
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
    ApiClient.setProductionMode(false);
  });

  it('Phase 3: Production API 503 errors are surfaced truthfully without mock fallback', async () => {
    ApiClient.setProductionMode(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 503,
          message: 'Authoritative Spring Boot backend is offline on VPS 201.18.214.36',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(ApiClient.projects.getAll()).rejects.toThrow(/Authoritative Spring Boot backend is offline/i);
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
    ApiClient.setProductionMode(false);
  });

  it('Phase 3: Production mode rejects mock mode activation and forces useMock to false', () => {
    ApiClient.setProductionMode(true);
    expect(ApiClient.isProduction()).toBe(true);

    // Attempting to activate mock in production must be rejected
    ApiClient.setUseMock(true);
    expect(ApiClient.isMock()).toBe(false);

    ApiClient.setProductionMode(false);
    ApiClient.setUseMock(true);
    expect(ApiClient.isMock()).toBe(true);
  });

  it('Phase 3: Development mock mode can be explicitly disabled to verify failure states', async () => {
    ApiClient.setProductionMode(false);
    ApiClient.setUseMock(false);
    expect(ApiClient.isMock()).toBe(false);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' })
    );

    // When mock is disabled, even in development, failure must throw instead of returning fallback
    await expect(ApiClient.tasks.getAll()).rejects.toThrow(/Operation failed \[HTTP 503\]/i);
    fetchSpy.mockRestore();

    // Re-enable mock mode for development tests
    ApiClient.setUseMock(true);
    expect(ApiClient.isMock()).toBe(true);
  });

  it('Phase 3: HTTP 401 handling clears session, dispatches unauthorized event, and throws', async () => {
    ApiClient.setAuthToken('test-token-to-be-cleared');
    expect(ApiClient.hasValidSession()).toBe(true);

    let eventFired = false;
    const listener = () => { eventFired = true; };
    window.addEventListener('mitraa:unauthorized', listener);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 401,
          message: 'JWT expired or signature invalid',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(ApiClient.users.getAll()).rejects.toThrow(/JWT expired or signature invalid/i);
    expect(ApiClient.hasValidSession()).toBe(false);
    expect(ApiClient.getAuthToken()).toBe('');
    expect(eventFired).toBe(true);

    window.removeEventListener('mitraa:unauthorized', listener);
    fetchSpy.mockRestore();
  });

  it('Phase 3: TaskOwnerEmail module is typed and correctly saves task assignment notifications', async () => {
    const payload = {
      task_id: 'MTF-2026',
      owner_name: 'Lead Developer',
      owner_email: 'lead@mymitraa.com',
      assigned_by: 'Engineering Lead',
      subject: 'Phase 3 Verification',
      priority: 'Critical P0',
      eta: '10-Nov-2026',
      description: 'API & Mock isolation verified across all controllers.',
    };

    const res = await ApiClient.taskOwnerEmail.save(payload);
    expect(res.code).toBe(200);
    expect(res.message).toBeDefined();
    expect(res.data).toBeDefined();
  });

  it('Phase 3: AuditLogs logAction routes through apiFetch without in-memory bypass', async () => {
    const res = await ApiClient.auditLogs.logAction({
      user_id: 'usr-admin-1',
      actor_name: 'Deenesh Sabat',
      actor_role: 'Super Admin',
      action: 'ISOLATE_MOCKS_PHASE3',
      module: 'API_ARCHITECTURE',
      details: 'Strict production backend enforcement enabled',
      outcome: 'SUCCESS',
    });

    expect(res.code).toBe(200);
    expect(res.message).toBe('AUDIT_LOG_RECORDED');
    expect(res.data.action).toBe('ISOLATE_MOCKS_PHASE3');
  });
});
