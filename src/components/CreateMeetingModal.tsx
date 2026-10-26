import React, { useState } from 'react';
import { X, Calendar, Video, Clock, Users, Bell, Mail, CheckCircle2 } from 'lucide-react';
import { Meeting, User } from '../types/index.js';
import { api } from '../api.js';

interface CreateMeetingModalProps {
  interns: User[];
  onClose: () => void;
  onMeetingCreated: (meeting: Meeting) => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  interns,
  onClose,
  onMeetingCreated,
}) => {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-10-30');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [timezone, setTimezone] = useState('UTC');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/qrs-intern-arch');
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>(['ALL']);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [sendEmailImmediately, setSendEmailImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      const startIso = new Date(`${meetingDate}T${startTime}:00Z`).toISOString();
      const endIso = new Date(`${meetingDate}T${endTime}:00Z`).toISOString();

      const created = await api.createMeeting({
        title,
        agenda,
        startTime: startIso,
        endTime: endIso,
        timezone,
        meetLink,
        attendeeInternIds: selectedInternIds,
        reminderMinutesBefore: reminderMinutes,
      });

      if (sendEmailImmediately) {
        setStatusFeedback('Meeting saved. Dispatching email to selected interns...');
        try {
          await api.sendMeetingEmail(created.id);
        } catch (emailErr: any) {
          console.warn('Immediate email send notice:', emailErr.message);
        }
      }

      onMeetingCreated(created);
      onClose();
    } catch (err: any) {
      setStatusFeedback(`Error scheduling meeting: ${err.message || 'Please check input fields.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>Schedule Mentorship Meeting</span>
            </h3>
            <p className="text-xs text-slate-400">
              Create a verified session and optionally notify selected interns via email.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Architecture & A11y Deep Dive"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
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
              placeholder="Detail topics, pull requests to review, and sprint goals..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Date, Times & Timezone */}
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
                <span>Verified Google Meet URL</span>
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

          {/* Selected Interns Multi-Select */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>Selected Intern Attendees</span>
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 max-h-44 overflow-y-auto">
              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer">
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
                      className="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-900 cursor-pointer text-slate-300"
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

          {/* Send Email Notice Option */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-start gap-2.5">
            <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-white">
                <input
                  type="checkbox"
                  checked={sendEmailImmediately}
                  onChange={(e) => setSendEmailImmediately(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>Send Meeting Email to selected interns upon creation</span>
              </label>
              <p className="text-[11px] text-slate-400 leading-normal">
                Dispatches full agenda, verified Google Meet URL, and date/time with timezone to each intern's registered email via backend SMTP.
              </p>
            </div>
          </div>

          {statusFeedback && (
            <div className="text-[11px] text-purple-300 bg-purple-950/60 border border-purple-500/30 rounded-lg p-2.5">
              {statusFeedback}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 font-semibold text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 shadow-md shadow-purple-600/30"
            >
              <Calendar className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Schedule Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
