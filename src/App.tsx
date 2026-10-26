/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Task, Submission, Meeting, TrainerDashboardStats, InternDashboardStats } from './types/index.js';
import { api } from './api.js';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { TasksView } from './components/TasksView.js';
import { SubmissionsView } from './components/SubmissionsView.js';
import { MeetingsView } from './components/MeetingsView.js';
import { TrainerDashboard } from './components/TrainerDashboard.js';
import { ArchitectureDocs } from './components/ArchitectureDocs.js';
import { CreateTaskModal } from './components/CreateTaskModal.js';
import { EditTaskModal } from './components/EditTaskModal.js';
import { CreateMeetingModal } from './components/CreateMeetingModal.js';
import { EditMeetingModal } from './components/EditMeetingModal.js';
import { TrainerPanelModal } from './components/TrainerPanelModal.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { AlertCircle, X, RotateCcw } from 'lucide-react';

export default function App() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('chat');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [trainerStats, setTrainerStats] = useState<TrainerDashboardStats | null>(null);
  const [internStats, setInternStats] = useState<InternDashboardStats | null>(null);

  const [isTrainerPanelOpen, setIsTrainerPanelOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial users
  useEffect(() => {
    async function init() {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
        const defaultUser = users.find((u) => u.id === 'INT-2026-001') || users[0];
        if (defaultUser) {
          api.setAuthContext(defaultUser.id, defaultUser.role);
          setCurrentUser(defaultUser);
        }
      } catch (err: any) {
        console.error('Failed to initialize users:', err);
        setErrorMessage(`Server connection failure: ${err.message || 'Unable to load user roster.'}`);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch authorized data whenever currentUser changes
  const refreshData = async () => {
    if (!currentUser) return;
    try {
      api.setAuthContext(currentUser.id, currentUser.role);

      const [loadedTasks, loadedSubs, loadedMeetings, tStats] = await Promise.all([
        api.getTasks(),
        api.getSubmissions(),
        api.getMeetings(),
        api.getTrainerStats().catch(() => null),
      ]);

      setTasks(loadedTasks);
      setSubmissions(loadedSubs);
      setMeetings(loadedMeetings);
      if (tStats) {
        setTrainerStats(tStats);
      }

      if (currentUser.role !== 'trainer' && currentUser.role !== 'admin') {
        const iStats = await api.getInternStats(currentUser.id).catch(() => null);
        if (iStats) setInternStats(iStats);
      }
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setErrorMessage(err.message || 'Error communicating with database API');
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
    api.setAuthContext(user.id, user.role);
    if (user.role === 'trainer') {
      setActiveTab('trainer');
    }
  };

  const handleConfirmReset = async () => {
    setShowResetConfirm(false);
    try {
      await api.resetDemo();
      if (currentUser) {
        await refreshData();
      }
    } catch (err: any) {
      setErrorMessage(`Reset failed: ${err.message}`);
    }
  };

  const handleNavigateTab = (tab: string, targetId?: string) => {
    setActiveTab(tab);
    if (tab === 'tasks' && targetId) {
      setSelectedTaskId(targetId);
    } else if (tab === 'submissions' && targetId) {
      setSelectedSubmissionId(targetId);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading InternMate AI Engine...</p>
        </div>
      </div>
    );
  }

  const pendingTasksCount = tasks.filter((t) => {
    const sub = submissions.find((s) => s.taskId === t.id && s.internId === currentUser.id);
    return !sub || sub.status !== 'passed';
  }).length;

  const internsList = allUsers.filter((u) => u.role === 'intern');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUserSwitch={handleUserSwitch}
        onResetDemo={() => setShowResetConfirm(true)}
        pendingCount={pendingTasksCount}
        onOpenTrainerPanel={() => setIsTrainerPanelOpen(true)}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-500/40 px-4 py-2.5 text-xs text-rose-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded p-0.5 hover:bg-rose-900/60 text-rose-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Non-blocking Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Reset Demo Database?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will restore the database to its pristine sample state with default tasks, submissions, rubrics, and mentorship meetings. Any prototype edits will be reset.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/30"
              >
                Yes, Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <ErrorBoundary fallbackTab={activeTab} onResetToChat={() => setActiveTab('chat')}>
          {activeTab === 'chat' && (
            <ChatView currentUser={currentUser} onNavigateTab={handleNavigateTab} />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              submissions={submissions}
              currentUser={currentUser}
              allInterns={internsList}
              onRefreshData={refreshData}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              selectedTaskId={selectedTaskId}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsView
              submissions={submissions}
              currentUser={currentUser}
              onRefreshData={refreshData}
              selectedSubmissionId={selectedSubmissionId}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              currentUser={currentUser}
              onOpenCreateMeeting={() => setIsCreateMeetingOpen(true)}
              onEditMeeting={(meeting) => setEditingMeeting(meeting)}
              onRefreshData={refreshData}
            />
          )}

          {activeTab === 'trainer' && (
            <TrainerDashboard
              trainerStats={trainerStats}
              interns={internsList}
              tasks={tasks}
              submissions={submissions}
              meetings={meetings}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onOpenCreateMeeting={() => setIsCreateMeetingOpen(true)}
              onEditTask={(task) => setEditingTask(task)}
              onEditMeeting={(meeting) => setEditingMeeting(meeting)}
              onRefreshData={refreshData}
              onSwitchToIntern={(intern) => {
                handleUserSwitch(intern);
                setActiveTab('tasks');
              }}
              onSelectSubmission={(subId) => {
                setSelectedSubmissionId(subId);
                setActiveTab('submissions');
              }}
            />
          )}

          {activeTab === 'docs' && <ArchitectureDocs />}
        </ErrorBoundary>
      </main>

      {/* Modals */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          interns={internsList}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={() => {
            refreshData();
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          interns={internsList}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={() => {
            refreshData();
          }}
          onTaskDeleted={() => {
            refreshData();
          }}
        />
      )}

      {isCreateMeetingOpen && (
        <CreateMeetingModal
          interns={internsList}
          onClose={() => setIsCreateMeetingOpen(false)}
          onMeetingCreated={() => {
            refreshData();
          }}
        />
      )}

      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          interns={internsList}
          onClose={() => setEditingMeeting(null)}
          onMeetingUpdated={() => {
            refreshData();
          }}
          onMeetingDeleted={() => {
            refreshData();
          }}
        />
      )}

      {/* Prototype Trainer/Admin Quick Control Panel */}
      <TrainerPanelModal
        isOpen={isTrainerPanelOpen}
        onClose={() => setIsTrainerPanelOpen(false)}
        onReturnToChatbot={() => {
          setIsTrainerPanelOpen(false);
          setActiveTab('chat');
        }}
        tasks={tasks}
        meetings={meetings}
        interns={internsList}
        onRefreshData={refreshData}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onEditTask={(task) => setEditingTask(task)}
        onOpenCreateMeeting={() => setIsCreateMeetingOpen(true)}
      />
    </div>
  );
}
