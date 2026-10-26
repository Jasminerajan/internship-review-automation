import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Code,
  Github,
  Award,
  Sparkles,
  Edit3,
  UserCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Submission, User } from '../types/index.js';
import { api } from '../api.js';

interface SubmissionsViewProps {
  submissions: Submission[];
  currentUser: User;
  onRefreshData: () => void;
  selectedSubmissionId?: string;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  currentUser,
  onRefreshData,
  selectedSubmissionId,
}) => {
  const [activeSubId, setActiveSubId] = useState<string>(
    selectedSubmissionId || (submissions[0]?.id || '')
  );
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW'>('PASS');
  const [overrideScore, setOverrideScore] = useState(90);
  const [overrideFeedback, setOverrideFeedback] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSubmissionId) {
      setActiveSubId(selectedSubmissionId);
    }
  }, [selectedSubmissionId]);

  const isTrainer = currentUser.role === 'trainer' || currentUser.role === 'admin';
  const activeSubmission = submissions.find((s) => s.id === activeSubId) || submissions[0];

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    setIsOverriding(true);
    setOverrideError(null);

    try {
      await api.overrideEvaluation(activeSubmission.id, {
        newStatus: overrideStatus,
        scorePercent: overrideScore,
        trainerFeedback: overrideFeedback,
      });
      setShowOverrideModal(false);
      onRefreshData();
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to apply trainer override');
    } finally {
      setIsOverriding(false);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
        <FileCode2 className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white">No Submissions Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Submit your work on the Tasks tab to trigger automated isolated sandbox execution and Gemini rubric evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Submissions Sidebar (Left Column) */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Work Submissions ({submissions.length})
          </h2>
          <span className="text-[11px] text-blue-400">Click to inspect rubric</span>
        </div>

        <div className="space-y-2">
          {submissions.map((sub) => {
            const report = sub.evaluationReport;
            const isSelected = sub.id === activeSubId;

            return (
              <div
                key={sub.id}
                onClick={() => setActiveSubId(sub.id)}
                className={`group flex flex-col rounded-xl border p-3.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/15 shadow-lg shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-blue-400">{sub.taskId}</span>
                  {report && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        report.overallStatus === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : report.overallStatus === 'NEEDS IMPROVEMENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {report.overallStatus} ({report.scorePercent}%)
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-white mt-1 truncate">
                  {sub.taskTitle || 'Task Assignment'}
                </h4>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{sub.internName}</span>
                  <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation Report Detail (Right Column) */}
      {activeSubmission && (
        <div className="lg:col-span-8 space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400">{activeSubmission.taskId}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">Submission ID: {activeSubmission.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{activeSubmission.taskTitle}</h3>
                <p className="text-xs text-slate-400">
                  Submitted by <strong className="text-slate-200">{activeSubmission.internName}</strong> ({activeSubmission.internTrack || 'Engineering'}) on {new Date(activeSubmission.submittedAt).toLocaleString()}
                </p>
              </div>

              {/* Status Badge & Score */}
              {activeSubmission.evaluationReport && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      {activeSubmission.evaluationReport.scorePercent}%
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Rubric Score
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border px-3.5 py-2 text-center ${
                      activeSubmission.evaluationReport.overallStatus === 'PASS'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : activeSubmission.evaluationReport.overallStatus === 'NEEDS IMPROVEMENT'
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    }`}
                  >
                    <div className="text-xs font-black uppercase tracking-wider">
                      {activeSubmission.evaluationReport.overallStatus}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {activeSubmission.evaluationReport.trainerOverride ? 'Trainer Overridden' : 'AI Evaluated'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advisory disclaimer & Trainer Override Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  Advisory Gemini Report ({activeSubmission.evaluationReport?.modelUsed || 'gemini-3.8-flash'})
                </span>
              </div>

              {isTrainer && (
                <button
                  onClick={() => {
                    setOverrideStatus(activeSubmission.evaluationReport?.overallStatus || 'PASS');
                    setOverrideScore(activeSubmission.evaluationReport?.scorePercent || 85);
                    setOverrideFeedback(
                      activeSubmission.evaluationReport?.trainerOverride?.trainerFeedback ||
                        'Reviewed by Lead Mentor. Code demonstrates solid structure and meets enterprise expectations.'
                    );
                    setShowOverrideModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Review &amp; Override (Trainer)</span>
                </button>
              )}
            </div>
          </div>

          {/* Trainer Override Notice if active */}
          {activeSubmission.evaluationReport?.trainerOverride && (
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-purple-300">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  Trainer Mentor Override Applied
                </span>
                <span className="text-[11px] text-purple-400/80">
                  By {activeSubmission.evaluationReport.trainerOverride.trainerName} •{' '}
                  {new Date(activeSubmission.evaluationReport.trainerOverride.overrideAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-300 italic">
                "{activeSubmission.evaluationReport.trainerOverride.trainerFeedback}"
              </p>
            </div>
          )}

          {/* Detailed Rubric Sections */}
          {activeSubmission.evaluationReport && (
            <div className="space-y-4">
              {/* Requirements Satisfied (Section a) */}
              <div className="rounded-xl border border-emerald-500/20 bg-slate-900/70 p-4 space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Requirements Satisfied ({(activeSubmission.evaluationReport.requirementsSatisfied || []).length})
                </h4>
                {(activeSubmission.evaluationReport.requirementsSatisfied || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">None completely satisfied yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(activeSubmission.evaluationReport.requirementsSatisfied || []).map((r, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                        <div className="font-semibold text-slate-200">{r.requirement}</div>
                        <div className="text-slate-400 mt-0.5 text-[11px]">Evidence: {r.evidence}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements Partially Satisfied (Section b) */}
              {(activeSubmission.evaluationReport.requirementsPartiallySatisfied || []).length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    Requirements Partially Satisfied ({(activeSubmission.evaluationReport.requirementsPartiallySatisfied || []).length})
                  </h4>
                  <div className="space-y-2">
                    {(activeSubmission.evaluationReport.requirementsPartiallySatisfied || []).map((r, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                        <div className="font-semibold text-slate-200">{r.requirement}</div>
                        <div className="text-amber-400/90 mt-0.5 text-[11px]">Missing: {r.missing}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements Not Satisfied (Section c) */}
              {(activeSubmission.evaluationReport.requirementsNotSatisfied || []).length > 0 && (
                <div className="rounded-xl border border-rose-500/20 bg-slate-900/70 p-4 space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    Requirements Not Satisfied ({(activeSubmission.evaluationReport.requirementsNotSatisfied || []).length})
                  </h4>
                  <div className="space-y-2">
                    {(activeSubmission.evaluationReport.requirementsNotSatisfied || []).map((r, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                        <div className="font-semibold text-slate-200">{r.requirement}</div>
                        <div className="text-rose-400/90 mt-0.5 text-[11px]">Reason: {r.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automated Test Suite & Sandbox Evidence (Section d) */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Terminal className="h-4 w-4 text-blue-400" />
                    Evidence &amp; Automated Test Results
                  </h4>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Runtime: {activeSubmission.evaluationReport.evidenceAndTestResults?.runtime || 'Node vm Sandbox'}
                  </span>
                </div>

                {activeSubmission.evaluationReport.evidenceAndTestResults?.testSuiteOutput && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {activeSubmission.evaluationReport.evidenceAndTestResults.testSuiteOutput}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(activeSubmission.evaluationReport.evidenceAndTestResults?.tests || []).map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-slate-800/80 bg-slate-950/40 px-2.5 py-1.5"
                    >
                      <span className="truncate text-slate-300">{t.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          t.status === 'passed' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {t.status.toUpperCase()} ({t.executionTimeMs}ms)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Implementation (Section e) */}
              {(activeSubmission.evaluationReport.missingImplementation || []).length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Missing Implementation Checkpoints
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    {(activeSubmission.evaluationReport.missingImplementation || []).map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Corrections & Guidance (Section f) */}
              {(activeSubmission.evaluationReport.suggestedCorrections || []).length > 0 && (
                <div className="rounded-xl border border-blue-500/20 bg-slate-900/70 p-4 space-y-3">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <Sparkles className="h-4 w-4" />
                    Suggested Corrections &amp; Mentor Guidance
                  </h4>
                  <div className="space-y-3">
                    {(activeSubmission.evaluationReport.suggestedCorrections || []).map((s, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                        <div className="text-xs font-semibold text-slate-200">{s.fileOrTopic}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{s.explanation}</p>
                        {s.suggestedCodeSnippet && (
                          <pre className="rounded-md border border-slate-800 bg-slate-900 p-2.5 font-mono text-[11px] text-blue-300 overflow-x-auto whitespace-pre">
                            {s.suggestedCodeSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw Submitted Content Viewer */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code className="h-4 w-4 text-blue-400" />
              <span>Intern's Submitted Work Payload</span>
            </h4>

            {activeSubmission.githubRepoUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-blue-300">
                <Github className="h-4 w-4" />
                <a
                  href={activeSubmission.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {activeSubmission.githubRepoUrl} (branch: {activeSubmission.githubBranch || 'main'})
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {activeSubmission.textContent && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                {activeSubmission.textContent}
              </div>
            )}

            {activeSubmission.codeContent && (
              <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 overflow-x-auto max-h-72">
                {activeSubmission.codeContent}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Trainer Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-400" />
              <span>Trainer Manual Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              As a trainer, you can adjust status, refine scores, and provide binding mentorship feedback.
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="PASS">PASS (Approved)</option>
                  <option value="NEEDS IMPROVEMENT">NEEDS IMPROVEMENT (Revision Requested)</option>
                  <option value="TRAINER REVIEW">TRAINER REVIEW (Requires 1:1 Discussion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Score Percentage (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trainer Mentor Feedback
                </label>
                <textarea
                  value={overrideFeedback}
                  onChange={(e) => setOverrideFeedback(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  placeholder="Explain your grading rationale and actionable guidance..."
                  required
                />
              </div>

              {overrideError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-950/80 border border-rose-500/40 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOverriding}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
