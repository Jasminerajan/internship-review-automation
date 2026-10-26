import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { evaluateSubmission } from './server/evaluator.js';
import { handleInternChatMessage } from './server/chatbot.js';
import { getEmailServiceStatus, sendMeetingEmailNotification } from './server/email.js';
import { Submission, Task, Meeting, User } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Extend express Request type
declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

// Authentication & Authorization Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-prototype-trainer-panel'] === 'true') {
    const trainerUser = db.getUserById('TRN-001') || {
      id: 'TRN-001',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@mentors.acmecorp.internal',
      role: 'trainer',
    } as any;
    req.authUser = trainerUser;
    return next();
  }

  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication failed: Missing x-user-id header',
      code: 'AUTH_REQUIRED',
    });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({
      error: `Authentication failed: User with ID "${userId}" does not exist`,
      code: 'USER_NOT_FOUND',
    });
  }

  req.authUser = user;
  next();
};

const requireTrainerRole = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-prototype-trainer-panel'] === 'true') {
    const trainerUser = db.getUserById('TRN-001') || {
      id: 'TRN-001',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@mentors.acmecorp.internal',
      role: 'trainer',
    } as any;
    req.authUser = trainerUser;
    return next();
  }

  if (!req.authUser || (req.authUser.role !== 'trainer' && req.authUser.role !== 'admin')) {
    return res.status(403).json({
      error: 'Forbidden: This operation requires Trainer or Admin role privileges',
      code: 'ROLE_FORBIDDEN',
    });
  }
  next();
};

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- API ROUTES ---

// 1. Auth & Users
app.get('/api/users', (_req: Request, res: Response) => {
  const users = db.getAllUsers();
  res.json(users);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ error: 'User ID or email is required', code: 'INVALID_CREDENTIALS' });
  }

  const user = db.getUserById(identifier.trim()) || db.getUserByEmail(identifier.trim());
  if (!user) {
    return res.status(404).json({
      error: `User with identifier "${identifier}" not found in database`,
      code: 'USER_NOT_FOUND',
    });
  }

  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user,
  });
});

// 2. Interns & Roster
app.get('/api/interns', requireAuth, (req: Request, res: Response) => {
  const authUser = req.authUser!;

  // Strict isolation: Interns can ONLY see their own profile
  if (authUser.role === 'intern') {
    return res.json([authUser]);
  }

  // Trainers can view full roster
  const interns = db.getAllInterns();
  return res.json(interns);
});

app.get('/api/interns/:id/stats', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const authUser = req.authUser!;

  // Enforce privacy: Interns cannot access other interns' statistics
  if (authUser.role === 'intern' && authUser.id !== id) {
    return res.status(403).json({
      error: "Access denied: Interns are restricted from accessing other cohort members' metrics",
      code: 'UNAUTHORIZED_CROSS_INTERN_ACCESS',
    });
  }

  const targetIntern = db.getUserById(id);
  if (!targetIntern) {
    return res.status(404).json({ error: `Intern ${id} not found`, code: 'NOT_FOUND' });
  }

  const stats = db.getInternStats(id);
  return res.json(stats);
});

app.get('/api/trainer/stats', requireAuth, requireTrainerRole, (_req: Request, res: Response) => {
  const stats = db.getTrainerStats();
  return res.json(stats);
});

// 3. Tasks (Create, Read, Update, Delete)
app.get('/api/tasks', requireAuth, (req: Request, res: Response) => {
  const authUser = req.authUser!;

  if (authUser.role === 'intern') {
    // Only return tasks assigned to this intern or to ALL
    const tasks = db.getTasksForIntern(authUser.id);
    return res.json(tasks);
  }

  // Trainers see all tasks
  const tasks = db.getAllTasks();
  return res.json(tasks);
});

