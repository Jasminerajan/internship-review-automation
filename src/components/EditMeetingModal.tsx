import React, { useState } from 'react';
import { X, Calendar, Video, Clock, Users, Mail, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Meeting, User } from '../types/index.js';
import { api } from '../api.js';

interface EditMeetingModalProps {
  meeting: Meeting;
  interns: User[];
  onClose: () => void;
  onMeetingUpdated: (updated: Meeting) => void;
  onMeetingDeleted?: (id: string) => void;
}

export const EditMeetingModal: React.FC<EditMeetingModalProps> = ({
  meeting,
  interns,
  onClose,
  onMeetingUpdated,
  onMeetingDeleted,
}) => {
  const initialStartDate = new Date(meeting.startTime);
  const initialEndDate = new Date(meeting.endTime);

  const initialDateStr = initialStartDate.toISOString().split('T')[0];
  const initialStartTimeStr = initialStartDate.toISOString().split('T')[1].slice(0, 5);
  const initialEndTimeStr = initialEndDate.toISOString().split('T')[1].slice(0, 5);

  const [title, setTitle] = useState(meeting.title);
  const [agenda, setAgenda] = useState(meeting.agenda);
  const [meetingDate, setMeetingDate] = useState(initialDateStr);
  const [startTime, setStartTime] = useState(initialStartTimeStr);
  const [endTime, setEndTime] = useState(initialEndTimeStr);
  const [timezone, setTimezone] = useState(meeting.timezone || 'UTC');
  const [meetLink, setMeetLink] = useState(meeting.meetLink);
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>(
    meeting.attendeeInternIds || ['ALL']
  );
  const [reminderMinutes, setReminderMinutes] = useState(meeting.reminderMinutesBefore || 15);
  const [status, setStatus] = useState<Meeting['status']>(meeting.status || 'upcoming');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    recipients?: string[];
  } | null>(null);

  const toggleIntern = (id: string) => {
    if (id === 'ALL') {
      setSelectedInternIds(['ALL']);
      return;
    }

    let next = selectedInternIds.filter((x) => x !== 'ALL');
    if (next.includes(id)) {
      next = next.filter((x) => x !== id);
    } else {
      next.push(id);
    }

    if (next.length === 0) {
      setSelectedInternIds(['ALL']);
    } else {
      setSelectedInternIds(next);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    try {
      const startIso = new Date(`${meetingDate}T${startTime}:00Z`).toISOString();
      const endIso = new Date(`${meetingDate}T${endTime}:00Z`).toISOString();

      const updated = await api.updateMeeting(meeting.id, {
        title,
        agenda,
        startTime: startIso,
        endTime: endIso,
        timezone,
        meetLink,
        attendeeInternIds: selectedInternIds,
        reminderMinutesBefore: reminderMinutes,
        status,
      });

      onMeetingUpdated(updated);
      onClose();
    } catch (err: any) {
      setActionError(`Error updating meeting: ${err.message || 'Check input fields'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailNow = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    setActionError(null);

    try {
      const res = await api.sendMeetingEmail(meeting.id);
      setEmailStatus({
        type: 'success',
        message: `Verified meeting notification sent to ${res.recipients.length} intern(s).`,
        recipients: res.recipients.map((r) => `${r.name} (${r.email})`),
      });
      // Refresh parent meeting state
      onMeetingUpdated({
        ...meeting,
        lastEmailSentAt: new Date().toISOString(),
        lastEmailRecipientCount: res.recipients.length,
        lastEmailStatus: 'sent',
      });
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'Email delivery failed. Verify SMTP settings in backend environment.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setActionError(null);
    try {
      await api.deleteMeeting(meeting.id);
      if (onMeetingDeleted) {
        onMeetingDeleted(meeting.id);
      }
      onClose();
    } catch (err: any) {
      setActionError(`Failed to delete meeting: ${err.message}`);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-purple-400 font-bold">{meeting.id}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                Host: {meeting.hostTrainerName}
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>Edit Mentorship Meeting &amp; Dispatch</span>
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Meeting Agenda
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Date, Time & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-purple-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Video className="h-3 w-3 text-emerald-400" />
                <span>Google Meet URL</span>
              </label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/Los_Angeles (PST, UTC-8)">PST (UTC-8) - Los Angeles</option>
                <option value="America/New_York (EST, UTC-5)">EST (UTC-5) - New York</option>
                <option value="Europe/London (GMT, UTC+0)">GMT (UTC+0) - London</option>
                <option value="Asia/Dubai (GST, UTC+4)">GST (UTC+4) - Dubai</option>
              </select>
            </div>
          </div>

          {/* Selected Intern Attendees */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>Selected Intern Attendees</span>
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center gap-2 p-1 rounded hover:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedInternIds.includes('ALL')}
                  onChange={() => toggleIntern('ALL')}
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0"
                />
                <span className="font-semibold text-white">Entire Cohort (All Interns)</span>
                <span className="text-[10px] text-slate-400 ml-auto">({interns.length} interns)</span>
              </label>

              <div className="border-t border-slate-800/80 pt-2 space-y-1">
                {interns.map((intern) => {
                  const isChecked = selectedInternIds.includes('ALL') || selectedInternIds.includes(intern.id);
                  return (
                    <label
                      key={intern.id}
                      className="flex items-center gap-2.5 p-1 rounded hover:bg-slate-900 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={selectedInternIds.includes('ALL')}
                        onChange={() => toggleIntern(intern.id)}
                        className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 disabled:opacity-40"
                      />
                      <span className="font-medium text-white">{intern.name}</span>
                      <span className="font-mono text-[10px] text-blue-400">{intern.email}</span>
                      <span className="ml-auto text-[10px] text-slate-500">{intern.track}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Send Email Section inside Modal */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-white">Dispatch Verified Email to Attendees</span>
              </div>
              <button
                type="button"
                onClick={handleSendEmailNow}
                disabled={isSendingEmail}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-md shadow-blue-600/30"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{isSendingEmail ? 'Dispatching...' : 'Send Meeting Email Now'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Sends conference title, date &amp; time with timezone, agenda, and clickable Google Meet URL directly to the selected interns' registered addresses.
            </p>

            {emailStatus && (
              <div
                className={`mt-2 rounded-lg p-2.5 text-[11px] flex items-start gap-2 ${
                  emailStatus.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                }`}
              >
                {emailStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{emailStatus.message}</div>
                  {emailStatus.recipients && (
                    <div className="mt-1 text-[10px] opacity-80 font-mono">
                      Recipients: {emailStatus.recipients.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 rounded-lg border border-rose-500 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Meeting</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shadow-md shadow-purple-600/30"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
