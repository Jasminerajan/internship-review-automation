import React, { useState } from 'react';
import { X, Plus, Trash2, Layers, Calendar, CheckCircle2, Edit3 } from 'lucide-react';
import { Task, AcceptanceCriterion, User } from '../types/index.js';
import { api } from '../api.js';

interface EditTaskModalProps {
  task: Task;
  interns: User[];
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  interns,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [title, setTitle] = useState(task.title);
  const [track, setTrack] = useState(task.track);
  const [cohort, setCohort] = useState(task.cohort);
  const [problemStatement, setProblemStatement] = useState(task.problemStatement);
  const [instructions, setInstructions] = useState(task.instructions);
  const [deadline, setDeadline] = useState(task.deadline);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority);
  const [assignedTarget, setAssignedTarget] = useState<string>(
    task.assignedTo.includes('ALL') ? 'ALL' : task.assignedTo[0] || 'ALL'
  );

  const [deliverablesText, setDeliverablesText] = useState(task.deliverables.join('\n'));
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>(
    task.acceptanceCriteria.map((c) => ({ ...c }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `AC-${Date.now()}`,
        category: 'Functionality',
        description: 'New verified acceptance criterion',
        weight: 20,
        required: true,
      },
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleUpdateCriterion = (idx: number, updates: Partial<AcceptanceCriterion>) => {
    const copy = [...criteria];
    copy[idx] = { ...copy[idx], ...updates };
    setCriteria(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const deliverables = deliverablesText
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      const assignedTo = assignedTarget === 'ALL' ? ['ALL'] : [assignedTarget];

      const updated = await api.updateTask(task.id, {
        title,
        track,
        cohort,
        problemStatement,
        instructions,
        deliverables,
        acceptanceCriteria: criteria,
        deadline,
        priority,
        assignedTo,
      });

      onTaskUpdated(updated);
      onClose();
    } catch (err: any) {
      setModalError(err.message || 'Error updating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    setModalError(null);
    try {
      await api.deleteTask(task.id);
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      setModalError(err.message || 'Error deleting task');
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                {task.id}
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-400" />
                <span>Edit &amp; Reassign Milestone Task</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates persist directly to the database and re-ground chatbot responses for assigned interns.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Engineering Track
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="Backend Engineering">Backend Engineering</option>
                <option value="Frontend Engineering">Frontend Engineering</option>
                <option value="Full-Stack Engineering">Full-Stack Engineering</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="AI & Data Engineering">AI & Data Engineering</option>
                <option value="All Tracks">All Tracks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Assignee Target
              </label>
              <select
                value={assignedTarget}
                onChange={(e) => setAssignedTarget(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="ALL">Entire Cohort (ALL)</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.name} ({intern.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Deadline (ISO Date/Time)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Problem Statement
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Required Deliverables (one per line)
            </label>
            <textarea
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              required
            />
          </div>

          {/* Acceptance Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Acceptance Criteria &amp; Weights (Rubric)
              </label>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 rounded bg-blue-600/30 border border-blue-500/40 px-2 py-0.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-600/50"
              >
                <Plus className="h-3 w-3" />
                Add Rubric Item
              </button>
            </div>

            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs"
                >
                  <select
                    value={c.category}
                    onChange={(e) => handleUpdateCriterion(idx, { category: e.target.value as any })}
                    className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 text-[11px]"
                  >
                    <option value="Functionality">Functionality</option>
                    <option value="Code Quality">Code Quality</option>
                    <option value="Testing">Testing</option>
                    <option value="Security">Security</option>
                    <option value="Documentation">Documentation</option>
                  </select>

                  <input
                    type="text"
                    value={c.description}
                    onChange={(e) => handleUpdateCriterion(idx, { description: e.target.value })}
                    placeholder="Requirement description"
                    className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-white text-xs"
                    required
                  />

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Weight:</span>
                    <input
                      type="number"
                      value={c.weight}
                      onChange={(e) => handleUpdateCriterion(idx, { weight: Number(e.target.value) })}
                      className="w-12 rounded border border-slate-800 bg-slate-900 px-1 py-1 text-white text-center font-mono"
                    />
                    <span>%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="rounded p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {modalError && (
            <div className="rounded-lg bg-rose-950/80 border border-rose-500/40 p-2.5 text-xs text-rose-300">
              {modalError}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-rose-300 font-semibold">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Task</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
