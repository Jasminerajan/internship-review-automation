import React, { useState } from 'react';
import { X, Plus, Trash2, Layers, Calendar, CheckCircle2 } from 'lucide-react';
import { Task, AcceptanceCriterion, User } from '../types/index.js';
import { api } from '../api.js';

interface CreateTaskModalProps {
  interns: User[];
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  interns,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [track, setTrack] = useState('Backend Engineering');
  const [cohort, setCohort] = useState('Cohort 2026-Q1');
  const [problemStatement, setProblemStatement] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState('2026-10-30T18:00:00Z');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [assignedTarget, setAssignedTarget] = useState<'ALL' | string>('ALL');

  const [deliverablesText, setDeliverablesText] = useState(
    'Production source code file\nAutomated unit test suite with pass/fail assertions\nDocumentation markdown'
  );

  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>([
    {
      id: 'AC-1',
      category: 'Functionality',
      description: 'Core logic functions according to problem statement specifications.',
      weight: 35,
      required: true,
    },
    {
      id: 'AC-2',
      category: 'Code Quality',
      description: 'Strict type safety, clean error handling, and modular structure.',
      weight: 35,
      required: true,
    },
    {
      id: 'AC-3',
      category: 'Testing',
      description: 'Automated test suite executes and passes in isolated sandbox.',
      weight: 30,
      required: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `AC-${Date.now()}`,
        category: 'Functionality',
        description: 'Additional acceptance requirement',
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

      const created = await api.createTask({
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
        referenceDocs: [
          {
            title: `${track} Standards & Guide`,
            url: 'https://handbook.acmecorp.internal/engineering',
            type: 'guide',
          },
        ],
      });

      onTaskCreated(created);
      onClose();
    } catch (err: any) {
      setModalError(err.message || 'Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              <span>Create &amp; Assign Daily Milestone Task</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dispatched directly to authorized intern task queues and chatbot knowledge graphs.
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
                placeholder="e.g. Distributed Cache & Invalidation Protocol"
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
                <option value="urgent">Urgent</option>
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
              rows={2}
              placeholder="State the technical goal and enterprise constraints clearly..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Step-by-Step Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="1. Author module...\n2. Enforce checks...\n3. Write test cases..."
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
                  key={c.id}
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Publish &amp; Dispatch Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
