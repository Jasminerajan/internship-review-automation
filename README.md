# InternMate AI - Enterprise Intern Management & Evaluation Platform

**InternMate AI** is an AI-powered intern management chatbot and mentorship portal designed for enterprise organizations managing cohorts of **100+ engineering interns**.

---

## 🎯 Purpose

Managing 100+ interns concurrently introduces significant communication overhead for trainers and mentors. InternMate AI automates:
1. **Routine Communication & Chat:** Natural language answers to queries (*"What is my task today?"*, *"Show pending tasks"*, *"How did I perform?"*, *"When is my next meeting?"*).
2. **Daily Task Delivery:** Role-based delivery of problem statements, instructions, required deliverables, and weighted acceptance criteria.
3. **Automated Work Submission & Evaluation:** Dual-phase evaluation with isolated sandbox test execution and Gemini AI rubric reports.
4. **Trainer Oversight:** Advisory evaluation reports with trainer override, scoring adjustments, and mentor feedback.
5. **Verified Meeting Notifications:** Direct Google Meet conference links with logged reminder alerts without fictitious URL generation.
6. **Strict RBAC & Privacy:** Complete isolation where interns can only access their authorized tasks, submissions, evaluations, and meetings.

---

## 🏗️ Architecture & Technology

### Active Deployment Environment (Google AI Studio)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend Server:** Node.js Express server running with Vite middleware on port 3000 (`server.ts`).
- **AI Engine:** Google Gemini API (`gemini-3.8-flash`) via the modern `@google/genai` SDK on the server.
- **Sandbox Testing:** Node.js isolated VM sandbox executing AST parsing, syntax validation, security assertions, and test suites.
- **Data Persistence:** ACID-compliant JSON document store (`data/internmate_db.json`) with sample pre-seeded records.

### Production Python Backend Target (Included in Architecture Specs)
- **Framework:** FastAPI (Python 3.11+) with asynchronous routes (`main.py`).
- **ORM & DB:** SQLAlchemy 2.0 with PostgreSQL 16 (full DDL provided in `schema.sql`).
- **AI SDK:** `google-genai` Python SDK.
- **Sandbox:** Dockerized container runner with nsjail.

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── data/
│   └── internmate_db.json   # Persistent database storage
├── index.html                # HTML entry point with synchronized metadata
├── metadata.json             # Applet metadata & major capabilities
├── package.json              # Node.js dependencies and full-stack scripts
├── requirements.txt          # Python FastAPI target dependencies
├── server/
│   ├── chatbot.ts            # Conversational assistant with strict privacy grounding
│   ├── db.ts                 # Database manager & sample data initializer
│   └── evaluator.ts          # Automated sandbox test runner & Gemini rubric evaluator
├── server.ts                 # Express full-stack server & Vite middleware
├── src/
│   ├── api.ts                # Type-safe frontend API client
│   ├── App.tsx               # Main application container & view router
│   ├── components/
│   │   ├── ArchitectureDocs.tsx  # Python FastAPI & PostgreSQL DDL specs
│   │   ├── ChatView.tsx          # Conversational chatbot with context cards
│   │   ├── CreateMeetingModal.tsx# Verified meeting scheduler
│   │   ├── CreateTaskModal.tsx   # Milestone & rubric builder
│   │   ├── Header.tsx            # Navigation & role/profile switcher
│   │   ├── MeetingsView.tsx      # Google Meet conference manager
│   │   ├── SubmissionModal.tsx   # Multi-format work submitter with demo presets
│   │   ├── SubmissionsView.tsx   # Rubric report inspector & trainer override
│   │   ├── TasksView.tsx         # Milestone tasks & criteria cards
│   │   └── TrainerDashboard.tsx  # Cohort metrics & roster management
│   ├── index.css             # Tailwind v4 theme styling
│   ├── main.tsx              # React entry point
│   └── types/
│       └── index.ts          # TypeScript domain interfaces
├── tsconfig.json             # TypeScript compiler settings
└── vite.config.ts            # Vite bundler configuration
```

---

## 🗄️ Database Schema & Sample Data

### Core Entities:
1. **Users (`users`):**
   - 5 Fictional Interns: Maya Chen (`INT-2026-001`, Frontend), Liam Patel (`INT-2026-002`, Backend), Sophia Rodriguez (`INT-2026-003`, Full-Stack), Marcus Vance (`INT-2026-004`, Cloud/DevOps), Aisha Al-Mansoor (`INT-2026-005`, AI/Data).
   - Lead Trainer: Dr. Sarah Jenkins (`TRN-001`).
2. **Tasks (`tasks`):**
   - Title, Track, Cohort, Problem Statement, Instructions, Deliverables, Acceptance Criteria Rubric (Category, Weight, Description), Deadline, Priority, Reference Docs.
3. **Submissions (`submissions`):**
   - Code content, file name, GitHub repo URL, branch pointer, text write-up, submission status.
4. **Evaluation Reports (`evaluation_reports`):**
   - Overall status (`PASS`, `NEEDS IMPROVEMENT`, `TRAINER REVIEW`), rubric score (0-100), requirements satisfied (with evidence), requirements partially satisfied, requirements not satisfied, sandbox test output, missing implementation checklist, suggested corrections with code snippets, trainer override record.
5. **Meetings (`meetings`):**
   - Verified Google Meet URLs, agenda, start/end timestamps, timezone, host trainer, attendee list, reminder logging.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```bash
# GEMINI_API_KEY: Required for Gemini AI task feedback and chat grounding
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: Current web server address
APP_URL="http://localhost:3000"

# PORT: Server port (defaults to 3000)
PORT=3000
```

---

## 🚀 Setup & Execution Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server (Express + Vite)
npm run dev

# 3. Access in browser
http://localhost:3000
```

---

## 🔍 Demonstration Workflow

1. **Intern Authentication & Privacy Check:**
   - Click the top right profile pill to choose **Liam Patel** (`INT-2026-002`).
   - Notice that his tasks and meetings strictly reflect Backend Engineering.
2. **Conversational Assistant:**
   - On the **AI Chatbot** tab, ask *"What is my task today?"* or *"When is my next meeting?"*.
   - The assistant answers accurately using only Liam's authorized records.
3. **Submit Code & Run Sandbox Evaluation:**
   - Navigate to **Tasks**, click **Submit Work** on task `TASK-2026-101`.
   - Click **Demo Presets: Load Passing Solution (PASS)**, then click **Submit & Run Automated Evaluation**.
   - Notice the sandbox test runner execute in isolated VM and Gemini generate the rubric report.
4. **Inspect Rubric Report:**
   - Under **Submissions & Reports**, inspect the 6 required rubric sections: Requirements Satisfied, Partially Satisfied, Not Satisfied, Test Evidence, Missing Items, and Suggested Corrections.
5. **Trainer Dashboard & Override:**
   - Switch profile to **Dr. Sarah Jenkins** (`TRN-001`, Trainer).
   - Open **Trainer Dashboard** to observe cohort KPIs, roster search across 100+ intern simulated capacity, and use **Review & Override** to adjust grades or append mentor feedback.
