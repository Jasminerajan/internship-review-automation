import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Calendar,
  Layers,
  FileCode2,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  ChevronDown,
  BookOpen,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { User } from '../types/index.js';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUserSwitch: (user: User) => void;
  onResetDemo: () => void;
  pendingCount: number;
  onOpenTrainerPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  activeTab,
  onTabChange,
  onUserSwitch,
  onResetDemo,
  pendingCount,
  onOpenTrainerPanel,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isTrainer = currentUser.role === 'trainer' || currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Banner / Role Switcher Strip */}
      <div className="border-b border-slate-800/60 bg-slate-900/50 px-4 py-1.5 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Live Enterprise Sandbox:</span>
            <span className="text-slate-400">100+ Interns Scale Multi-Tenant Engine</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-blue-400">Isolated Intern RBAC &amp; Gemini Grounding</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 hidden sm:inline">Active Session:</span>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-medium text-slate-200 transition-colors hover:border-blue-500 hover:bg-slate-800"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-4 w-4 rounded-full object-cover"
                />
                <span className="font-semibold text-blue-300">{currentUser.name}</span>
                <span className="rounded bg-slate-900 px-1.5 py-0.2 text-[10px] uppercase tracking-wide text-slate-400">
                  {currentUser.id}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-72 rounded-lg border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Test Profile (Demonstration)
                  </div>
                  <div className="space-y-0.5">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => onUserSwitch(u)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{u.name}</span>
                            <span
                              className={`text-[10px] font-mono px-1 rounded ${
                                u.role === 'trainer' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{u.track || u.bio}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-1.5 border-t border-slate-800 pt-1.5">
                    <button
                      onClick={onResetDemo}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Demo Database State
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main App Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                InternMate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
              </h1>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                Enterprise 100+
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Daily Task Delivery • Automated Rubric Evaluation • Verified Schedules
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>AI Chatbot</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all relative ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Tasks</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('submissions')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            <span>Submissions &amp; Reports</span>
          </button>

          <button
            onClick={() => onTabChange('meetings')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'meetings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Meetings</span>
          </button>

          <button
            onClick={() => onTabChange('trainer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'trainer'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-purple-500/20'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>Trainer Dashboard</span>
            {isTrainer && (
              <span className="rounded bg-purple-950 px-1 text-[9px] font-bold text-purple-300">ADMIN</span>
            )}
          </button>

          <button
            onClick={() => onTabChange('docs')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'docs'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
            title="System Architecture & Python Backend Specs"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span className="hidden md:inline">Docs</span>
          </button>

          {/* Vertical divider */}
          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Small, Professional Trainer/Admin Icon with Tooltip */}
          <div className="relative group">
            <button
              onClick={onOpenTrainerPanel}
              className="relative flex items-center justify-center h-8 w-8 rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              aria-label="Trainer / Admin Control Panel"
              title="Trainer / Admin Control Panel (Prototype Only — Quick Access)"
            >
              <UserCog className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
              </span>
            </button>

            {/* Hover Tooltip */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
              <div className="rounded-lg bg-slate-900 border border-purple-500/50 px-3 py-2 shadow-2xl text-center">
                <div className="text-[11px] font-semibold text-purple-200 flex items-center gap-1.5 justify-center">
                  <UserCog className="h-3.5 w-3.5 text-purple-400" />
                  <span>Trainer / Admin Panel</span>
                </div>
                <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                  Prototype Only • Quick Access
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Add/edit tasks, deadlines &amp; meeting links
                </p>
                <div className="text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-800">
                  Click to open control panel
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
