/**
 * Shared Type Definitions for MiTRAA TaskFlow
 * Mapped to the REST API Reference v3 & Frontend BRD v2
 */

export interface CustomResponse<T> {
  code: number;
  message: string;
  data: T;
  metaInfo?: {
    serviceName?: string;
    totalCount?: number;
    page?: number;
    size?: number;
    token?: string;
    [key: string]: unknown;
  };
}

export interface BaseDomain {
  created_on?: string;
  created_by?: string;
  modified_date_time?: string;
  modified_by?: string;
  active_flag?: boolean;
  delete_flag?: boolean;
  delete_on?: string;
  status_flag?: string;
  history_flag?: boolean;
  report_generated_date?: string;
}

export interface WorkLogEntry {
  id?: string;
  date: string; // DD-Mon-YYYY
  hours: number;
  description: string;
}

export interface FeedbackHistory extends BaseDomain {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'On Hold';
  priority: 'Critical P0' | 'Urgent P1' | 'Normal P2' | 'Low P3';
  project: string;
  module: string;
  sub_module?: string;
  epic?: string;
  customer: string;
  instance?: string;
  product?: string;
  project_category?: string;
  team: string; // QA, Project Management, Mobile Development, BE Development, FE Development, UI / UX Design, etc.
  task_type?: string;
  classification?: string;
  category?: string;
  category_description?: string;
  task_owner: string;
  assigned_by?: string;
  who_reported?: string;
  reviewed_by?: string;
  estimated_start_date: string;
  estimated_close_date: string;
  actual_start_date?: string;
  actual_close_date?: string;
  date_assigned?: string;
  estimated_effort: number; // in hours
  actual_effort: number; // automatically calculated from work_log_entries
  productivity_savings?: number;
  coding?: number;
  ai_tool?: number;
  internal_meeting?: number;
  comments?: string;
  reviewer_comments?: string;
  work_log_entries: WorkLogEntry[];
  attachments?: string[];
  file_name?: string;
  uploaded?: boolean;
  subtask_count: number;
  last_subtask_update?: string;
  parentFeedbackHistoryId?: string;
}

export interface Subtask extends BaseDomain {
  subtaskId: string;
  ticketNumber: string;
  parentTicketNumber: string;
  parentFeedbackHistoryId: string;
  epic?: string;
  priority?: string;
  customer?: string;
  subject?: string;
  description?: string;
  status?: 'Open' | 'In Progress' | 'Closed' | 'On Hold';
  project?: string;
  module?: string;
  team?: string;
  task_owner?: string;
  estimated_start_date?: string;
  estimated_close_date?: string;
  actual_start_date?: string;
  actual_close_date?: string;
  estimated_effort?: number;
  actual_effort?: number;
  work_log_entries?: WorkLogEntry[];
}

export interface MeetingTimeTracker extends BaseDomain {
  id: string;
  date: string; // DD-Mon-YYYY
  customer: string;
  project: string;
  module: string;
  team: string;
  category: string;
  meeting_by: string; // Organizer
  meeting_with: string[]; // Attendees
  lead_attended: boolean;
  architect_attended: boolean;
  start_time: string; // e.g., "10:00 AM"
  end_time: string; // e.g., "11:00 AM"
  total_time: number; // in minutes (e.g., 60)
  comments?: string;
}

export interface OptimaLeaveTracker extends BaseDomain {
  id: string;
  name: string;
  role: string;
  start_date: string; // DD-Mon-YYYY
  end_date: string; // DD-Mon-YYYY
  day: 'Full day' | 'Half day';
  leave_type: 'Leave' | 'Planned Leave' | 'Unplanned Leave' | 'WFH (Approved)' | 'WFH (Unapproved)' | 'Holiday';
  comments?: string;
}

export interface OptimaWeeklyUpdateTracker extends BaseDomain {
  id: string;
  project_name: string;
  customer_name: string;
  customer_geography: string;
  industry: string;
  state: string; // Status
  current_state: string;
  current_status: string;
  project_status: string;
  last_week_status: string;
  priority: string;
  risk: string;
  project_summery: string;
  start_date: string;
  go_live_date: string;
  weekly_start_date: string; // e.g., "26-Oct-2026"
  weekly_end_date: string; // e.g., "30-Oct-2026"
  ref?: string;
  code_base?: string;
  documentation?: string;
  kt_provider?: string;
  hld_link?: string;
  lld_link?: string;
  hld_attachment?: string[];
  lld_attachment?: string[];
  testers: string[];
  fe_developers: string[];
  be_developers: string[];
  python_developers?: string[];
  ux_designers: string[];
  shared_resources: string[];
  totalEnv: number;
  dev_url: string;
  qa_url: string;
  la_url: string;
  other_url: string;
  dev_arrow: boolean;
  qa_arrow: boolean;
  la_arrow: boolean;
  other_arrow: boolean;
}

