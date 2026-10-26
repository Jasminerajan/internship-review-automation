import React, { useState } from 'react';
import {
  Users,
  Layers,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
  Mail,
  Video,
  Clock,
} from 'lucide-react';
import {
  User,
  Task,
  Submission,
  Meeting,
  TrainerDashboardStats,
} from '../types/index.js';
import { api } from '../api.js';

interface TrainerDashboardProps {
  trainerStats: TrainerDashboardStats | null;
  interns: User[];
  tasks: Task[];
  submissions: Submission[];
  meetings: Meeting[];
  onOpenCreateTask: () => void;
  onOpenCreateMeeting: () => void;
  onSwitchToIntern: (intern: User) => void;
  onSelectSubmission: (subId: string) => void;
  onEditTask?: (task: Task) => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onRefreshData?: () => Promise<void> | void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  trainerStats,
  interns,
  tasks,
  submissions,
  meetings,
  onOpenCreateTask,
  onOpenCreateMeeting,
  onSwitchToIntern,
  onSelectSubmission,
  onEditTask,
  onEditMeeting,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sendingMeetingId, setSendingMeetingId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{
    meetingId: string;
    type: 'success' | 'error';
    message: string;
    recipients?: string[];
  } | null>(null);

  const handleSendMeetingEmail = async (meeting: Meeting) => {
    setSendingMeetingId(meeting.id);
    setEmailFeedback(null);
    try {
      const res = await api.sendMeetingEmail(meeting.id);
      setEmailFeedback({
        meetingId: meeting.id,
        type: 'success',
        message: `Verified meeting notification sent to ${res.recipients.length} intern(s).`,
        recipients: res.recipients.map((r) => `${r.name} (${r.email})`),
      });
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setEmailFeedback({
        meetingId: meeting.id,
        type: 'error',
        message: err.message || 'Failed to dispatch email. Verify SMTP settings in .env.',
      });
    } finally {
      setSendingMeetingId(null);
    }
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrack = selectedTrack === 'all' || intern.track === selectedTrack;
    return matchesSearch && matchesTrack;
  });

  const tracks = [
    'all',
    'Frontend Engineering',
    'Backend Engineering',
    'Full-Stack Engineering',
    'Cloud & DevOps',
    'AI & Data Engineering',
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-xs font-bold text-purple-300">
              LEAD MENTOR COMMAND CENTER
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
              Active Cohort 2026-Q1
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Enterprise Intern Management Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Automated cohort tracking, task dispatch, submission oversight, and AI rubric override.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Assign New Task</span>
          </button>
          <button
            onClick={onOpenCreateMeeting}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:text-white transition-colors"
          >
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Interns */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cohort Interns</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{trainerStats?.totalInterns || interns.length}</div>
          <div className="mt-1 text-[10px] text-blue-400/90 font-medium">Scale: 100+ Cohort Pool</div>
        </div>

        {/* Tasks Assigned */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tasks Assigned</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{trainerStats?.tasksAssigned || tasks.length}</div>
          <div className="mt-1 text-[10px] text-slate-400">Across 5 Tracks</div>
        </div>

        {/* Pending Submissions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pending Review</span>
            <FileCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{trainerStats?.pendingSubmissions || 0}</div>
          <div className="mt-1 text-[10px] text-amber-300 font-medium">Action Required</div>
        </div>

        {/* Overdue Tasks */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{trainerStats?.overdueTasks || 0}</div>
          <div className="mt-1 text-[10px] text-rose-400/80 font-medium">Past Deadlines</div>
        </div>

        {/* Passed Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Approved (PASS)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {trainerStats?.evaluationsSummary?.passed ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-emerald-400/80">Met All Criteria</div>
        </div>

        {/* Upcoming Meetings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Meetings</span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {trainerStats?.upcomingMeetingsCount || meetings.length}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Verified G-Meet</div>
        </div>
      </div>

      {/* Intern Roster Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 p-4 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Intern Cohort Roster ({filteredInterns.length})
            </h3>
            <span className="text-xs text-slate-400 hidden md:inline">• Multi-Track Cohort</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search intern name, ID..."
                className="rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Track Filter */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {tracks.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Tracks' : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Intern ID &amp; Name</th>
                <th className="py-3 px-4">Track</th>
                <th className="py-3 px-4">Timezone</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Lead Mentor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInterns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No interns found matching "{searchTerm}" {selectedTrack !== 'all' ? `in track ${selectedTrack}` : ''}
                  </td>
                </tr>
              ) : (
                filteredInterns.map((intern) => {
                  const internSubs = submissions.filter((s) => s.internId === intern.id);
                  const passed = internSubs.filter((s) => s.status === 'passed').length;

                  return (
                    <tr key={intern.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={intern.avatar}
                            alt={intern.name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-white">{intern.name}</div>
                            <div className="font-mono text-[10px] text-blue-400">{intern.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200">
                          {intern.track}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {intern.timezone || 'UTC'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{internSubs.length} total</span>
                          <span className="text-[10px] text-emerald-400 font-medium">({passed} passed)</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {intern.mentorName || 'Dr. Sarah Jenkins'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSwitchToIntern(intern)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors"
                        >
                          Simulate View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions Requiring Attention Queue */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Submissions &amp; Evaluation Queue
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any submission to inspect or override rubric</span>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No submissions in queue. Submitted intern work will appear here for rubric review and score oversight.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {submissions.slice(0, 6).map((sub) => {
              const report = sub.evaluationReport;
              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubmission(sub.id)}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-purple-500/50 hover:bg-slate-950 transition-all cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-blue-400 font-bold">{sub.taskId}</span>
                      {report && (
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-black ${
                            report.overallStatus === 'PASS'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {report.overallStatus} ({report.scorePercent}%)
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {sub.taskTitle}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">Intern: {sub.internName}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-500">
                    <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    <span className="text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect Report <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cohort Tasks & Assignment Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Cohort Milestone Tasks ({tasks.length})
            </h3>
          </div>
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Task</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No milestone tasks currently configured. Click "Create New Task" above to publish one.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {tasks.map((task) => (
              <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-blue-400 font-bold">{task.id}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                      {task.track}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                      {(task.assignedTo || []).includes('ALL') ? 'All Interns' : `${(task.assignedTo || []).length} assigned`}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{task.problemStatement}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                  {onEditTask && (
                    <button
                      onClick={() => onEditTask(task)}
                      className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/60"
                    >
                      <Edit3 className="h-3 w-3 text-purple-400" />
                      <span>Edit Task</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cohort Mentorship Meetings & Email Notification Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Mentorship Meetings &amp; Email Dispatch ({meetings.length})
            </h3>
          </div>
          <button
            onClick={onOpenCreateMeeting}
            className="flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule New Meeting</span>
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No mentorship meetings currently scheduled. Click "Schedule New Meeting" above to add one.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {meetings.map((meeting) => {
              const startDate = new Date(meeting.startTime);
              const isSending = sendingMeetingId === meeting.id;
              const notice = emailFeedback?.meetingId === meeting.id ? emailFeedback : null;

              return (
                <div key={meeting.id} className="py-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-purple-400 font-bold">{meeting.id}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                          {meeting.timezone}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                          {(meeting.attendeeInternIds || []).includes('ALL')
                            ? 'Entire Cohort'
                            : `${(meeting.attendeeInternIds || []).length} Intern(s)`}
                        </span>
                      {meeting.lastEmailSentAt && (
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          <span>Emailed</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white">{meeting.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{meeting.agenda}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="h-3 w-3 text-blue-400" />
                        {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1 text-blue-400 font-mono truncate max-w-xs">
                        <Video className="h-3 w-3" />
                        {meeting.meetLink}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSendMeetingEmail(meeting)}
                      disabled={isSending}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                      title="Send title, date/time, agenda and Google Meet link to assigned interns' registered emails"
                    >
                      <Mail className="h-3 w-3 text-blue-400" />
                      <span>{isSending ? 'Sending...' : 'Send Meeting Email'}</span>
                    </button>

                    {onEditMeeting && (
                      <button
                        onClick={() => onEditMeeting(meeting)}
                        className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                      >
                        <Edit3 className="h-3 w-3 text-purple-400" />
                        <span>Edit Meeting</span>
                      </button>
                    )}
                  </div>
                </div>

                {notice && (
                  <div
                    className={`rounded-lg p-2.5 text-[11px] flex items-start gap-2 ${
                      notice.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {notice.type === 'success' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{notice.message}</div>
                      {notice.recipients && (
                        <div className="text-[10px] opacity-80 font-mono mt-0.5">
                          Recipients: {notice.recipients.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
