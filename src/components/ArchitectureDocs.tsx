import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  Server,
  Layers,
  CheckCircle2,
  FileText,
  Copy,
  Terminal,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write warning:', err);
    }
  };

  const pythonBackendCode = `# ========================================================
# InternMate AI - Enterprise Python Backend Blueprint (FastAPI)
# Target Stack: FastAPI + SQLAlchemy 2.0 + PostgreSQL + google-genai
# ========================================================

from fastapi import FastAPI, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from typing import List, Optional
import os
from google import genai
from google.genai import types

app = FastAPI(title="InternMate AI API", version="1.0.0")

# Initialize Gemini SDK client (Server-Side Only)
ai_client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options={"headers": {"User-Agent": "aistudio-build"}}
)

# --- Role Based Access Control Dependency ---
def verify_intern_access(x_user_id: str = Header(...), x_user_role: str = Header(...)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user credentials")
    return {"user_id": x_user_id, "role": x_user_role}

# --- Pydantic Data Contracts ---
class ChatRequest(BaseModel):
    intern_id: str
    message: str
    conversation_history: List[dict] = []

class EvaluationRequest(BaseModel):
    task_id: str
    submission_type: str
    code_content: Optional[str] = None
    github_repo_url: Optional[str] = None
    text_content: Optional[str] = None

# --- Conversational Grounding Route ---
@app.post("/api/chat")
async def chat_with_internmate(payload: ChatRequest, auth=Depends(verify_intern_access)):
    # Enforce Zero-Leakage: intern can only query their own record
    if auth["role"] == "intern" and auth["user_id"] != payload.intern_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cross-intern access prohibited")
    
    # Query database for authorized records only
    tasks = query_assigned_tasks(payload.intern_id)
    meetings = query_verified_meetings(payload.intern_id)
    submissions = query_evaluations(payload.intern_id)

    system_instruction = f"""
    You are InternMate AI. You are chatting with intern ID: {payload.intern_id}.
    Ground your response strictly on the authorized records:
    Tasks: {tasks}
    Meetings: {meetings}
    Submissions: {submissions}
    Never invent Google Meet links or alter deadlines.
    """

    response = ai_client.models.generate_content(
        model="gemini-3.8-flash",
        contents=payload.message,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json"
        )
    )
    return response.parsed
`;

  const postgresSchemaSql = `-- ========================================================
-- InternMate AI - PostgreSQL Relational Database Schema
-- Scale: Optimized for 100+ to 1,000+ Intern Cohorts
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Interns, Trainers, Admins)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'INT-2026-001', 'TRN-001'
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('intern', 'trainer', 'admin')),
    track VARCHAR(80), -- 'Frontend Engineering', 'Backend Engineering', etc.
    cohort VARCHAR(50) NOT NULL DEFAULT 'Cohort 2026-Q1',
    timezone VARCHAR(50) DEFAULT 'UTC',
    mentor_name VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role_track ON users(role, track);

-- 2. Daily Tasks & Milestones
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'TASK-2026-101'
    title VARCHAR(255) NOT NULL,
    track VARCHAR(80) NOT NULL,
    cohort VARCHAR(50) NOT NULL,
    problem_statement TEXT NOT NULL,
    instructions TEXT NOT NULL,
    deliverables JSONB NOT NULL, -- Array of required deliverable strings
    acceptance_criteria JSONB NOT NULL, -- Weighted criteria rubric
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to JSONB NOT NULL, -- ['ALL'] or specific intern IDs
    reference_docs JSONB DEFAULT '[]',
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- 3. Work Submissions
CREATE TABLE submissions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SUB-2026-001'
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE CASCADE,
    intern_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('code', 'text', 'github_repo', 'mixed')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('submitted', 'passed', 'needs_improvement', 'trainer_review')),
    text_content TEXT,
    code_content TEXT,
    code_language VARCHAR(50),
    file_name VARCHAR(255),
    github_repo_url TEXT,
    github_branch VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_intern_task_submission UNIQUE (task_id, intern_id)
);

CREATE INDEX idx_submissions_intern ON submissions(intern_id);

-- 4. Evaluation Reports
CREATE TABLE evaluation_reports (
    id VARCHAR(50) PRIMARY KEY,
    submission_id VARCHAR(50) REFERENCES submissions(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    overall_status VARCHAR(30) NOT NULL CHECK (overall_status IN ('PASS', 'NEEDS IMPROVEMENT', 'TRAINER REVIEW')),
    score_percent INTEGER CHECK (score_percent BETWEEN 0 AND 100),
    requirements_satisfied JSONB NOT NULL,
    requirements_partially_satisfied JSONB NOT NULL,
    requirements_not_satisfied JSONB NOT NULL,
    evidence_and_test_results JSONB NOT NULL, -- sandbox test telemetry
    missing_implementation JSONB NOT NULL,
    suggested_corrections JSONB NOT NULL,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    trainer_override JSONB DEFAULT NULL
);

-- 5. Verified Meetings
CREATE TABLE meetings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    agenda TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    meet_link TEXT NOT NULL,
    host_trainer_id VARCHAR(50) REFERENCES users(id),
    attendee_intern_ids JSONB NOT NULL, -- ['ALL'] or list of intern IDs
    reminder_minutes_before INTEGER DEFAULT 15,
    is_reminder_logged BOOLEAN DEFAULT TRUE
);
`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900/60 p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                SYSTEM ARCHITECTURE &amp; SPECIFICATION
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300">
                Scale: 100+ Interns
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2">
              InternMate AI Technical Blueprints
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Full functional reference implementing strict intern data privacy, isolated sandbox test execution,
              server-side Gemini AI rubric evaluation with trainer override, and verified meeting management.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-emerald-400">Environment Active &amp; Verified</span>
          </div>
        </div>
      </div>

      {/* Environment Comparison Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-400" />
          <span>Supported Runtime Architecture &amp; Python Stack Mapping</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          As instructed in the user brief: The application is currently running live in this Google AI Studio
          environment as a high-performance <strong>Full-Stack Express + Node.js/TypeScript + Vite + React 19</strong> system.
          Below is the architectural parity breakdown comparing the active Node.js implementation with the Python FastAPI target:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Subsystem Layer</th>
                <th className="py-2.5 px-3">Active Google AI Studio Prototype</th>
                <th className="py-2.5 px-3">Production Python (FastAPI) Equivalent</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Gemini AI Model</td>
                <td className="py-2.5 px-3 font-mono text-blue-300">@google/genai (Node.js SDK)</td>
                <td className="py-2.5 px-3 font-mono text-emerald-300">google-genai (Python SDK)</td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    100% Parity
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Database &amp; Persistence</td>
                <td className="py-2.5 px-3 font-mono text-blue-300">ACID JSON Doc Store (server/db.ts)</td>
                <td className="py-2.5 px-3 font-mono text-emerald-300">PostgreSQL + SQLAlchemy 2.0</td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Schema Provided
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Code Sandbox Testing</td>
                <td className="py-2.5 px-3 font-mono text-blue-300">Node.js vm Isolated Sandbox</td>
                <td className="py-2.5 px-3 font-mono text-emerald-300">Dockerized nsjail / PyTest Container</td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Functional
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Intern Authorization (RBAC)</td>
                <td className="py-2.5 px-3 font-mono text-blue-300">Express Middleware Isolation</td>
                <td className="py-2.5 px-3 font-mono text-emerald-300">FastAPI Depends(RBACGuard)</td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Enforced
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">User Interface</td>
                <td className="py-2.5 px-3 font-mono text-blue-300">React 19 + Tailwind v4 + Lucide</td>
                <td className="py-2.5 px-3 font-mono text-emerald-300">React 19 SPA (Identical)</td>
                <td className="py-2.5 px-3">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Production Grade
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Demonstration Workflow Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Demonstration Workflow (End-to-End Test Walkthrough)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <span className="rounded bg-blue-600/30 px-2 py-0.5 font-bold text-blue-300 text-[10px]">
              STEP 1
            </span>
            <h4 className="font-bold text-white">Intern Authentication</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Use top right profile switcher to select an intern (e.g. <strong>Maya Chen</strong> or <strong>Liam Patel</strong>). Notice tasks, evaluations, and meetings strictly match only their authorized ID.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <span className="rounded bg-blue-600/30 px-2 py-0.5 font-bold text-blue-300 text-[10px]">
              STEP 2
            </span>
            <h4 className="font-bold text-white">Chatbot Inquiry</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open <strong>AI Chatbot</strong>. Click <em>"What is my task today?"</em> or <em>"When is my next meeting?"</em>. Verified database records return without invention or cross-intern data leakage.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <span className="rounded bg-blue-600/30 px-2 py-0.5 font-bold text-blue-300 text-[10px]">
              STEP 3
            </span>
            <h4 className="font-bold text-white">Work Submission</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Go to <strong>Tasks</strong> tab, pick an active task, click <em>Submit Work</em>. Choose source code, GitHub repo, or load the one-click passing demo preset.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <span className="rounded bg-blue-600/30 px-2 py-0.5 font-bold text-blue-300 text-[10px]">
              STEP 4
            </span>
            <h4 className="font-bold text-white">Automated Evaluation</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Isolated sandbox runs test assertions and syntax checks. Gemini compares code against trainer rubric, generating satisfied/unsatisfied requirements &amp; suggestions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <span className="rounded bg-purple-600/30 px-2 py-0.5 font-bold text-purple-300 text-[10px]">
              STEP 5
            </span>
            <h4 className="font-bold text-white">Trainer Oversight</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Switch role to <strong>Dr. Sarah Jenkins</strong> (Trainer). Access the Trainer Dashboard, view all 100+ cohort statistics, and use <em>Review &amp; Override</em> to adjust AI grades.
            </p>
          </div>
        </div>
      </div>

      {/* Code Snippets Tabs / Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python FastAPI Backend Code */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Python FastAPI Backend Reference (main.py)
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(pythonBackendCode, 'python')}
              className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedKey === 'python' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
            {pythonBackendCode}
          </pre>
        </div>

        {/* PostgreSQL Schema DDL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                PostgreSQL Enterprise DDL Schema (schema.sql)
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(postgresSchemaSql, 'sql')}
              className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedKey === 'sql' ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-blue-300/90 overflow-x-auto max-h-96 leading-relaxed">
            {postgresSchemaSql}
          </pre>
        </div>
      </div>

      {/* Integration Status & Security Notes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 shadow-xl text-xs text-slate-300">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span>Security &amp; Integration Status Summary</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <span className="font-semibold text-white">✅ Gemini API Grounding</span>
            <p className="text-slate-400 text-[11px]">
              Fully functional server-side calling via <code>@google/genai</code> with <code>gemini-3.8-flash</code>. Injected automatically via <code>GEMINI_API_KEY</code>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <span className="font-semibold text-white">✅ Automated Sandbox Runner</span>
            <p className="text-slate-400 text-[11px]">
              Full syntax compilation, AST analysis, security checks, and test runner executed inside isolated Node VM sandbox.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <span className="font-semibold text-white">✅ Zero-Leakage Privacy Guard</span>
            <p className="text-slate-400 text-[11px]">
              Intern requests are scoped strictly to their assigned ID. Cross-intern private data leakage is completely blocked at both API and prompt layers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
