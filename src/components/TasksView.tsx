import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  Send,
  BookOpen,
  FileCheck,
  Edit3,
} from 'lucide-react';
import { Task, Submission, User } from '../types/index.js';
import { SubmissionModal } from './SubmissionModal.js';
import { EditTaskModal } from './EditTaskModal.js';

interface TasksViewProps {
  tasks: Task[];
  submissions: Submission[];
  currentUser: User;
  allInterns?: User[];
  onRefreshData: () => void;
  onOpenCreateTask?: () => void;
  selectedTaskId?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  submissions,
  currentUser,
  allInterns = [],
  onRefreshData,
  onOpenCreateTask,
  selectedTaskId,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [activeTaskForModal, setActiveTaskForModal] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(selectedTaskId || null);

  useEffect(() => {
    if (selectedTaskId) {
      setExpandedTaskId(selectedTaskId);
    }
  }, [selectedTaskId]);

  const isTrainer = currentUser.role === 'trainer' || currentUser.role === 'admin';
  const now = new Date();

  // Helper to get submission for task
  const getSubmissionForTask = (taskId: string) => {
    return submissions.find((s) => s.taskId === taskId && s.internId === currentUser.id);
  };

  const filteredTasks = tasks.filter((task) => {
    const sub = getSubmissionForTask(task.id);
    const isPassed = sub?.status === 'passed';
    const isOverdue = !isPassed && new Date(task.deadline) < now;

    if (filter === 'pending') return !isPassed;
    if (filter === 'completed') return isPassed;
    if (filter === 'overdue') return isOverdue;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Daily Tasks &amp; Milestones</span>
            <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-xs font-semibold text-blue-300">
              {tasks.length} Assigned
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review problem statements, instructions, deliverables, and automated acceptance criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'pending' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'completed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'overdue' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Overdue
            </button>
          </div>

          {isTrainer && onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <Layers className="h-10 w-10 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-white">No tasks match filter "{filter}"</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {filter === 'completed'
                ? 'You have not completed any tasks yet. Pick an assigned task to begin.'
                : filter === 'overdue'
                ? 'Great job! You have no overdue tasks.'
                : 'No tasks are currently listed under this view.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                View All Tasks ({tasks.length})
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const sub = getSubmissionForTask(task.id);
            const isExpanded = expandedTaskId === task.id;
            const deadlineDate = new Date(task.deadline);
            const isOverdue = (!sub || sub.status !== 'passed') && deadlineDate < now;

            const priorityBadgeColor =
              task.priority === 'urgent'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : task.priority === 'high'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : task.priority === 'medium'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-slate-700 text-slate-300 border-slate-600';

            return (
              <div
                key={task.id}
                className={`rounded-2xl border transition-all ${
                  isOverdue
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : sub?.status === 'passed'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/60'
                } p-5 hover:border-slate-700 shadow-xl backdrop-blur-sm`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{task.id}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadgeColor}`}>
                        {task.priority} Priority
                      </span>
                      <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {task.track}
                      </span>
                      {(task.assignedTo || []).includes('ALL') ? (
                        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                          Assigned: All Cohort
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-blue-400">
                          Assigned: {(task.assignedTo || []).join(', ')}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center gap-1 rounded-md border border-rose-500/50 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                          <AlertCircle className="h-3 w-3" />
                          OVERDUE
                        </span>
                      )}
                    </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{task.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {task.problemStatement}
                  </p>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    {sub?.status === 'passed' ? (
                      <span className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Passed ({sub.evaluationReport?.scorePercent}%)
                      </span>
                    ) : sub?.status === 'needs_improvement' ? (
                      <span className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-bold text-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Needs Revision
                      </span>
                    ) : sub ? (
                      <span className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 font-bold text-blue-400">
                        <FileCheck className="h-3.5 w-3.5" />
                        Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Not Started
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Trainer Edit Button */}
                    {isTrainer && (
                      <button
                        onClick={() => setEditingTask(task)}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                        title="Edit and Reassign Task"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-purple-400" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTaskForModal(task)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{sub ? 'Resubmit' : 'Submit Work'}</span>
                    </button>
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="rounded-xl border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand Details'}
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Deadline & Criteria Count Strip */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    Deadline:{' '}
                    <strong className="text-white">
                      {deadlineDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>{(task.acceptanceCriteria || []).length} Acceptance Criteria</span>
                  <span>•</span>
                  <span>{(task.deliverables || []).length} Deliverable(s)</span>
                </div>

                <button
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isExpanded ? 'Hide Rubric & Docs' : 'View Rubric & Docs'}
                </button>
              </div>

              {/* Expanded Rubric & Instructions Details */}
              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-slate-800 pt-4 text-xs">
                  {/* Detailed Instructions */}
                  <div>
                    <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                      Implementation Instructions
                    </h4>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {task.instructions}
                    </pre>
                  </div>

                  {/* Required Deliverables */}
                  <div>
                    <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                      Required Deliverables
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(task.deliverables || []).map((deliv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300"
                        >
                          <FileCode className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                          <span>{deliv}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acceptance Criteria Rubric */}
                  <div>
                    <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                      Trainer-Defined Acceptance Criteria (Evaluation Rubric)
                    </h4>
                    <div className="space-y-1.5">
                      {(task.acceptanceCriteria || []).map((ac) => (
                        <div
                          key={ac.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                              {ac.category}
                            </span>
                            <span className="text-slate-200">{ac.description}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ac.required && (
                              <span className="rounded bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                                Required
                              </span>
                            )}
                            <span className="font-mono text-xs font-semibold text-blue-400">
                              {ac.weight}% weight
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reference Docs */}
                  {task.referenceDocs && task.referenceDocs.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                        Reference Documents &amp; Specifications
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {task.referenceDocs.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-blue-300 hover:border-blue-500 hover:text-white transition-colors"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                            <span>{doc.title}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {/* Submission Modal */}
      {activeTaskForModal && (
        <SubmissionModal
          task={activeTaskForModal}
          onClose={() => setActiveTaskForModal(null)}
          onSubmissionComplete={() => {
            onRefreshData();
          }}
        />
      )}

      {/* Trainer Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          interns={allInterns}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={() => {
            onRefreshData();
          }}
          onTaskDeleted={() => {
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
