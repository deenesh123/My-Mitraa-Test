import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Trophy,
  Users,
  Sparkles,
  ChevronRight,
  Check,
  CheckSquare,
  Plus
} from 'lucide-react';
import { ApiClient } from '../../api/client';
import { FeedbackHistory, MeetingTimeTracker, OptimaLeaveTracker, NumericalCount } from '../../api/types';
import { PROJECTS, TEAMS, MODULES, CUSTOMERS } from '../../api/mockData';
import { MascotPenguin } from '../../components/mascot/MascotPenguin';
import { DateRangeBox } from '../../components/common/DateRangeBox';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { Skeleton } from '../../components/common/Skeleton';
import { MascotEmpty } from '../../components/common/MascotEmpty';
import { ModuleUploadTrigger } from '../../components/common/ModuleUploadTrigger';
import { useAppTheme } from '../../context/ThemeContext';
import { UserAccount } from '../../api/types';
import { CURRENT_USER } from '../../api/mockData';

interface HomeDashboardProps {
  onNavigate: (route: string) => void;
  currentUser?: UserAccount;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, currentUser = CURRENT_USER }) => {
  const { showToast } = useToast();
  const { isGlass } = useAppTheme();

  // Date range state (HD-7)
  const [startDate, setStartDate] = useState('01-Oct-2026');
  const [endDate, setEndDate] = useState('31-Oct-2026');

  // Loading & error states (HD-9)
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Data states
  const [counts, setCounts] = useState<NumericalCount>({
    total: 124,
    in_progress: 48,
    closed: 62,
    open: 14,
    on_hold: 6,
    overdue: 3,
    total_trend: '+8%',
    in_progress_trend: '+5%',
    closed_trend: '+15%',
    open_trend: '-3%'
  });
  const [tasks, setTasks] = useState<FeedbackHistory[]>([]);
  const [meetings, setMeetings] = useState<MeetingTimeTracker[]>([]);
  const [leaves, setLeaves] = useState<OptimaLeaveTracker[]>([]);
  const [peopleAlert, setPeopleAlert] = useState<{ count: number; people: string[] }>({ count: 0, people: [] });
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  // My Tasks Tab filter (HD-4: All, Today, This Week, Overdue)
  const [taskTab, setTaskTab] = useState<'All' | 'Today' | 'This Week' | 'Overdue'>('All');

  // New task form state
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(PROJECTS[0]);
  const [newTaskTeam, setNewTaskTeam] = useState(TEAMS[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'Critical P0' | 'Urgent P1' | 'Normal P2' | 'Low P3'>('Normal P2');
  const [newTaskEffort, setNewTaskEffort] = useState(16);

  // Load KPI counts from REAL backend
  useEffect(() => {
    setLoadingKpi(true);
    ApiClient.tasks.getNumericalCount()
      .then(res => {
        setCounts(res.data);
        // Show toast for production backend connection
        if (!import.meta.env.VITE_API_MODE || import.meta.env.VITE_API_MODE !== 'preview') {
          showToast('Success', 'KPI metrics loaded from backend', 'success');
        }
      })
      .catch(() => showToast('Error', 'Failed to load KPI metrics from backend', 'error'))
      .finally(() => setLoadingKpi(false));

    // Load people alert from REAL backend
    ApiClient.tasks.getPeopleNotFillingTasks()
      .then(res => setPeopleAlert(res.data))
      .catch(() => showToast('Error', 'Failed to load people alert from backend', 'error'));
  }, [startDate, endDate]);

  // Load My Tasks from REAL backend
  useEffect(() => {
    setLoadingTasks(true);
    ApiClient.tasks.getAll()
      .then(res => setTasks(res.data))
      .catch(() => showToast('Error', 'Failed to load tasks from backend', 'error'))
      .finally(() => setLoadingTasks(false));
  }, []);

  // Load Upcoming Schedule from REAL backend
  useEffect(() => {
    setLoadingSchedule(true);
    Promise.all([
      ApiClient.meetings.getAll(),
      ApiClient.leaves.getAll()
    ])
      .then(([mRes, lRes]) => {
        setMeetings(mRes.data);
        setLeaves(lRes.data);
      })
      .catch(() => showToast('Error', 'Failed to load schedule from backend', 'error'))
      .finally(() => setLoadingSchedule(false));
  }, []);

  // Toggle task completion in local state
  const handleToggleTask = (task: FeedbackHistory) => {
    const newStatus = task.status === 'Closed' ? 'In Progress' : 'Closed';
    ApiClient.tasks.editTask(task.id, { status: newStatus }).then(res => {
      setTasks(prev => prev.map(t => (t.id === task.id ? res.data : t)));
      showToast('Task Updated', `${task.ticket_number} marked as ${newStatus}`);
      // Refresh counts
      ApiClient.tasks.getNumericalCount().then(c => setCounts(c.data));
    });
  };

  // Submit New Task - sends to REAL backend
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSubject.trim()) {
      showToast('Validation Error', 'Task title cannot be blank', 'error');
      return;
    }

    const ticketNo = `${newTaskProject.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    ApiClient.tasks.saveTask({
      ticket_number: ticketNo,
      subject: newTaskSubject,
      description: newTaskDesc || 'Task created from Home Dashboard',
      status: 'Open',
      priority: newTaskPriority,
      project: newTaskProject,
      module: MODULES[1],
      team: newTaskTeam,
      customer: CUSTOMERS[0],
      task_owner: 'Deenesh Sabat',
      estimated_start_date: startDate,
      estimated_close_date: endDate,
      estimated_effort: Number(newTaskEffort),
      subtask_count: 0,
      work_log_entries: [],
      attachments: []
    }).then(res => {
      setTasks(prev => [res.data, ...prev]);
      setCreateTaskModalOpen(false);
      setNewTaskSubject('');
      setNewTaskDesc('');
      showToast('Task Created', `Created ${res.data.ticket_number} successfully`);
      ApiClient.tasks.getNumericalCount().then(c => setCounts(c.data));
    });
  };

  // Calculate filtered tasks for HD-4
  const myTasksList = tasks.filter(t => t.task_owner === 'Deenesh Sabat' || t.assigned_by === 'Deenesh Sabat');
  const allCount = myTasksList.length || 24;
  const todayTasks = myTasksList.filter(t => t.estimated_close_date.includes('02-Oct') || t.estimated_close_date.includes('15-Oct') || t.status === 'In Progress');
  const thisWeekTasks = myTasksList.filter(t => t.status === 'In Progress' || t.status === 'Open');
  const overdueTasks = myTasksList.filter(t => t.priority === 'Critical P0' && t.status !== 'Closed');

  const visibleTasks = taskTab === 'All'
    ? myTasksList.slice(0, 5)
    : taskTab === 'Today'
    ? todayTasks.slice(0, 5)
    : taskTab === 'This Week'
    ? thisWeekTasks.slice(0, 5)
    : overdueTasks.slice(0, 5);

  // Overall Progress calculation (HD-2 & HD-6: Closed / Total)
  const progressPercent = counts.total > 0 ? Math.round((counts.closed / counts.total) * 100) : 50;

  return (
    <div className="space-y-6">
      {/* Period Selector Header (HD-7) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-[#191627] tracking-tight">
            Home Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery progress, active sprints, and upcoming schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ModuleUploadTrigger
            moduleName="Home Dashboard"
            defaultProject="AEC Kuwait"
            buttonLabel="Upload Project File"
          />

          <DateRangeBox
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
              showToast('Period Updated', `Showing data for ${s} – ${e}`, 'info');
            }}
          />
        </div>
      </div>

      {/* Top Section: Welcome Banner (HD-1) + Overall Progress Ring (HD-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Welcome Banner (HD-1) */}
        <div className={`lg:col-span-8 relative rounded-3xl p-7 lg:p-9 overflow-hidden border shadow-sm flex flex-col justify-between transition-all ${
          isGlass
            ? 'bg-gradient-to-r from-blue-950/40 via-violet-950/30 to-amber-950/20 backdrop-blur-2xl border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-r from-[#E0F2FE] via-[#EDE9FE] to-[#FCE7F3] border-white/60 text-[#191627]'
        }`}>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-md z-10 space-y-3">
            {/* Tagline */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs border ${
              isGlass
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-white/80 backdrop-blur-xs text-[#7B3AEC] border-violet-100'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Productivity Partner</span>
            </div>

            {/* Headline */}
            <h2 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isGlass ? 'text-white' : 'text-[#191627]'
            }`}>
              Stay Organised.<br />
              <span className={isGlass ? 'text-amber-400' : 'text-[#7B3AEC]'}>Grow Faster.</span>
            </h2>

            {/* Subtitle with exact product name */}
            <p className={`text-xs lg:text-sm leading-relaxed font-normal ${
              isGlass ? 'text-zinc-300' : 'text-slate-600'
            }`}>
              Manage tasks, streamline work and scale your business with MY MiTRAA TaskFlow.
            </p>

            {/* CTA Pill Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCreateTaskModalOpen(true)}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold shadow-md transition-all group cursor-pointer ${
                  isGlass
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold hover:brightness-110 shadow-amber-500/30'
                    : 'bg-[#191627] hover:bg-[#28243c] active:bg-[#100e1a] text-white'
                }`}>
                <span>Create New Task</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Penguin Mascot on the right */}
          <div className="absolute -bottom-2 right-4 sm:right-8 lg:right-10 pointer-events-none">
            <MascotPenguin pose="hero-clipboard" size={170} />
          </div>
        </div>

        {/* Overall Progress Card (HD-2) */}
        <div className={`lg:col-span-4 rounded-3xl p-6 border shadow-xs flex flex-col justify-between transition-all ${
          isGlass
            ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 backdrop-blur-2xl border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            : 'bg-white border-slate-200/80 text-[#191627]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#A3D801]/20 rounded-xl text-[#4D6B00]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-bold ${isGlass ? 'text-white' : 'text-[#191627]'}`}>Overall Progress</h3>
            </div>
            <span className={`text-[11px] font-semibold font-mono ${isGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
              {startDate} – {endDate}
            </span>
          </div>

          {loadingKpi ? (
            <div className="py-8 flex justify-center">
              <Skeleton className="w-28 h-28 rounded-full" />
            </div>
          ) : (
            <div className="py-4 flex items-center justify-around gap-4">
              {/* Circular Progress Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#A3D801"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#191627] font-mono tracking-tight">
                      {progressPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Done</span>
                  </div>
                </svg>

                {/* Stats detail */}
                <div className="space-y-2 text-left">
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-[#4D6B00] bg-[#A3D801]/20 px-2 py-0.5 rounded-full font-mono">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+12%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">from last week</p>
                  </div>
                  <div className="pt-1 border-t border-slate-100 text-xs">
                    <span className="font-mono font-bold text-slate-800">{counts.closed}</span>
                    <span className="text-slate-400"> of </span>
                    <span className="font-mono font-bold text-slate-800">{counts.total}</span>
                    <span className="text-slate-500 block text-[11px]">tasks completed</span>
                  </div>
                </div>
              </div>

              {/* Quick link */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Current sprint target: 75%</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/task-dashboard')}
                  className="text-[#7B3AEC] hover:text-[#5c28b5] font-semibold flex items-center gap-1"
                >
                  <span>View Report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amber Alert Strip: People not filling tasks in project management tool (HD-8) */}
      {peopleAlert.count > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500 text-white rounded-xl shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                People not filling tasks in project management tool ({peopleAlert.count} people)
              </p>
              <p className="text-[11px] text-amber-800/80">
                Team members without logged task hours in the current sprint window.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPeopleModalOpen(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            Review 9 Members
          </button>
        </div>
      )}

      {/* Role-Specific Workspace Banner (Tailored for each of the 10 roles) */}
      <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
        isGlass
          ? 'bg-gradient-to-r from-violet-950/40 via-black/40 to-slate-950/40 border-white/15 text-white'
          : 'bg-white border-slate-200/80 text-[#191627]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7B3AEC]/15 text-[#7B3AEC] flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#191627]">
                  {currentUser.role} Workspace
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7B3AEC]/15 text-[#7B3AEC]">
                  Persona Active: {currentUser.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tailored widgets and operational actions configured for your role permissions.
              </p>
            </div>
          </div>

          {/* Role specific quick action button */}
          <div>
            {(currentUser.role === 'Sales Executive' || currentUser.role === 'Sales Manager') && (
              <button
                type="button"
                onClick={() => onNavigate('/sales-crm')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Open Sales CRM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {currentUser.role === 'QA Tester' && (
              <button
                type="button"
                onClick={() => onNavigate('/qa-bugs')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>QA &amp; Bug Tracking</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {currentUser.role === 'Project Manager' && (
              <button
                type="button"
                onClick={() => onNavigate('/projects')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Manage Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {currentUser.role === 'Developer' && (
              <button
                type="button"
                onClick={() => onNavigate('/task-tracker')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>My Dev Tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {currentUser.role === 'HR Manager' && (
              <button
                type="button"
                onClick={() => onNavigate('/leave-wfh-dashboard')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Leave Approvals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {currentUser.role === 'Client' && (
              <button
                type="button"
                onClick={() => onNavigate('/task-upload-files')}
                className="px-4 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Shared Deliverables</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/audit-logs')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold transition-colors"
                >
                  Audit Logs
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/roles-permissions')}
                  className="px-3.5 py-1.5 bg-[#7B3AEC] hover:bg-[#682ecf] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                >
                  Roles &amp; Perms
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {currentUser.role === 'Developer' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Assigned Tasks</span>
                <span className="font-mono font-bold text-slate-800 text-base">3 Active</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Pull Requests / Review</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">2 Pending</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Open Blockers</span>
                <span className="font-mono font-bold text-amber-600 text-base">1 Blocker</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Hours Logged Today</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">6.5 hrs</span>
              </div>
            </>
          )}

          {(currentUser.role === 'Sales Executive' || currentUser.role === 'Sales Manager') && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Pipeline Revenue</span>
                <span className="font-mono font-bold text-[#7B3AEC] text-base">$242,000</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Active Opportunities</span>
                <span className="font-mono font-bold text-slate-800 text-base">6 Leads</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Deal Win Rate</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">67%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Follow-ups Due</span>
                <span className="font-mono font-bold text-amber-600 text-base">2 Due Today</span>
              </div>
            </>
          )}

          {currentUser.role === 'QA Tester' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Defects Logged</span>
                <span className="font-mono font-bold text-slate-800 text-base">4 Defects</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Critical Blockers</span>
                <span className="font-mono font-bold text-red-600 text-base">1 P0</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Ready for Retest</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">1 Fixed</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Test Pass Rate</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">75%</span>
              </div>
            </>
          )}

          {currentUser.role === 'Project Manager' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Engagements Managed</span>
                <span className="font-mono font-bold text-slate-800 text-base">5 Projects</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Health Distribution</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">4 Healthy / 1 Risk</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Sprint 14 Target</span>
                <span className="font-mono font-bold text-[#7B3AEC] text-base">75% Target</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">AEC Kuwait Progress</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">68% Done</span>
              </div>
            </>
          )}

          {currentUser.role === 'HR Manager' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Staff Directory</span>
                <span className="font-mono font-bold text-slate-800 text-base">10 Users</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Planned Leaves</span>
                <span className="font-mono font-bold text-[#7B3AEC] text-base">28 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Approved WFH</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">14 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Missing Logs</span>
                <span className="font-mono font-bold text-amber-600 text-base">9 Members</span>
              </div>
            </>
          )}

          {currentUser.role === 'Client' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Shared Project</span>
                <span className="font-mono font-bold text-slate-800 text-base">AEC Kuwait</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Approved Milestones</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">3 Signed Off</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Delivery Progress</span>
                <span className="font-mono font-bold text-[#7B3AEC] text-base">68% Complete</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Verified Documents</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">2 Available</span>
              </div>
            </>
          )}

          {currentUser.role === 'Employee' && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">My Tasks</span>
                <span className="font-mono font-bold text-slate-800 text-base">2 Assigned</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Upcoming Meetings</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">1 Today</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Leave Balance</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">18 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">My Department</span>
                <span className="font-mono font-bold text-slate-700 text-base">{currentUser.team}</span>
              </div>
            </>
          )}

          {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
            <>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Total Accounts</span>
                <span className="font-mono font-bold text-slate-800 text-base">10 Active</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">RBAC Roles</span>
                <span className="font-mono font-bold text-[#7B3AEC] text-base">10 Configured</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">System Health</span>
                <span className="font-mono font-bold text-[#4D6B00] text-base">UP (MongoDB)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Compliance Audit</span>
                <span className="font-mono font-bold text-[#00A6FC] text-base">Stream Active</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4 KPI Cards (HD-3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className={`rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all ${
          isGlass
            ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 backdrop-blur-2xl border border-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#FAF5FF] border border-violet-100 text-[#191627]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#7B3AEC] text-white flex items-center justify-center shadow-xs">
              <ListTodo className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-0.5 text-xs font-bold text-[#7B3AEC] font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{counts.total_trend || '+8%'}</span>
            </div>
          </div>

          <div className="my-3">
            <span className={`text-xs font-semibold block ${isGlass ? 'text-zinc-400' : 'text-slate-500'}`}>Total Tasks</span>
            <span className={`text-3xl font-black font-mono tracking-tight ${isGlass ? 'text-white' : 'text-[#191627]'}`}>
              {counts.total}
            </span>
          </div>

          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isGlass ? 'border-white/10' : 'border-violet-200/60'
          }`}>
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>On Hold:</span>
            <span className="font-mono font-bold text-[#D946EF]">{counts.on_hold} tasks</span>
          </div>
        </div>

        {/* In Progress */}
        <div className={`rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all ${
          isGlass
            ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 backdrop-blur-2xl border border-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#F0F9FF] border border-sky-100 text-[#191627]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#00A6FC] text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-0.5 text-xs font-bold text-[#0082CA] font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{counts.in_progress_trend || '+5%'}</span>
            </div>
          </div>

          <div className="my-3">
            <span className={`text-xs font-semibold block ${isGlass ? 'text-zinc-400' : 'text-slate-500'}`}>In Progress</span>
            <span className={`text-3xl font-black font-mono tracking-tight ${isGlass ? 'text-white' : 'text-[#191627]'}`}>
              {counts.in_progress}
            </span>
          </div>

          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isGlass ? 'border-white/10' : 'border-sky-200/60'
          }`}>
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>Active Sprint:</span>
            <span className="font-mono font-bold text-[#0082CA]">Sprint 14</span>
          </div>
        </div>

        {/* Completed / Closed */}
        <div className={`rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all ${
          isGlass
            ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 backdrop-blur-2xl border border-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#F0FDF4] border border-lime-100 text-[#191627]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#A3D801] text-[#191627] flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-0.5 text-xs font-bold text-[#4D6B00] font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{counts.closed_trend || '+15%'}</span>
            </div>
          </div>

          <div className="my-3">
            <span className={`text-xs font-semibold block ${isGlass ? 'text-zinc-400' : 'text-slate-500'}`}>Completed</span>
            <span className={`text-3xl font-black font-mono tracking-tight ${isGlass ? 'text-white' : 'text-[#191627]'}`}>
              {counts.closed}
            </span>
          </div>

          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isGlass ? 'border-white/10' : 'border-lime-200/60'
          }`}>
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>Resolution rate:</span>
            <span className="font-mono font-bold text-[#4D6B00]">{progressPercent}%</span>
          </div>
        </div>

        {/* Pending / Open */}
        <div className={`rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all ${
          isGlass
            ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 backdrop-blur-2xl border border-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#FFFBEB] border border-amber-100 text-[#191627]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-0.5 text-xs font-bold text-[#4D6B00] font-mono">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{counts.open_trend || '-3%'}</span>
            </div>
          </div>

          <div className="my-3">
            <span className={`text-xs font-semibold block ${isGlass ? 'text-zinc-400' : 'text-slate-500'}`}>Pending / Open</span>
            <span className={`text-3xl font-black font-mono tracking-tight ${isGlass ? 'text-white' : 'text-[#191627]'}`}>
              {counts.open}
            </span>
          </div>

          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isGlass ? 'border-white/10' : 'border-amber-200/60'
          }`}>
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>Overdue:</span>
            <span className="font-mono font-bold text-amber-500">{counts.overdue} tasks</span>
          </div>
        </div>
      </div>

      {/* Middle Section: My Tasks (HD-4) + Upcoming Schedule (HD-5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* My Tasks Panel (HD-4) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#7B3AEC]/10 rounded-xl text-[#7B3AEC]">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191627]">My Tasks</h3>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/task-tracker')}
              className="text-xs font-semibold text-[#7B3AEC] hover:text-[#5c28b5] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Tabs: All, Today, This Week, Overdue with counts */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setTaskTab('All')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                taskTab === 'All'
                  ? 'bg-[#7B3AEC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskTab('Today')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                taskTab === 'Today'
                  ? 'bg-[#7B3AEC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today (8)
            </button>
            <button
              type="button"
              onClick={() => setTaskTab('This Week')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                taskTab === 'This Week'
                  ? 'bg-[#7B3AEC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week (12)
            </button>
            <button
              type="button"
              onClick={() => setTaskTab('Overdue')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                taskTab === 'Overdue'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue (3)
            </button>
          </div>

          {/* Task rows list */}
          {loadingTasks ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : visibleTasks.length === 0 ? (
            <MascotEmpty
              title="No tasks in this view"
              description="You are caught up with this tab."
              actionText="Create Task"
              onAction={() => setCreateTaskModalOpen(true)}
            />
          ) : (
            <div className="space-y-2">
              {visibleTasks.map(task => {
                const isClosed = task.status === 'Closed';
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-[#7B3AEC]/30 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          isClosed
                            ? 'bg-[#A3D801] border-[#A3D801] text-[#191627]'
                            : 'border-slate-300 hover:border-[#7B3AEC]'
                        }`}
                      >
                        {isClosed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Colored vertical line indicator */}
                      <div
                        className={`w-1 h-8 rounded-full shrink-0 ${
                          task.priority.includes('P0')
                            ? 'bg-red-500'
                            : task.priority.includes('P1')
                            ? 'bg-[#D946EF]'
                            : task.status === 'Closed'
                            ? 'bg-[#A3D801]'
                            : 'bg-[#00A6FC]'
                        }`}
                      />

                      {/* Ticket No + Subject */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono font-bold text-[#7B3AEC]">
                            {task.ticket_number}
                          </span>
                          {/* Team Chip per BRD */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {task.team}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-medium truncate ${
                            isClosed ? 'line-through text-slate-400' : 'text-[#191627]'
                          }`}
                        >
                          {task.subject}
                        </p>
                      </div>
                    </div>

                    {/* Meta info: Priority, Due Date, Avatar */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <StatusBadge status={task.priority} type="priority" size="sm" />
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block">
                        {task.estimated_close_date}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                        title={task.task_owner}
                      >
                        {task.task_owner.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Schedule (HD-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#00A6FC]/10 rounded-xl text-[#00A6FC]">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191627]">Upcoming Schedule</h3>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/leave-wfh-dashboard')}
              className="text-xs font-semibold text-[#00A6FC] hover:text-[#0082CA] inline-flex items-center gap-1"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingSchedule ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="flex items-start gap-4 pt-1">
              {/* Date Tile (like Apr 21 / Oct 20) */}
              <div className="bg-[#FAF5FF] border border-violet-100 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px] text-center shadow-2xs shrink-0">
                <span className="text-[11px] font-bold text-[#7B3AEC] uppercase tracking-wider">OCT</span>
                <span className="text-2xl font-black text-[#191627] font-mono leading-none my-1">20</span>
                <span className="text-[10px] text-slate-500 font-semibold">TUE</span>
              </div>

              {/* Event list from Meetings and Leaves */}
              <div className="flex-1 space-y-2.5">
                {/* Meeting Event */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Client Architecture Sync</p>
                    <p className="text-[11px] font-mono text-slate-500">10:00 AM – 11:00 AM</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-[#7B3AEC] shrink-0">
                    Meeting
                  </span>
                </div>

                {/* Holiday Event */}
                <div className="p-3 rounded-2xl bg-fuchsia-50/60 border border-fuchsia-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#86198F] truncate">Dussehra National Holiday</p>
                    <p className="text-[11px] font-mono text-slate-500">All day · Company Wide</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D946EF]/20 text-[#86198F] shrink-0">
                    Holiday
                  </span>
                </div>

                {/* Leave Event */}
                <div className="p-3 rounded-2xl bg-lime-50/60 border border-lime-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#4D6B00] truncate">Vivek Singh (Planned Leave)</p>
                    <p className="text-[11px] font-mono text-slate-500">05-Oct – 09-Oct</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A3D801]/25 text-[#4D6B00] shrink-0">
                    Leave
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Progress Banner: "You're on track!" (HD-6) */}
      <div className="bg-gradient-to-r from-[#6D28D9] via-[#7B3AEC] to-[#D946EF] rounded-3xl p-5 lg:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-yellow-300 shadow-sm shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold tracking-tight">
              {progressPercent >= 50 ? "You're on track!" : "Needs attention"}
            </h4>
            <p className="text-xs text-white/85 mt-0.5 max-w-xl">
              Keep going! You've completed {progressPercent}% of total tasks for this period ({counts.closed} of {counts.total}).
            </p>
            {/* Horizontal Fill Bar */}
            <div className="w-64 sm:w-80 h-2 bg-black/25 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#A3D801] rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Celebratory Penguin Mascot on the right */}
        <div className="hidden sm:flex items-center justify-end z-10 shrink-0">
          <MascotPenguin pose="celebrating" size={80} />
        </div>
      </div>

      {/* Modal: People Not Filling Tasks Dialog (HD-8) */}
      {peopleModalOpen && (
        <Modal
          isOpen={peopleModalOpen}
          onClose={() => setPeopleModalOpen(false)}
          title="Team Members Not Filling Tasks"
          subtitle="9 people found with zero logged effort in the active sprint cycle"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              These contributors need to submit their daily work logs in Task Tracker to reflect team capacity accurately.
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {peopleAlert.people.map((name, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    0.0 hrs logged
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPeopleModalOpen(false)}
                className="px-4 py-2 bg-[#191627] hover:bg-[#28243c] text-white rounded-full text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Create New Task (HD-1 CTA Form) */}
      {createTaskModalOpen && (
        <Modal
          isOpen={createTaskModalOpen}
          onClose={() => setCreateTaskModalOpen(false)}
          title="Create New Task"
          subtitle="Add a new work item to the project management system"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Task Subject / Title *
              </label>
              <input
                type="text"
                required
                value={newTaskSubject}
                onChange={e => setNewTaskSubject(e.target.value)}
                placeholder="e.g. Implement OAuth token refresh flow"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7B3AEC]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Project</label>
                <select
                  value={newTaskProject}
                  onChange={e => setNewTaskProject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7B3AEC]"
                >
                  {PROJECTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Team</label>
                <select
                  value={newTaskTeam}
                  onChange={e => setNewTaskTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus-border-[#7B3AEC]"
                >
                  {TEAMS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7B3AEC]"
                >
                  <option value="Critical P0">Critical P0</option>
                  <option value="Urgent P1">Urgent P1</option>
                  <option value="Normal P2">Normal P2</option>
                  <option value="Low P3">Low P3</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Effort (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newTaskEffort}
                  onChange={e => setNewTaskEffort(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7B3AEC]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
              <textarea
                rows={3}
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Details of the deliverable and acceptance criteria..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7B3AEC]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateTaskModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#191627] hover:bg-[#28243c] text-white rounded-full text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Save Task</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};