export interface DropdownItem extends BaseDomain {
  id: string;
  type: string; // "Task Owner" | "Customer" | "Project" | "Module" | "Team" | "Category"
  value: string;
  sub_value?: string;
  module?: string;
  sub_module?: string;
  recorded_date: string; // DD-Mon-YYYY
  comments?: string;
}

export interface DocumentRecord extends BaseDomain {
  id: string;
  ticket_number: string;
  file_name: string;
  file_size: string;
  file_type: string;
  uploaded_date: string; // DD-Mon-YYYY
  customer: string;
  project: string;
  task_team: string;
  task_owner: string;
  task_status: string;
  task_priority: string;
}

export interface SearchVM {
  customer?: string;
  project?: string;
  team?: string;
  task_owner?: string;
  status?: string;
  priority?: string;
  ticket_number?: string;
  start_date?: string;
  end_date?: string;
  search_query?: string;
  search_field?: string;
}

export interface Pageable {
  page: number;
  size: number;
  sort?: string;
}

export interface NumericalCount {
  total: number;
  in_progress: number;
  closed: number;
  open: number;
  on_hold: number;
  overdue: number;
  // trends
  total_trend?: string;
  in_progress_trend?: string;
  closed_trend?: string;
  open_trend?: string;
}

export interface PeopleNotFillingTasks {
  count: number;
  people: string[];
}

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Project Manager'
  | 'Developer'
  | 'Sales Executive'
  | 'Sales Manager'
  | 'QA Tester'
  | 'HR Manager'
  | 'Employee'
  | 'Client'
  | 'Production Engineer'
  | 'Lead Architect'
  | 'Senior Backend Engineer'
  | 'Frontend Engineer'
  | 'Product Manager'
  | 'QA Engineer'
  | 'UI / UX Designer'
  | 'Python Developer'
  | 'DevOps Engineer';

export type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface UserAccount extends BaseDomain {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string;
  department?: string;
  designation?: string;
  status: UserStatus;
  avatar: string;
  phone?: string;
  permissions?: string[];
  last_login?: string;
  created_date: string;
}

export interface ProjectRecord extends BaseDomain {
  id: string;
  project_id: string;
  project_name: string;
  customer_name: string;
  project_manager: string;
  status: 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Critical P0' | 'Urgent P1' | 'Normal P2' | 'Low P3';
  start_date: string;
  target_date: string;
  completion_percentage: number;
  health_score: 'Healthy' | 'At Risk' | 'Critical';
  budget_hours?: number;
  logged_hours?: number;
  members: string[];
  description?: string;
  milestones?: { id: string; title: string; due_date: string; completed: boolean }[];
}

export interface LeadRecord extends BaseDomain {
  id: string;
  lead_code: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  assigned_to: string;
  expected_revenue: number;
  probability: number;
  source: string;
  follow_up_date: string;
  notes?: string;
  lost_reason?: string;
}

export interface BugRecord extends BaseDomain {
  id: string;
  bug_code: string;
  title: string;
  project: string;
  module: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'Critical P0' | 'Urgent P1' | 'Normal P2' | 'Low P3';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Fixed' | 'Ready for Retest' | 'Retest Passed' | 'Reopened' | 'Closed';
  reported_by: string;
  assigned_to: string;
  linked_task_id?: string;
  reproduction_steps: string;
  expected_result: string;
  actual_result: string;
  environment?: string;
  created_at: string;
}

export interface TestCaseRecord extends BaseDomain {
  id: string;
  test_code: string;
  title: string;
  project: string;
  suite: string;
  status: 'Passed' | 'Failed' | 'Blocked' | 'Untested';
  last_executed_by?: string;
  last_executed_at?: string;
  execution_notes?: string;
}

export interface AuditLogRecord extends BaseDomain {
  id: string;
  timestamp: string;
  user_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  module: string;
  record_id?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  details: string;
}


export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  isConfigured: boolean;
  hasPassword?: boolean;
}

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  category: 'TASK_OWNER' | 'WEEKLY_REPORT' | 'LEAVE_STATUS' | 'TEST' | 'SYSTEM';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  details?: string;
  error?: string;
}

export interface TaskOwnerEmailPayload {
  task_id?: string;
  owner_name?: string;
  owner_email?: string;
  assigned_by?: string;
  subject?: string;
  description?: string;
  priority?: string;
  eta?: string;
}