app.post('/api/tasks', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const {
    title,
    track,
    cohort,
    problemStatement,
    instructions,
    deliverables,
    acceptanceCriteria,
    deadline,
    priority,
    referenceDocs,
    assignedTo,
  } = req.body;

  if (!title || !problemStatement || !deadline) {
    return res.status(400).json({
      error: 'Task title, problem statement, and deadline are required fields',
      code: 'MISSING_REQUIRED_FIELDS',
    });
  }

  const newTask: Task = {
    id: `TASK-2026-${Math.floor(100 + Math.random() * 900)}`,
    title,
    track: track || 'All Tracks',
    cohort: cohort || 'Cohort 2026-Q1',
    problemStatement,
    instructions: instructions || '',
    deliverables: deliverables || ['Source code implementation', 'Unit test assertions'],
    acceptanceCriteria: acceptanceCriteria || [
      {
        id: `AC-${Date.now()}-1`,
        category: 'Functionality',
        description: 'Implements core problem requirements completely.',
        weight: 50,
        required: true,
      },
      {
        id: `AC-${Date.now()}-2`,
        category: 'Code Quality',
        description: 'Clean syntax, modular design, and robust error handling.',
        weight: 50,
        required: true,
      },
    ],
    deadline,
    priority: priority || 'medium',
    referenceDocs: referenceDocs || [],
    assignedTo: assignedTo && assignedTo.length > 0 ? assignedTo : ['ALL'],
    createdAt: new Date().toISOString(),
    createdBy: authUser.id,
  };

  db.createTask(newTask);
  return res.status(201).json(newTask);
});

// Update Task (Trainer only)
app.put('/api/tasks/:id', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const { id } = req.params;
  const existingTask = db.getTaskById(id);

  if (!existingTask) {
    return res.status(404).json({ error: `Task with ID "${id}" does not exist`, code: 'TASK_NOT_FOUND' });
  }

  const {
    title,
    track,
    cohort,
    problemStatement,
    instructions,
    deliverables,
    acceptanceCriteria,
    deadline,
    priority,
    referenceDocs,
    assignedTo,
  } = req.body;

  const updated = db.updateTask(id, {
    ...(title && { title }),
    ...(track && { track }),
    ...(cohort && { cohort }),
    ...(problemStatement && { problemStatement }),
    ...(instructions !== undefined && { instructions }),
    ...(deliverables && { deliverables }),
    ...(acceptanceCriteria && { acceptanceCriteria }),
    ...(deadline && { deadline }),
    ...(priority && { priority }),
    ...(referenceDocs && { referenceDocs }),
    ...(assignedTo && { assignedTo }),
  });

  return res.json(updated);
});

// Delete Task (Trainer only)
app.delete('/api/tasks/:id', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const { id } = req.params;
  const existingTask = db.getTaskById(id);

  if (!existingTask) {
    return res.status(404).json({ error: `Task with ID "${id}" does not exist`, code: 'TASK_NOT_FOUND' });
  }

  const deleted = db.deleteTask(id);
  if (deleted) {
    return res.json({ success: true, message: `Task "${id}" deleted successfully` });
  }
  return res.status(500).json({ error: 'Failed to delete task', code: 'DELETE_FAILED' });
});

// 4. Submissions & Evaluations
app.get('/api/submissions', requireAuth, (req: Request, res: Response) => {
  const authUser = req.authUser!;

  // Strict isolation: Interns only receive their own submissions
  if (authUser.role === 'intern') {
    const subs = db.getSubmissionsForIntern(authUser.id);
    return res.json(subs);
  }

  // Trainers receive all submissions
  const subs = db.getAllSubmissions();
  return res.json(subs);
});

