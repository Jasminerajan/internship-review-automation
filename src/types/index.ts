export type UserRole = 'intern' | 'trainer' | 'admin';

export interface User {
  id: string; // e.g. INT-2026-001 or TRN-001
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  track?: string; // 'Frontend Engineering', 'Backend Engineering', 'Full-Stack', 'Cloud & DevOps', 'AI & Data'
  cohort?: string; // 'Cohort 2026-Q1'
  joinedDate?: string;
  mentorName?: string;
  timezone?: string;
  bio?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'passed'
  | 'needs_improvement'
  | 'trainer_review';

export interface AcceptanceCriterion {
  id: string;
  category: 'Functionality' | 'Code Quality' | 'Testing' | 'Security' | 'Documentation';
  description: string;
  weight: number; // e.g. 20, 25, 30
  required: boolean;
}

export interface TaskReferenceDoc {
  title: string;
  url: string;
  type: 'doc' | 'api' | 'guide' | 'repo';
}

export interface Task {
  id: string;
  title: string;
  track: string;
  cohort: string;
  problemStatement: string;
  instructions: string;
  deliverables: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  deadline: string; // ISO String
  priority: TaskPriority;
  referenceDocs: TaskReferenceDoc[];
  assignedTo: string[]; // List of intern IDs, or ['ALL']
  createdAt: string;
  createdBy: string;
}

export interface AutomatedTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  executionTimeMs: number;
  output: string;
  expected?: string;
  received?: string;
}

export interface EvaluationReport {
  id: string;
  submissionId: string;
  evaluatedAt: string;
  overallStatus: 'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW';
  scorePercent: number;
  requirementsSatisfied: Array<{ requirement: string; evidence: string }>;
  requirementsPartiallySatisfied: Array<{ requirement: string; missing: string }>;
  requirementsNotSatisfied: Array<{ requirement: string; reason: string }>;
  evidenceAndTestResults: {
    executed: boolean;
    runtime: string; // e.g. 'Node.js Isolated VM' or 'Static AST & Linter'
    totalTests: number;
    passedCount: number;
    failedCount: number;
    testSuiteOutput: string;
    tests: AutomatedTestResult[];
  };
  missingImplementation: string[];
  suggestedCorrections: Array<{
    fileOrTopic: string;
    explanation: string;
    suggestedCodeSnippet?: string;
  }>;
  isAiGenerated: boolean;
  modelUsed?: string;
  trainerOverride?: {
    trainerId: string;
    trainerName: string;
    overrideAt: string;
    originalStatus: 'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW';
    newStatus: 'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW';
    scorePercent: number;
    trainerFeedback: string;
  };
}

export type SubmissionType = 'code' | 'text' | 'github_repo' | 'mixed';

export interface Submission {
  id: string;
  taskId: string;
  taskTitle?: string;
  internId: string;
  internName: string;
  internTrack?: string;
  submittedAt: string;
  type: SubmissionType;
  textContent?: string;
  codeContent?: string;
  codeLanguage?: string;
  fileName?: string;
  githubRepoUrl?: string;
  githubBranch?: string;
  status: TaskStatus;
  evaluationReport?: EvaluationReport;
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  startTime: string; // ISO
  endTime: string; // ISO
  timezone: string;
  meetLink: string; // Verified Google Meet link
  hostTrainerName: string;
  hostTrainerId: string;
  attendeeInternIds: string[]; // ['ALL'] or specific intern IDs
  attendeeTrack?: string;
  reminderMinutesBefore: number;
  isReminderLogged: boolean;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  lastEmailSentAt?: string;
  lastEmailRecipientCount?: number;
  lastEmailStatus?: 'sent' | 'failed' | 'not_sent';
  lastEmailError?: string;
}

export interface EmailServiceInfo {
  configured: boolean;
  provider: string;
  host?: string;
  user?: string;
  from?: string;
  errorReason?: string;
  instructions: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  contextCards?: Array<{
    type: 'task' | 'meeting' | 'evaluation' | 'tip';
    title: string;
    subtitle?: string;
    status?: string;
    linkId?: string;
    badgeText?: string;
    badgeColor?: string;
  }>;
  quickReplies?: string[];
  isTyping?: boolean;
}

export interface InternDashboardStats {
  totalAssigned: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingSubmissions: number;
  overdueTasks: number;
  averageScorePercent: number;
  nextMeeting: Meeting | null;
}

export interface TrainerDashboardStats {
  totalInterns: number;
  tasksAssigned: number;
  pendingSubmissions: number;
  overdueTasks: number;
  evaluationsSummary: {
    passed: number;
    needsImprovement: number;
    trainerReview: number;
  };
  upcomingMeetingsCount: number;
}
