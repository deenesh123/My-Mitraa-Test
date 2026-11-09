/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { HomeDashboard } from './pages/home/HomeDashboard';
import { ReportsPage } from './pages/reports/ReportsPage';
import { MeetingTracker } from './pages/meetings/MeetingTracker';
import { LeaveWfhTracker } from './pages/leaves/LeaveWfhTracker';
import { ProjectStatus } from './pages/project-status/ProjectStatus';
import { ViewDocuments } from './pages/documents/ViewDocuments';
import { TaskCalendarView } from './pages/calendar/TaskCalendarView';
import { TimelineView } from './pages/timeline/TimelineView';
import { DropdownManagement } from './pages/dropdowns/DropdownManagement';
import { TaskTrackerPage } from './pages/tasks/TaskTrackerPage';
import { PlaceholderPage } from './pages/common/PlaceholderPage';
import { ApiClient } from './api/client';

import { AuthPage } from './pages/auth/AuthPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { EmailZohoManagement } from './pages/email/EmailZohoManagement';
import { ProjectManagementPage } from './pages/projects/ProjectManagementPage';
import { SalesCrmPage } from './pages/sales/SalesCrmPage';
import { QaBugTrackerPage } from './pages/qa/QaBugTrackerPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { RolesPermissionsPage } from './pages/admin/RolesPermissionsPage';
import { CURRENT_USER } from './api/mockData';
import { UserAccount } from './api/types';
import { ThemeProvider } from './context/ThemeContext';
import { canAccessRoute } from './utils/rbac';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    return ApiClient.auth.getCurrentUserSync();
  });

  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    // Check hash or pathname
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('/')) return hash;
    return window.location.pathname || '/';
  });

  const [openTasksCount, setOpenTasksCount] = useState<number>(24);

  // Initial boot session verification through real backend current-user endpoint
  useEffect(() => {
    let isMounted = true;
    const token = ApiClient.getAuthToken();
    if (!token) {
      if (isMounted) {
        setIsAuthenticated(false);
        setIsVerifyingSession(false);
      }
      return;
    }

    ApiClient.auth.getCurrentUser()
      .then(res => {
        if (!isMounted) return;
        if (res && res.code === 200 && res.data) {
          setCurrentUser(res.data);
          setIsAuthenticated(true);
        } else {
          ApiClient.clearAuth();
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        ApiClient.clearAuth();
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) {
          setIsVerifyingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for global 401 unauthorized / session expiration events
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      ApiClient.clearAuth();
    };
    window.addEventListener('mitraa:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mitraa:unauthorized', handleUnauthorized);
  }, []);

  // Sync route changes
  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    await ApiClient.auth.logout();
    setIsAuthenticated(false);
  };

  const handleSwitchUser = (user: UserAccount) => {
    setCurrentUser(user);
    ApiClient.auth.setCurrentUser(user);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync open tasks badge count with API client
  useEffect(() => {
    if (!isAuthenticated) return;
    ApiClient.tasks.getAll().then(res => {
      const myOpen = res.data.filter(t => 
        (t.task_owner === currentUser.name || t.assigned_by === currentUser.name) &&
        t.status !== 'Closed'
      ).length;
      if (myOpen > 0) setOpenTasksCount(myOpen);
    });
  }, [currentRoute, isAuthenticated, currentUser]);

  // Render current page component
  const renderPage = () => {
    // Route authorization check
    if (!canAccessRoute(currentUser as any, currentRoute)) {
      return (
        <div className="p-12 text-center max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Access Denied (HTTP 403)</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your active role <span className="font-bold text-[#7B3AEC]">{currentUser.role}</span> does not possess the permissions required to view <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">{currentRoute}</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleNavigate('/')}
            className="px-6 py-2 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (currentRoute) {
      case '/':
        return <HomeDashboard onNavigate={handleNavigate} currentUser={currentUser} />;
      case '/projects':
        return <ProjectManagementPage currentUser={currentUser} />;
      case '/sales-crm':
        return <SalesCrmPage currentUser={currentUser} />;
      case '/qa-bugs':
        return <QaBugTrackerPage currentUser={currentUser} />;
      case '/task-dashboard':
        return <ReportsPage />;
      case '/meeting-tracker':
        return <MeetingTracker />;
      case '/leave-wfh-dashboard':
        return <LeaveWfhTracker />;
      case '/project-weekly-status':
        return <ProjectStatus />;
      case '/task-upload-files':
        return <ViewDocuments />;
      case '/users/task-calendar-view':
        return <TaskCalendarView />;
      case '/users/timeline-view':
        return <TimelineView />;
      case '/users/dropdown-management':
        return <DropdownManagement />;
      case '/users/user-management':
        return <UserManagementPage />;
      case '/admin/roles-permissions':
        return <RolesPermissionsPage />;
      case '/admin/audit-logs':
        return <AuditLogsPage currentUser={currentUser} />;
      case '/admin/email-zoho':
        return <EmailZohoManagement />;
      case '/task-tracker':
        return <TaskTrackerPage />;
      case '/help-support':
        return (
          <PlaceholderPage
            title="Help & Support"
            subtitle="MY MiTRAA TaskFlow user guides, API documentation, and engineering support desk"
            onNavigate={handleNavigate}
          />
        );
      default:
        return <HomeDashboard onNavigate={handleNavigate} currentUser={currentUser} />;
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080D1A] text-white">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-400 font-medium tracking-wider uppercase">
          Verifying Enterprise Session...
        </p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        {!isAuthenticated ? (
          <AuthPage onSuccess={handleLoginSuccess} />
        ) : (
          <AppLayout
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            openTasksCount={openTasksCount}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onSwitchUser={handleSwitchUser}
          >
            {renderPage()}
          </AppLayout>
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