app.post('/api/submissions', requireAuth, async (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { taskId, type, textContent, codeContent, codeLanguage, fileName, githubRepoUrl, githubBranch } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required for submission', code: 'MISSING_TASK_ID' });
  }

  const task = db.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({ error: `Task "${taskId}" not found in database`, code: 'TASK_NOT_FOUND' });
  }

  // Verify that if intern, the task is actually assigned to them
  if (authUser.role === 'intern') {
    const isAssigned = task.assignedTo.includes('ALL') || task.assignedTo.includes(authUser.id);
    if (!isAssigned) {
      return res.status(403).json({
        error: 'Forbidden: You cannot submit work for a task not assigned to you',
        code: 'TASK_NOT_ASSIGNED',
      });
    }
  }

  // Enforce intern identity strictly from auth header (prevent spoofing)
  const internId = authUser.id;
  const internName = authUser.name;
  const internTrack = authUser.track;

  const newSubmission: Submission = {
    id: `SUB-2026-${Math.floor(100 + Math.random() * 900)}`,
    taskId,
    taskTitle: task.title,
    internId,
    internName,
    internTrack,
    submittedAt: new Date().toISOString(),
    type: type || 'code',
    textContent,
    codeContent,
    codeLanguage: codeLanguage || 'typescript',
    fileName: fileName || (type === 'code' ? 'solution.ts' : undefined),
    githubRepoUrl,
    githubBranch: githubBranch || 'main',
    status: 'submitted',
  };

  // Run automated evaluation & Gemini AI report immediately
  try {
    const evaluationReport = await evaluateSubmission(task, newSubmission);
    newSubmission.evaluationReport = evaluationReport;
    newSubmission.status =
      evaluationReport.overallStatus === 'PASS'
        ? 'passed'
        : evaluationReport.overallStatus === 'NEEDS IMPROVEMENT'
        ? 'needs_improvement'
        : 'trainer_review';
  } catch (err: any) {
    console.error('Automated evaluation execution error:', err);
    newSubmission.status = 'trainer_review';
  }

  db.createSubmission(newSubmission);
  return res.status(201).json(newSubmission);
});

app.post('/api/submissions/:id/evaluate', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sub = db.getSubmissionById(id);
  if (!sub) {
    return res.status(404).json({ error: 'Submission not found', code: 'SUBMISSION_NOT_FOUND' });
  }

  const authUser = req.authUser!;
  if (authUser.role === 'intern' && sub.internId !== authUser.id) {
    return res.status(403).json({ error: 'Access denied: Cannot trigger evaluation on another intern\'s work' });
  }

  const task = db.getTaskById(sub.taskId);
  if (!task) {
    return res.status(404).json({ error: 'Parent task not found', code: 'TASK_NOT_FOUND' });
  }

  try {
    const evaluationReport = await evaluateSubmission(task, sub);
    sub.evaluationReport = evaluationReport;
    sub.status =
      evaluationReport.overallStatus === 'PASS'
        ? 'passed'
        : evaluationReport.overallStatus === 'NEEDS IMPROVEMENT'
        ? 'needs_improvement'
        : 'trainer_review';

    db.updateSubmission(sub.id, {
      status: sub.status,
      evaluationReport,
    });

    return res.json(sub);
  } catch (err: any) {
    return res.status(500).json({ error: 'Evaluation failed', details: err.message });
  }
});

// Trainer manual review & override
app.post('/api/submissions/:id/override', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { id } = req.params;
  const { newStatus, scorePercent, trainerFeedback } = req.body;

  if (!newStatus || typeof scorePercent !== 'number' || !trainerFeedback) {
    return res.status(400).json({
      error: 'newStatus, scorePercent (number 0-100), and trainerFeedback are required',
      code: 'INVALID_OVERRIDE_PAYLOAD',
    });
  }

  const updated = db.overrideEvaluation(id, {
    trainerId: authUser.id,
    trainerName: authUser.name,
    newStatus,
    scorePercent,
    trainerFeedback,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Submission or evaluation report not found', code: 'NOT_FOUND' });
  }

  return res.json(updated);
});

// 5. Meetings
app.get('/api/meetings', requireAuth, (req: Request, res: Response) => {
  const authUser = req.authUser!;

  if (authUser.role === 'intern') {
    // Only return meetings assigned to this intern or to ALL
    const meetings = db.getMeetingsForIntern(authUser.id);
    return res.json(meetings);
  }

  const meetings = db.getAllMeetings();
  return res.json(meetings);
});

