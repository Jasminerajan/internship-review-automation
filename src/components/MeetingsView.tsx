import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Users,
  Bell,
  CheckCircle,
  Plus,
  Mail,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Meeting, User } from '../types/index.js';
import { api } from '../api.js';

interface MeetingsViewProps {
  meetings: Meeting[];
  currentUser: User;
  onOpenCreateMeeting?: () => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onRefreshData?: () => Promise<void> | void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  currentUser,
  onOpenCreateMeeting,
  onEditMeeting,
  onRefreshData,
}) => {
  const isTrainer = currentUser.role === 'trainer' || currentUser.role === 'admin';
  const now = new Date();

  const [sendingMeetingId, setSendingMeetingId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    meetingId: string;
    type: 'success' | 'error';
    message: string;
    recipients?: string[];
  } | null>(null);

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const handleSendMeetingEmail = async (meeting: Meeting) => {
    setSendingMeetingId(meeting.id);
    setFeedbackNotice(null);

    try {
      if (isTrainer) {
        const res = await api.sendMeetingEmail(meeting.id);
        setFeedbackNotice({
          meetingId: meeting.id,
          type: 'success',
          message: `Meeting details successfully dispatched to ${res.recipients.length} intern(s).`,
          recipients: res.recipients.map((r) => `${r.name} (${r.email})`),
        });
      } else {
        const res = await api.requestSelfMeetingEmail(meeting.id);
        setFeedbackNotice({
          meetingId: meeting.id,
          type: 'success',
          message: `Meeting details successfully sent to your registered email (${res.recipientEmail}).`,
          recipients: [res.recipientEmail],
        });
      }
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setFeedbackNotice({
        meetingId: meeting.id,
        type: 'error',
        message: err.message || 'Failed to dispatch email. Please check your SMTP configuration in .env.',
      });
    } finally {
      setSendingMeetingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Verified Mentorship Meetings &amp; Standups</span>
            <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-xs font-semibold text-blue-300">
              {meetings.length} Scheduled
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified Google Meet conferences from database. Dispatch meeting details and clickable video links to registered intern emails.
          </p>
        </div>

        {isTrainer && onOpenCreateMeeting && (
          <button
            onClick={onOpenCreateMeeting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {/* Honesty & Security Banner */}
      <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-slate-300">
        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        <span>
          <strong>Data Integrity &amp; Email Delivery:</strong> All meeting URLs and intern email addresses are verified database records.
          Email notifications are transmitted through a secure backend mail service without exposing API secrets or credentials to client code.
        </span>
      </div>

      {/* Meetings Grid */}
      {sortedMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-white">No Mentorship Meetings Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {isTrainer
              ? 'Schedule a new standup or architecture review session using the button above.'
              : 'You have no scheduled meetings at this time. Check back later or ask InternMate AI.'}
          </p>
          {isTrainer && onOpenCreateMeeting && (
            <button
              onClick={onOpenCreateMeeting}
              className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule First Meeting</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMeetings.map((meeting) => {
            const startDate = new Date(meeting.startTime);
            const endDate = new Date(meeting.endTime);
            const isPast = endDate < now;
            const isSending = sendingMeetingId === meeting.id;
            const notice = feedbackNotice?.meetingId === meeting.id ? feedbackNotice : null;

            return (
              <div
                key={meeting.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xl transition-all ${
                  isPast
                    ? 'border-slate-800/60 bg-slate-900/30 opacity-85'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-blue-400 font-bold">{meeting.id}</span>
                        {meeting.lastEmailSentAt && (
                          <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" />
                            <span>Emailed ({meeting.lastEmailRecipientCount || 1})</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">{meeting.title}</h3>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isPast
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isPast ? 'COMPLETED' : 'UPCOMING'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                    <strong className="text-white block mb-1">Agenda:</strong>
                    <p className="text-slate-400 leading-relaxed">{meeting.agenda}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        {startDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({meeting.timezone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        Host: <strong className="text-white">{meeting.hostTrainerName}</strong> • Attendees:{' '}
                        {(meeting.attendeeInternIds || []).includes('ALL')
                          ? 'All Cohort Interns'
                          : `${(meeting.attendeeInternIds || []).length} Assigned Intern(s)`}
                      </span>
                    </div>

                  {meeting.isReminderLogged && (
                    <div className="flex items-center gap-2 text-emerald-400/90 text-[11px]">
                      <Bell className="h-3.5 w-3.5" />
                      <span>
                        Verified Reminder Logged: {meeting.reminderMinutesBefore} minutes before meeting
                      </span>
                    </div>
                  )}
                </div>

                {/* Inline Feedback Notice */}
                {notice && (
                  <div
                    className={`rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                      notice.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {notice.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-semibold">{notice.message}</div>
                      {notice.recipients && (
                        <div className="text-[10px] opacity-75 font-mono">
                          Delivered to: {notice.recipients.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendMeetingEmail(meeting)}
                    disabled={isSending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                    <span>
                      {isSending
                        ? 'Dispatching Email...'
                        : isTrainer
                        ? 'Send Meeting Email'
                        : 'Email Me Details'}
                    </span>
                  </button>

                  {isTrainer && onEditMeeting && (
                    <button
                      onClick={() => onEditMeeting(meeting)}
                      className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-purple-500 hover:text-white transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-purple-400" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
                >
                  <Video className="h-4 w-4" />
                  <span>Launch Google Meet Room</span>
                  <ExternalLink className="h-3.5 w-3.5 text-blue-200" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};
