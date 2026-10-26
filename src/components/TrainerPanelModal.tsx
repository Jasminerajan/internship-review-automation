import React, { useState } from 'react';
import {
  X,
  Calendar,
  Layers,
  Video,
  Clock,
  ShieldAlert,
  Edit3,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ExternalLink,
  Bot,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { Task, Meeting, User } from '../types/index.js';
import { api } from '../api.js';

interface TrainerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToChatbot: () => void;
  tasks: Task[];
  meetings: Meeting[];
  interns: User[];
  onRefreshData: () => Promise<void> | void;
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onOpenCreateMeeting: () => void;
}

export const TrainerPanelModal: React.FC<TrainerPanelModalProps> = ({
  isOpen,
  onClose,
  onReturnToChatbot,
  tasks,
  meetings,
  interns,
  onRefreshData,
  onOpenCreateTask,
  onEditTask,
  onOpenCreateMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings'>('tasks');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // Meeting edit form state
  const [meetingForm, setMeetingForm] = useState<{
    title: string;
    agenda: string;
    startTime: string;
    endTime: string;
    meetLink: string;
    timezone: string;
  }>({
    title: '',
    agenda: '',
    startTime: '',
    endTime: '',
    meetLink: '',
    timezone: 'UTC',
  });

  // Inline deadline edit state for tasks
  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);
  const [newDeadlineVal, setNewDeadlineVal] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingEmailMeetingId, setSendingEmailMeetingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setActionErrorMsg(null);
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(null), 5000);
  };

  const handleStartEditMeeting = (m: Meeting) => {
    setEditingMeetingId(m.id);
    setMeetingForm({
      title: m.title,
      agenda: m.agenda,
      startTime: m.startTime,
      endTime: m.endTime,
      meetLink: m.meetLink,
      timezone: m.timezone,
    });
  };

  const handleSaveMeeting = async (meetingId: string) => {
    setIsSubmitting(true);
    try {
      await api.updateMeeting(meetingId, meetingForm);
      await onRefreshData();
      setEditingMeetingId(null);
      showSuccess(`Meeting "${meetingForm.title}" updated and saved to database.`);
    } catch (err: any) {
      showError(`Failed to update meeting: ${err.message || 'Check input fields'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await api.deleteMeeting(meetingId);
      await onRefreshData();
      setConfirmDeleteId(null);
      showSuccess(`Meeting removed from schedule.`);
    } catch (err: any) {
      showError(`Failed to delete meeting: ${err.message}`);
    }
  };

  const handleSendMeetingEmail = async (meetingId: string) => {
    setSendingEmailMeetingId(meetingId);
    try {
      const res = await api.sendMeetingEmail(meetingId);
      await onRefreshData();
      showSuccess(`Meeting email dispatched to ${res.recipients.length} intern(s): ${res.recipients.map(r => r.name).join(', ')}.`);
    } catch (err: any) {
      showError(`Email dispatch error: ${err.message}`);
    } finally {
      setSendingEmailMeetingId(null);
    }
  };

  const handleQuickSaveDeadline = async (taskId: string) => {
    if (!newDeadlineVal) return;
    setIsSubmitting(true);
    try {
      await api.updateTask(taskId, { deadline: newDeadlineVal });
      await onRefreshData();
      setEditingDeadlineTaskId(null);
      showSuccess(`Task deadline updated to ${new Date(newDeadlineVal).toLocaleString()}.`);
    } catch (err: any) {
      showError(`Failed to update deadline: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    try {
      await api.deleteTask(taskId);
      await onRefreshData();
      setConfirmDeleteId(null);
      showSuccess(`Task "${title}" deleted.`);
    } catch (err: any) {
      showError(`Failed to delete task: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Trainer &amp; Admin Control Panel</h2>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  PROTOTYPE ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct prototype access to create/edit tasks, adjust deadlines, and manage verified Google Meet schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Prominent Return Button */}
            <button
              onClick={onReturnToChatbot}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all hover:scale-[1.02]"
              title="Close trainer panel and return to the Intern Chatbot"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <Bot className="h-4 w-4" />
              <span>Return to Intern Chatbot</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Close Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="bg-amber-950/50 border-b border-amber-500/30 px-6 py-2.5 text-xs text-amber-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Prototype Demonstration Access:</strong> This control panel is provided for demonstration convenience. It does <em>not</em> represent real production security or restrict access to enterprise office staff. Production environments enforce Okta/Azure SSO and server-side RBAC.
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-mono hidden md:inline">Storage: JSON ACID DB</span>
        </div>

        {/* Success toast message */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Error toast message */}
        {actionErrorMsg && (
          <div className="bg-rose-950/90 border-b border-rose-500/40 px-6 py-2 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
            <button
              onClick={() => setActionErrorMsg(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Panel Tabs & Quick Actions */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tasks &amp; Deadlines ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'meetings'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Meetings &amp; Links ({meetings.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'tasks' ? (
              <button
                onClick={onOpenCreateTask}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Task</span>
              </button>
            ) : (
              <button
                onClick={onOpenCreateMeeting}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Meeting</span>
              </button>
            )}

            <button
              onClick={async () => {
                await onRefreshData();
                showSuccess('Database records refreshed.');
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Refresh database records"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Manage assigned tasks, update deadlines, or edit acceptance criteria:</span>
                <span className="text-blue-400">Changes immediately update the AI chatbot's answers</span>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-xs text-slate-400">No tasks currently stored in the database.</p>
                  <button
                    onClick={onOpenCreateTask}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create First Task
                  </button>
                </div>
              ) : (
                tasks.map((task) => {
                  const isEditingDeadline = editingDeadlineTaskId === task.id;
                  const isOverdue = new Date(task.deadline) < new Date();

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                              {task.id}
                            </span>
                            <span className="text-sm font-semibold text-white">{task.title}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{task.problemStatement}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditTask(task)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-purple-500 hover:bg-purple-600/20 transition-colors"
                            title="Edit full problem statement, criteria, and assignees"
                          >
                            <Edit3 className="h-3 w-3 text-purple-400" />
                            <span>Edit Task</span>
                          </button>

                          {confirmDeleteId === task.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeleteTask(task.id, task.title)}
                                className="flex items-center gap-1 rounded-lg border border-rose-500 bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                              >
                                <span>Confirm?</span>
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(task.id)}
                              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-rose-400 hover:border-rose-500 hover:bg-rose-950/40 transition-colors"
                              title="Delete task from database"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Deadline & Deliverables Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-xs">
                        {/* Deadline Editor */}
                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-blue-400" />
                              <span>Deadline</span>
                              {isOverdue && (
                                <span className="text-[10px] text-rose-400 font-bold">(Overdue)</span>
                              )}
                            </span>
                            {!isEditingDeadline && (
                              <button
                                onClick={() => {
                                  setEditingDeadlineTaskId(task.id);
                                  setNewDeadlineVal(task.deadline);
                                }}
                                className="text-[11px] text-blue-400 hover:underline"
                              >
                                Change Deadline
                              </button>
                            )}
                          </div>

                          {isEditingDeadline ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={newDeadlineVal}
                                onChange={(e) => setNewDeadlineVal(e.target.value)}
                                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                                className="flex-1 rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white font-mono"
                              />
                              <button
                                onClick={() => handleQuickSaveDeadline(task.id)}
                                disabled={isSubmitting}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingDeadlineTaskId(null)}
                                className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-slate-200 font-mono text-[11px]">
                              {new Date(task.deadline).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          )}
                        </div>

                        {/* Deliverables & Assignees */}
                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Track: <strong className="text-slate-200">{task.track}</strong></span>
                            <span>{(task.acceptanceCriteria || []).length} Criteria</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Deliverables: {(task.deliverables || []).join(', ')}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Assigned to: {(task.assignedTo || []).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Manage meeting dates, times, agendas, and verified Google Meet URLs:</span>
                <span className="text-blue-400">Grounded in DB — intern chat will provide exact links</span>
              </div>

              {meetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-xs text-slate-400">No meetings scheduled in the system.</p>
                  <button
                    onClick={onOpenCreateMeeting}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Schedule First Meeting
                  </button>
                </div>
              ) : (
                meetings.map((meeting) => {
                  const isEditing = editingMeetingId === meeting.id;

                  return (
                    <div
                      key={meeting.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700 space-y-3"
                    >
                      {isEditing ? (
                        /* Editing Form */
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-semibold text-purple-300">
                              Editing Meeting: {meeting.id}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveMeeting(meeting.id)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                <Save className="h-3.5 w-3.5" />
                                <span>Save Changes</span>
                              </button>
                              <button
                                onClick={() => setEditingMeetingId(null)}
                                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                                Meeting Title
                              </label>
                              <input
                                type="text"
                                value={meetingForm.title}
                                onChange={(e) =>
                                  setMeetingForm((prev) => ({ ...prev, title: e.target.value }))
                                }
                                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                                Google Meet Link
                              </label>
                              <input
                                type="url"
                                value={meetingForm.meetLink}
                                onChange={(e) =>
                                  setMeetingForm((prev) => ({ ...prev, meetLink: e.target.value }))
                                }
                                placeholder="https://meet.google.com/..."
                                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                              Meeting Agenda
                            </label>
                            <textarea
                              rows={2}
                              value={meetingForm.agenda}
                              onChange={(e) =>
                                setMeetingForm((prev) => ({ ...prev, agenda: e.target.value }))
                              }
                              className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                                Start Time (ISO)
                              </label>
                              <input
                                type="text"
                                value={meetingForm.startTime}
                                onChange={(e) =>
                                  setMeetingForm((prev) => ({ ...prev, startTime: e.target.value }))
                                }
                                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                                End Time (ISO)
                              </label>
                              <input
                                type="text"
                                value={meetingForm.endTime}
                                onChange={(e) =>
                                  setMeetingForm((prev) => ({ ...prev, endTime: e.target.value }))
                                }
                                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                                Timezone
                              </label>
                              <input
                                type="text"
                                value={meetingForm.timezone}
                                onChange={(e) =>
                                  setMeetingForm((prev) => ({ ...prev, timezone: e.target.value }))
                                }
                                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Read-only view with Edit Trigger */
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                                  {meeting.id}
                                </span>
                                <span className="text-sm font-semibold text-white">{meeting.title}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{meeting.agenda}</p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSendMeetingEmail(meeting.id)}
                                disabled={sendingEmailMeetingId === meeting.id}
                                className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300 hover:border-blue-500 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                                title="Send meeting details, date/time, agenda and Google Meet URL to selected interns"
                              >
                                <Mail className="h-3 w-3 text-blue-400" />
                                <span>{sendingEmailMeetingId === meeting.id ? 'Sending...' : 'Send Email'}</span>
                              </button>

                              <button
                                onClick={() => handleStartEditMeeting(meeting)}
                                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-purple-500 hover:bg-purple-600/20 transition-colors"
                              >
                                <Edit3 className="h-3 w-3 text-purple-400" />
                                <span>Edit</span>
                              </button>

                              {confirmDeleteId === meeting.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                    className="flex items-center gap-1 rounded-lg border border-rose-500 bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                                  >
                                    <span>Confirm?</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(meeting.id)}
                                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-rose-400 hover:border-rose-500 hover:bg-rose-950/40 transition-colors"
                                  title="Delete meeting from schedule"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                              <span>
                                {new Date(meeting.startTime).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}{' '}
                                ({meeting.timezone})
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px] truncate">
                                <Video className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                <span className="truncate">{meeting.meetLink}</span>
                              </div>
                              <a
                                href={meeting.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                              >
                                <span>Test</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer with Return Action */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3.5 gap-2 text-xs">
          <div className="text-slate-400">
            <span>Logged changes are persistent across app reloads.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToChatbot}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              <Bot className="h-4 w-4" />
              <span>← Return to Intern Chatbot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