app.post('/api/meetings', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { title, agenda, startTime, endTime, timezone, meetLink, attendeeInternIds, reminderMinutesBefore } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, startTime, and endTime are required', code: 'MISSING_FIELDS' });
  }

  const newMeeting: Meeting = {
    id: `MTG-2026-${Math.floor(100 + Math.random() * 900)}`,
    title,
    agenda: agenda || 'Mentorship Sync',
    startTime,
    endTime,
    timezone: timezone || 'UTC',
    meetLink: meetLink || 'https://meet.google.com/abc-intern-sync',
    hostTrainerName: authUser.name,
    hostTrainerId: authUser.id,
    attendeeInternIds: attendeeInternIds && attendeeInternIds.length > 0 ? attendeeInternIds : ['ALL'],
    reminderMinutesBefore: reminderMinutesBefore || 15,
    isReminderLogged: true,
    status: 'upcoming',
  };

  db.createMeeting(newMeeting);
  return res.status(201).json(newMeeting);
});

// Update Meeting (Trainer only)
app.put('/api/meetings/:id', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const { id } = req.params;
  const existingMeeting = db.getAllMeetings().find((m) => m.id === id);

  if (!existingMeeting) {
    return res.status(404).json({ error: `Meeting with ID "${id}" does not exist`, code: 'MEETING_NOT_FOUND' });
  }

  const {
    title,
    agenda,
    startTime,
    endTime,
    timezone,
    meetLink,
    attendeeInternIds,
    reminderMinutesBefore,
    status,
  } = req.body;

  const updated = db.updateMeeting(id, {
    ...(title && { title }),
    ...(agenda && { agenda }),
    ...(startTime && { startTime }),
    ...(endTime && { endTime }),
    ...(timezone && { timezone }),
    ...(meetLink && { meetLink }),
    ...(attendeeInternIds && { attendeeInternIds }),
    ...(reminderMinutesBefore !== undefined && { reminderMinutesBefore }),
    ...(status && { status }),
  });

  return res.json(updated);
});

// Delete Meeting (Trainer only)
app.delete('/api/meetings/:id', requireAuth, requireTrainerRole, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteMeeting(id);
  if (deleted) {
    return res.json({ success: true, message: `Meeting "${id}" deleted successfully` });
  }
  return res.status(404).json({ error: `Meeting with ID "${id}" not found`, code: 'MEETING_NOT_FOUND' });
});

// --- MEETING EMAIL DISPATCH SERVICES ---

// 5a. Email Service Status Check
app.get('/api/email/status', (_req: Request, res: Response) => {
  const status = getEmailServiceStatus();
  return res.json(status);
});

// 5b. Trainer Send Meeting Email to Selected Interns
app.post('/api/meetings/:id/send-email', requireAuth, requireTrainerRole, async (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { id } = req.params;
  const { customNote } = req.body;

  const meeting = db.getMeetingById(id);
  if (!meeting) {
    return res.status(404).json({ error: `Meeting "${id}" not found in database`, code: 'MEETING_NOT_FOUND' });
  }

  // Determine authorized intern recipients
  const allInterns = db.getAllInterns();
  let targetInterns: User[] = [];

  if (meeting.attendeeInternIds.includes('ALL')) {
    targetInterns = allInterns;
  } else {
    targetInterns = allInterns.filter((i) => meeting.attendeeInternIds.includes(i.id));
  }

  if (targetInterns.length === 0) {
    return res.status(400).json({
      error: 'No registered interns are currently assigned to this meeting.',
      code: 'NO_RECIPIENTS',
    });
  }

  const recipientPayload = targetInterns.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
  }));

  try {
    const result = await sendMeetingEmailNotification({
      meeting,
      recipients: recipientPayload,
      senderTrainerName: authUser.name,
      customNote,
    });

    db.recordMeetingEmailDispatch(meeting.id, {
      sentAt: result.sentAt,
      recipientCount: result.recipientCount,
      status: 'sent',
    });

    return res.json({
      success: true,
      message: `Verified meeting notification sent to ${result.recipientCount} intern recipient(s).`,
      result,
      recipients: recipientPayload.map((r) => ({ name: r.name, email: r.email })),
      meetingTitle: meeting.title,
    });
  } catch (err: any) {
    db.recordMeetingEmailDispatch(meeting.id, {
      sentAt: new Date().toISOString(),
      recipientCount: 0,
      status: 'failed',
      error: err.message,
    });

    return res.status(503).json({
      error: err.message || 'Failed to dispatch meeting email via configured service.',
      code: 'EMAIL_DISPATCH_FAILED',
      meetingTitle: meeting.title,
      recipients: recipientPayload.map((r) => ({ name: r.name, email: r.email })),
    });
  }
});

