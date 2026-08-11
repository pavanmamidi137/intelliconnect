export type OrganizationType =
  | "company"
  | "startup"
  | "college"
  | "government"
  | "non_profit"
  | "other";

export interface Organization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  description: string;
  website: string;
  created_at: string;
  people_count: number;
  meetings_count: number;
  completed_meetings: number;
  open_tasks: number;
}

export type UserRole = "host" | "admin" | "superadmin";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  organization: Organization | null;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Person {
  id: string;
  full_name: string;
  user_name: string;
  teams: string;
  email: string;
  department: string;
  designation: string;
  additional_info: string;
  is_active: boolean;
  created_at: string;
  meetings_count: number;
  tasks_count: number;
  completed_tasks: number;
  pending_tasks: number;
}

export interface PersonDetail extends Person {
  meeting_history: MeetingSummaryItem[];
  assigned_tasks: PersonTask[];
}

export interface PersonTask {
  id: string;
  task: string;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  meeting_id: string;
  meeting_title: string;
  ai_confidence: number | null;
}

export type MeetingStatus =
  | "draft"
  | "processing"
  | "review_required"
  | "completed"
  | "failed";

export type MeetingType =
  | "meeting"
  | "one_on_one"
  | "standup"
  | "brainstorm"
  | "review"
  | "client_call"
  | "other";

export interface MeetingSummaryItem {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  created_at: string;
  host_name: string;
  participants_count: number;
  participants: { id: string; full_name: string; department: string }[];
  tasks_count: number;
  decisions_count: number;
  has_pdf: boolean;
}

export interface MeetingSummaryBlock {
  id: string;
  summary: string;
  paragraph_summary: string;
}

export interface MeetingKeyPoint {
  id: string;
  content: string;
  order: number;
}

export interface MeetingDecision {
  id: string;
  content: string;
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskSource = "ai" | "manual";

export interface TaskCandidate {
  id: string;
  full_name: string;
  department: string;
  designation: string;
  confidence?: number;
}

export interface Task {
  id: string;
  person: string | null;
  person_name: string;
  department: string;
  designation: string;
  mentioned_name: string;
  task: string;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  ai_confidence: number | null;
  context: string;
  source: TaskSource;
  needs_confirmation?: boolean;
  candidates?: TaskCandidate[];
}

export interface PersonMention {
  id: string;
  full_name: string;
  person: string | null;
  person_name: string;
  department: string;
  confidence: number | null;
  context: string;
}

export interface ReportMeta {
  id: string;
  status: "generating" | "ready" | "failed";
  generated_at: string;
  file_path: string;
}

export interface MeetingDetail {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  notes: string;
  host: string;
  host_name: string;
  host_email: string;
  organization: string;
  participants: { id: string; full_name: string; email: string; department: string; designation: string }[];
  summary: MeetingSummaryBlock | null;
  key_points: MeetingKeyPoint[];
  decisions: MeetingDecision[];
  tasks: Task[];
  mentions: PersonMention[];
  reports: ReportMeta[];
  transcript_name: string;
  audio_name: string;
  processing_stage: number | null;
  processed_at: string | null;
  created_at: string;
  has_pdf: boolean;
  unresolved_tasks_count?: number;
}

export interface MeetingReport {
  id: string;
  meeting: string;
  meeting_title: string;
  meeting_date: string;
  meeting_status: MeetingStatus;
  status: "generating" | "ready" | "failed";
  file_path: string;
  generated_at: string;
  tasks_count: number;
  decisions_count: number;
}

export interface AIProviderInfo {
  name: string;
  label: string;
  configured: boolean;
  available: boolean;
  model: string;
  detail: string;
}

export interface AIProviderStatus {
  providers: AIProviderInfo[];
  primary: string | null;
  threshold: number;
}

export interface Paginated<T> {
  count: number;
  total_pages: number;
  page: number;
  page_size: number;
  results: T[];
}

export type MeetingReviewPayload = MeetingDetail;

export interface MeetingStatusInfo {
  id: string;
  status: MeetingStatus;
  processing_stage: number | null;
  processed_at: string | null;
}

export interface TranscriptTurn {
  speaker: string;
  speaker_id: string | null;
  text: string;
}

export interface TranscriptPerson {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface MeetingTranscript {
  filename: string;
  has_speakers: boolean;
  turns: TranscriptTurn[];
  people: TranscriptPerson[];
}

export interface OtpRequestResult {
  message: string;
  account_exists: boolean;
  expires_in?: number;
  dev_code?: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  skipped_details: string[];
}

export interface DashboardStats {
  total_meetings: number;
  meetings_by_status: Record<MeetingStatus, number>;
  people_count: number;
  open_tasks: number;
  completed_tasks: number;
  tasks_due_soon: number;
  reports_count: number;
  decisions_count: number;
}

export interface DashboardTask {
  id: string;
  task: string;
  status: TaskStatus;
  deadline: string | null;
  priority: TaskPriority;
  ai_confidence: number | null;
  meeting_id: string;
  meeting_title: string;
  person_name: string;
  department: string;
}

export interface HostDashboard {
  organization: { id: string; name: string; organization_type: OrganizationType } | null;
  stats: DashboardStats;
  recent_meetings: MeetingSummaryItem[];
  recent_tasks: DashboardTask[];
  ai: { primary: string | null; configured: boolean };
}

export interface AdminOrganization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  created_at: string;
  members_count: number;
  people_count: number;
  meetings_count: number;
  completed_meetings: number;
  open_tasks: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  is_active: boolean;
  organization: { id: string; name: string } | null;
  created_at: string;
}

export interface AdminDashboardStats {
  organizations: number;
  users: number;
  people: number;
  meetings: number;
  meetings_by_status: Record<MeetingStatus, number>;
  tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  reports: number;
  reports_ready: number;
  decisions: number;
  transcripts_stored: number;
  pdfs_generated: number;
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  recent_organizations: AdminOrganization[];
  recent_meetings: MeetingSummaryItem[];
  providers: AIProviderInfo[];
  primary: string | null;
}

export type SiteFontFamily = "default" | "system" | "serif" | "mono";
export type SiteRadius = "0.5rem" | "0.75rem" | "1rem" | "0rem";

/** Platform branding controlled by the super admin (GET is public). */
export interface SiteTheme {
  primary_color: string;
  accent_color: string;
  light_background: string;
  dark_background: string;
  radius: SiteRadius;
  font_family: SiteFontFamily;
  updated_at: string | null;
}

export const DEFAULT_SITE_THEME: SiteTheme = {
  primary_color: "",
  accent_color: "",
  light_background: "",
  dark_background: "",
  radius: "0.75rem",
  font_family: "default",
  updated_at: null,
};