// 5c. Intern Request Their Own Meeting Details by Email (Self-Service)
app.post('/api/interns/me/send-meeting-email', requireAuth, async (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { meetingId } = req.body;

  // Intern can ONLY request their own meetings
  const internMeetings = db.getMeetingsForIntern(authUser.id);
  if (internMeetings.length === 0) {
    return res.status(404).json({
      error: `No meetings are currently scheduled for ${authUser.name}.`,
      code: 'NO_UPCOMING_MEETINGS',
    });
  }

  // Find target meeting (either specified or the next upcoming meeting)
  let targetMeeting: Meeting | undefined;
  if (meetingId) {
    targetMeeting = internMeetings.find((m) => m.id === meetingId);
    if (!targetMeeting) {
      return res.status(403).json({
        error: 'Access denied: You can only request meeting details for meetings assigned to you.',
        code: 'UNAUTHORIZED_MEETING_ACCESS',
      });
    }
  } else {
    const now = new Date();
    const upcoming = internMeetings
      .filter((m) => new Date(m.endTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    targetMeeting = upcoming[0] || internMeetings[0];
  }

  // Recipient is strictly the authenticated intern
  const recipient = [
    {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
    },
  ];

  try {
    const result = await sendMeetingEmailNotification({
      meeting: targetMeeting,
      recipients: recipient,
    });

    return res.json({
      success: true,
      message: `Meeting details for "${targetMeeting.title}" successfully dispatched to ${authUser.email}.`,
      result,
      recipientEmail: authUser.email,
      meetingTitle: targetMeeting.title,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: err.message || 'Failed to dispatch email.',
      code: 'EMAIL_DISPATCH_FAILED',
      recipientEmail: authUser.email,
      meetingTitle: targetMeeting.title,
    });
  }
});


// 6. Conversational Chatbot
app.post('/api/chat', requireAuth, async (req: Request, res: Response) => {
  const authUser = req.authUser!;
  const { message, conversationHistory } = req.body;

  // Strict Security: Intern is strictly locked to their own ID. Cannot spoof another intern's id!
  const targetId = authUser.role === 'intern' ? authUser.id : (req.body.internId || authUser.id);

  try {
    const chatResponse = await handleInternChatMessage(targetId, message || 'Hello', conversationHistory || []);
    return res.json(chatResponse);
  } catch (err: any) {
    console.error('Chat processing error:', err);
    return res.status(500).json({
      id: `MSG-ERR-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: 'Error accessing records. Please try again or check your active tab.',
      quickReplies: ['What is my task today?', 'When is my next meeting?'],
    });
  }
});

// 7. Reset sample demo state
app.post('/api/reset-demo', requireAuth, (_req: Request, res: Response) => {
  db.resetToDefault();
  res.json({ success: true, message: 'Database reset to initial sample records' });
});

// 8. Documentation & Technical Architecture Export
app.get('/api/export-docs', (_req: Request, res: Response) => {
  res.json({
    appName: 'InternMate AI',
    version: '1.0.0',
    targetScale: '100+ Intern Cohorts',
    architecture: {
      frontend: 'React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons + Motion',
      runtime: 'Express Full-Stack Server with Vite Middleware Mode',
      aiModel: 'Google Gemini (gemini-3.8-flash) via @google/genai SDK',
      evaluationPipeline: 'Dual-phase: Automated Sandbox AST/Syntax Test Runner + Gemini Rubric Evaluator',
      database: 'ACID JSON Document Store (with PostgreSQL DDL schema specs provided for production migration)',
      privacyModel: 'Zero-Leakage RBAC (Interns restricted exclusively to authorized tasks, submissions, and meetings)',
    },
  });
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`InternMate AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
