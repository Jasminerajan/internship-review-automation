import fs from 'fs';
import path from 'path';
import {
  User,
  Task,
  Submission,
  Meeting,
  EvaluationReport,
  InternDashboardStats,
  TrainerDashboardStats,
} from '../src/types/index.js';

interface DatabaseSchema {
  users: User[];
  tasks: Task[];
  submissions: Submission[];
  meetings: Meeting[];
  version: string;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'internmate_db.json');

// Initial seed data
const SEED_USERS: User[] = [
  {
    id: 'INT-2026-001',
    name: 'Maya Chen',
    email: 'maya.chen@interns.acmecorp.internal',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    track: 'Frontend Engineering',
    cohort: 'Cohort 2026-Q1',
    joinedDate: '2026-09-01',
    mentorName: 'Dr. Sarah Jenkins',
    timezone: 'America/Los_Angeles (PST, UTC-8)',
    bio: 'CS junior focused on design systems, React 19 micro-frontends, and accessible interactive interfaces.',
  },
  {
    id: 'INT-2026-002',
    name: 'Liam Patel',
    email: 'liam.patel@interns.acmecorp.internal',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    track: 'Backend Engineering',
    cohort: 'Cohort 2026-Q1',
    joinedDate: '2026-09-01',
    mentorName: 'Dr. Sarah Jenkins',
    timezone: 'America/New_York (EST, UTC-5)',
    bio: 'Distributed systems enthusiast building fault-tolerant microservices, gRPC protocols, and scalable databases.',
  },
  {
    id: 'INT-2026-003',
    name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@interns.acmecorp.internal',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    track: 'Full-Stack Engineering',
    cohort: 'Cohort 2026-Q1',
    joinedDate: '2026-09-01',
    mentorName: 'Alex Mercer',
    timezone: 'America/Chicago (CST, UTC-6)',
    bio: 'Full-stack builder passionate about end-to-end type safety, Node.js runtime engines, and clean UX workflows.',
  },
  {
    id: 'INT-2026-004',
    name: 'Marcus Vance',
    email: 'marcus.vance@interns.acmecorp.internal',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    track: 'Cloud & DevOps',
    cohort: 'Cohort 2026-Q1',
    joinedDate: '2026-09-01',
    mentorName: 'Alex Mercer',
    timezone: 'Europe/London (GMT, UTC+0)',
    bio: 'DevOps intern experimenting with Kubernetes operators, Terraform automation, and immutable infrastructure.',
  },
  {
    id: 'INT-2026-005',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.mansoor@interns.acmecorp.internal',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    track: 'AI & Data Engineering',
    cohort: 'Cohort 2026-Q1',
    joinedDate: '2026-09-01',
    mentorName: 'Dr. Sarah Jenkins',
    timezone: 'Asia/Dubai (GST, UTC+4)',
    bio: 'Machine learning practitioner working on LLM fine-tuning, vector retrieval pipelines, and model evaluation.',
  },
  {
    id: 'TRN-001',
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@acmecorp.internal',
    role: 'trainer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    mentorName: 'Self (Director)',
    timezone: 'America/Los_Angeles (PST, UTC-8)',
    bio: 'Director of Global University Talent & Principal Software Engineer. 12+ years mentoring 400+ engineering interns.',
  },
  {
    id: 'TRN-002',
    name: 'Alex Mercer',
    email: 'a.mercer@acmecorp.internal',
    role: 'trainer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    mentorName: 'Self (Staff Architect)',
    timezone: 'America/New_York (EST, UTC-5)',
    bio: 'Staff Cloud Infrastructure Architect & Technical Lead for Intern Systems.',
  },
];

const SEED_TASKS: Task[] = [
  {
    id: 'TASK-2026-101',
    title: 'Secure JWT Authentication Middleware & Role Guard',
    track: 'Backend Engineering',
    cohort: 'Cohort 2026-Q1',
    problemStatement:
      'Implement an Express middleware function `authenticateAndAuthorize(allowedRoles)` that decodes bearer JWT tokens, verifies digital signature and expiration, checks user revocation list, and enforces role-based access control (RBAC).',
    instructions:
      '1. Create a function `verifyToken(token, secret)` that returns a valid payload or throws descriptive 401/403 errors.\n2. Extract headers: Authorization Bearer scheme.\n3. Verify role matches allowedRoles parameter.\n4. Write unit tests covering valid tokens, expired tokens, tampered signatures, and unauthorized roles.\n5. Export the middleware cleanly.',
    deliverables: [
      'authMiddleware.ts or auth.js implementation',
      'Unit test suite verifying 4 key security scenarios',
      'Documentation describing error code contract (401 vs 403)',
    ],
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        category: 'Functionality',
        description: 'Successfully parses Bearer Authorization header and decodes valid JWT token claims.',
        weight: 25,
        required: true,
      },
      {
        id: 'AC-101-2',
        category: 'Security',
        description: 'Rejects expired tokens and tampered signature tokens with HTTP 401 Unauthorized.',
        weight: 25,
        required: true,
      },
      {
        id: 'AC-101-3',
        category: 'Security',
        description: 'Correctly blocks requests where user role is not included in allowedRoles with HTTP 403 Forbidden.',
        weight: 25,
        required: true,
      },
      {
        id: 'AC-101-4',
        category: 'Testing',
        description: 'Includes automated unit tests asserting pass and fail test cases.',
        weight: 25,
        required: true,
      },
    ],
    deadline: '2026-10-27T17:00:00Z',
    priority: 'high',
    referenceDocs: [
      {
        title: 'RFC 7519: JSON Web Token Standard Specification',
        url: 'https://datatracker.ietf.org/doc/html/rfc7519',
        type: 'doc',
      },
      {
        title: 'OWASP Authentication Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
        type: 'guide',
      },
      {
        title: 'Acme Internal Security Standards v3.2',
        url: 'https://internal.acmecorp.wiki/security/auth-guidelines',
        type: 'guide',
      },
    ],
    assignedTo: ['INT-2026-002', 'INT-2026-003'],
    createdAt: '2026-10-22T08:00:00Z',
    createdBy: 'TRN-001',
  },
  {
    id: 'TASK-2026-102',
    title: 'Responsive Metrics Widget with Accessible Theme Switching',
    track: 'Frontend Engineering',
    cohort: 'Cohort 2026-Q1',
    problemStatement:
      'Construct a high-performance React component `MetricsCard` that renders key intern statistics (trend delta, sparkline/mini-graph indicator, progress fill, status badge) supporting dark and light theme styles with WCAG 2.1 AA color contrast compliance.',
    instructions:
      '1. Implement responsive layout (mobile 1-col, desktop grid).\n2. Format currency/percentages according to Intl.NumberFormat.\n3. Ensure keyboard accessibility and aria labels on all interactive elements.\n4. Avoid layout shift during data load (provide skeleton pulse loader).',
    deliverables: [
      'MetricsCard.tsx component with props interface',
      'Skeleton loader state implementation',
      'Aria accessibility audit notes',
    ],
    acceptanceCriteria: [
      {
        id: 'AC-102-1',
        category: 'Functionality',
        description: 'Accurately displays title, numeric value, delta percentage (+/-), and progress percentage.',
        weight: 30,
        required: true,
      },
      {
        id: 'AC-102-2',
        category: 'Code Quality',
        description: 'Uses strict TypeScript interfaces and handles null/undefined data safely without throwing.',
        weight: 30,
        required: true,
      },
      {
        id: 'AC-102-3',
        category: 'Documentation',
        description: 'Full keyboard navigation with aria-label descriptions for screen reader accessibility.',
        weight: 20,
        required: true,
      },
      {
        id: 'AC-102-4',
        category: 'Testing',
        description: 'Renders skeleton state when loading=true and passes smoke test.',
        weight: 20,
        required: false,
      },
    ],
    deadline: '2026-10-28T18:00:00Z',
    priority: 'medium',
    referenceDocs: [
      {
        title: 'WCAG 2.1 Contrast Guidelines',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        type: 'guide',
      },
      {
        title: 'Acme Design System Component Tokens',
        url: 'https://design.acmecorp.internal/tokens',
        type: 'doc',
      },
    ],
    assignedTo: ['INT-2026-001', 'INT-2026-003'],
    createdAt: '2026-10-23T09:00:00Z',
    createdBy: 'TRN-001',
  },
  {
    id: 'TASK-2026-103',
    title: 'Multi-Stage Dockerfile & Healthcheck for Microservice',
    track: 'Cloud & DevOps',
    cohort: 'Cohort 2026-Q1',
    problemStatement:
      'Author an enterprise-grade multi-stage Dockerfile for a Node.js/TypeScript backend service. Must produce an unprivileged non-root image under 150MB with built-in HEALTHCHECK and layer caching optimization.',
    instructions:
      '1. Builder stage with node:22-alpine compiling TypeScript to dist/.\n2. Runner stage copying only production dependencies and dist/.\n3. Create non-root user `appuser:appgroup` and set USER.\n4. Define HEALTHCHECK instruction testing http://localhost:3000/health.\n5. Verify docker build completes and vulnerability surface is minimal.',
    deliverables: [
      'Dockerfile with multi-stage targets (builder, production)',
      '.dockerignore file preventing local secret leaks',
      'docker-compose.yml test harness',
    ],
    acceptanceCriteria: [
      {
        id: 'AC-103-1',
        category: 'Security',
        description: 'Container drops root privileges and executes under custom unprivileged user (UID >= 1000).',
        weight: 35,
        required: true,
      },
      {
        id: 'AC-103-2',
        category: 'Functionality',
        description: 'Dockerfile contains HEALTHCHECK instruction with interval, timeout, and retries.',
        weight: 35,
        required: true,
      },
      {
        id: 'AC-103-3',
        category: 'Code Quality',
        description: 'Utilizes multi-stage builds and layer caching so node_modules devDependencies are discarded in final artifact.',
        weight: 30,
        required: true,
      },
    ],
    deadline: '2026-10-25T12:00:00Z', // Overdue for demonstration
    priority: 'urgent',
    referenceDocs: [
      {
        title: 'Docker Best Practices for Node.js',
        url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/',
        type: 'guide',
      },
      {
        title: 'CIS Docker Benchmark Standards',
        url: 'https://www.cisecurity.org/benchmark/docker',
        type: 'doc',
      },
    ],
    assignedTo: ['INT-2026-004'],
    createdAt: '2026-10-18T10:00:00Z',
    createdBy: 'TRN-002',
  },
  {
    id: 'TASK-2026-104',
    title: 'Streaming Data Validator & Deduplication Engine',
    track: 'AI & Data Engineering',
    cohort: 'Cohort 2026-Q1',
    problemStatement:
      'Build a streaming data processor in Python or TypeScript that parses high-volume JSON telemetry batches, validates schema against expected keys, removes duplicate entries using a sliding hash window, and flags corrupted rows to a quarantine log.',
    instructions:
      '1. Implement batch validator function handling streams of records.\n2. Enforce schema constraints: timestamp (ISO), intern_id (INT-XXXX), score (0-100 float).\n3. Keep memory footprint constant using windowed hash sets.\n4. Write synthetic data benchmark demonstrating 10,000 records/sec throughput.',
    deliverables: [
      'data_validator.py or validator.ts script',
      'Sample quarantine log generator',
      'Performance benchmark output',
    ],
    acceptanceCriteria: [
      {
        id: 'AC-104-1',
        category: 'Functionality',
        description: 'Accurately detects missing required fields and type mismatches across records.',
        weight: 35,
        required: true,
      },
      {
        id: 'AC-104-2',
        category: 'Functionality',
        description: 'Correctly deduplicates identical record IDs while preserving ordering.',
        weight: 35,
        required: true,
      },
      {
        id: 'AC-104-3',
        category: 'Testing',
        description: 'Provides automated test harness with sample invalid records.',
        weight: 30,
        required: true,
      },
    ],
    deadline: '2026-10-29T23:59:00Z',
    priority: 'medium',
    referenceDocs: [
      {
        title: 'Data Validation Patterns in Production Pipelines',
        url: 'https://data-engineering-handbook.acmecorp.internal/validation',
        type: 'doc',
      },
    ],
    assignedTo: ['INT-2026-005'],
    createdAt: '2026-10-24T08:00:00Z',
    createdBy: 'TRN-001',
  },
  {
    id: 'TASK-2026-105',
    title: 'Internship Onboarding & Enterprise Git Flow Setup',
    track: 'All Tracks',
    cohort: 'Cohort 2026-Q1',
    problemStatement:
      'Configure local workstation development environment according to company standard: generate GPG commit-signing key, set up pre-commit lint hooks, clone cohort mono-repo, and open initial verification Pull Request.',
    instructions:
      '1. Set git user.name and user.email to company credentials.\n2. Enable commit signature verification.\n3. Configure npm pre-commit hook with Husky/lint-staged.\n4. Submit PR link with screenshot of verified green badge on GitHub.',
    deliverables: [
      'Link to GitHub Pull Request',
      'Markdown verification log with environment version numbers (Node, Git, OS)',
    ],
    acceptanceCriteria: [
      {
        id: 'AC-105-1',
        category: 'Security',
        description: 'Commits are cryptographically signed with GPG or SSH key.',
        weight: 50,
        required: true,
      },
      {
        id: 'AC-105-2',
        category: 'Documentation',
        description: 'Verification log includes toolchain versions and passing lint output.',
        weight: 50,
        required: true,
      },
    ],
    deadline: '2026-10-26T17:00:00Z',
    priority: 'low',
    referenceDocs: [
      {
        title: 'Acme Git & PR Protocol Guide',
        url: 'https://handbook.acmecorp.internal/git-flow',
        type: 'guide',
      },
    ],
    assignedTo: ['ALL'],
    createdAt: '2026-10-20T08:00:00Z',
    createdBy: 'TRN-001',
  },
];

const SEED_SUBMISSIONS: Submission[] = [
  {
    id: 'SUB-2026-001',
    taskId: 'TASK-2026-105',
    taskTitle: 'Internship Onboarding & Enterprise Git Flow Setup',
    internId: 'INT-2026-001',
    internName: 'Maya Chen',
    internTrack: 'Frontend Engineering',
    submittedAt: '2026-10-21T14:32:00Z',
    type: 'github_repo',
    githubRepoUrl: 'https://github.com/acme-interns-2026/maya-chen-onboarding',
    githubBranch: 'main',
    textContent:
      'Completed onboarding setup. GPG key id: 0x4A89C2F1. Node.js v22.14.0, Git 2.44.0. Pre-commit hooks active.',
    status: 'passed',
    evaluationReport: {
      id: 'EVAL-2026-001',
      submissionId: 'SUB-2026-001',
      evaluatedAt: '2026-10-21T14:35:10Z',
      overallStatus: 'PASS',
      scorePercent: 96,
      requirementsSatisfied: [
        {
          requirement: 'Commits are cryptographically signed with GPG or SSH key.',
          evidence: 'Verified commit signature 0x4A89C2F1 matching Maya Chen GitHub identity.',
        },
        {
          requirement: 'Verification log includes toolchain versions and passing lint output.',
          evidence: 'All required toolchain logs provided and matched enterprise prerequisites.',
        },
      ],
      requirementsPartiallySatisfied: [],
      requirementsNotSatisfied: [],
      evidenceAndTestResults: {
        executed: true,
        runtime: 'Static AST & Linter Verification',
        totalTests: 4,
        passedCount: 4,
        failedCount: 0,
        testSuiteOutput: '✔ GPG key valid\n✔ Commit signed\n✔ Husky config installed\n✔ Lint passed (0 errors)',
        tests: [
          { name: 'GPG Key Check', status: 'passed', executionTimeMs: 42, output: 'Verified' },
          { name: 'Git Commit Signature', status: 'passed', executionTimeMs: 38, output: 'Verified' },
          { name: 'Husky Hook Check', status: 'passed', executionTimeMs: 65, output: 'Found .husky/pre-commit' },
          { name: 'Toolchain Compatibility', status: 'passed', executionTimeMs: 25, output: 'Node 22 ok' },
        ],
      },
      missingImplementation: [],
      suggestedCorrections: [
        {
          fileOrTopic: 'git config',
          explanation: 'Consider setting git config --global pull.rebase true to avoid merge commits during sprint branches.',
        },
      ],
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
    },
  },
  {
    id: 'SUB-2026-002',
    taskId: 'TASK-2026-101',
    taskTitle: 'Secure JWT Authentication Middleware & Role Guard',
    internId: 'INT-2026-002',
    internName: 'Liam Patel',
    internTrack: 'Backend Engineering',
    submittedAt: '2026-10-24T16:15:00Z',
    type: 'code',
    codeLanguage: 'typescript',
    fileName: 'authMiddleware.ts',
    codeContent: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export function authenticateAndAuthorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-tests';

    try {
      const decoded = jwt.verify(token, secret) as DecodedToken;
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
      }
      (req as any).user = decoded;
      return next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      return res.status(401).json({ error: 'Invalid token signature' });
    }
  };
}`,
    status: 'passed',
    evaluationReport: {
      id: 'EVAL-2026-002',
      submissionId: 'SUB-2026-002',
      evaluatedAt: '2026-10-24T16:18:22Z',
      overallStatus: 'PASS',
      scorePercent: 92,
      requirementsSatisfied: [
        {
          requirement: 'Successfully parses Bearer Authorization header and decodes valid JWT claims.',
          evidence: 'Code properly checks for Bearer scheme and splits token cleanly.',
        },
        {
          requirement: 'Rejects expired tokens and tampered signature tokens with HTTP 401.',
          evidence: 'Catch block explicitly inspects TokenExpiredError and returns 401 with descriptive error message.',
        },
        {
          requirement: 'Correctly blocks requests where role is not included in allowedRoles with HTTP 403.',
          evidence: 'Checked allowedRoles.includes(decoded.role) and returned 403 Forbidden payload.',
        },
      ],
      requirementsPartiallySatisfied: [
        {
          requirement: 'Includes automated unit tests asserting pass and fail test cases.',
          missing: 'Inline tests were not submitted in the file, though the exported function signature matches the test harness.',
        },
      ],
      requirementsNotSatisfied: [],
      evidenceAndTestResults: {
        executed: true,
        runtime: 'Node.js Isolated VM Test Runner',
        totalTests: 4,
        passedCount: 4,
        failedCount: 0,
        testSuiteOutput:
          'PASS test/auth.test.ts\n  ✔ Missing bearer token returns 401 (18ms)\n  ✔ Valid token with matching role passes to next() (14ms)\n  ✔ Valid token with unauthorized role returns 403 (12ms)\n  ✔ Expired token returns 401 Token has expired (15ms)\nTotal: 4 passed, 0 failed',
        tests: [
          { name: 'Missing bearer header check', status: 'passed', executionTimeMs: 18, output: 'Returns 401' },
          { name: 'Valid token with role matching allowedRoles', status: 'passed', executionTimeMs: 14, output: 'Invokes next()' },
          { name: 'Unauthorized role check', status: 'passed', executionTimeMs: 12, output: 'Returns 403' },
          { name: 'TokenExpiredError handling', status: 'passed', executionTimeMs: 15, output: 'Returns 401' },
        ],
      },
      missingImplementation: [
        'Standalone Jest or Vitest test file was omitted in submission payload.',
      ],
      suggestedCorrections: [
        {
          fileOrTopic: 'authMiddleware.ts: Line 18',
          explanation: 'Avoid hardcoding fallback JWT secrets in production code; throw an Error if JWT_SECRET environment variable is missing.',
          suggestedCodeSnippet: 'if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not defined");',
        },
      ],
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
    },
  },
  {
    id: 'SUB-2026-003',
    taskId: 'TASK-2026-101',
    taskTitle: 'Secure JWT Authentication Middleware & Role Guard',
    internId: 'INT-2026-003',
    internName: 'Sophia Rodriguez',
    internTrack: 'Full-Stack Engineering',
    submittedAt: '2026-10-25T11:20:00Z',
    type: 'code',
    codeLanguage: 'javascript',
    fileName: 'auth.js',
    codeContent: `function authenticateAndAuthorize(allowedRoles) {
  return function(req, res, next) {
    var token = req.headers['authorization'];
    if (!token) {
      return res.send(401);
    }
    // TODO: add verify signature
    req.user = { role: 'intern' };
    next();
  }
}
module.exports = authenticateAndAuthorize;`,
    status: 'needs_improvement',
    evaluationReport: {
      id: 'EVAL-2026-003',
      submissionId: 'SUB-2026-003',
      evaluatedAt: '2026-10-25T11:23:45Z',
      overallStatus: 'NEEDS IMPROVEMENT',
      scorePercent: 45,
      requirementsSatisfied: [
        {
          requirement: 'Returns middleware function',
          evidence: 'Returns higher-order function matching Express middleware signature.',
        },
      ],
      requirementsPartiallySatisfied: [
        {
          requirement: 'Checks for authorization header',
          missing: 'Checks req.headers["authorization"] but does not check Bearer prefix or decode JWT token claims.',
        },
      ],
      requirementsNotSatisfied: [
        {
          requirement: 'Rejects expired tokens and tampered signature tokens with HTTP 401.',
          reason: 'JWT signature verification is not implemented (marked with TODO comment). Token is never checked.',
        },
        {
          requirement: 'Role authorization guard against allowedRoles parameter.',
          reason: 'Roles are hardcoded to "intern" instead of checking allowedRoles argument against decoded token.',
        },
        {
          requirement: 'Automated test suite.',
          reason: 'No tests provided; automated test runner failed 3 out of 4 test cases.',
        },
      ],
      evidenceAndTestResults: {
        executed: true,
        runtime: 'Node.js Isolated VM Test Runner',
        totalTests: 4,
        passedCount: 1,
        failedCount: 3,
        testSuiteOutput:
          'FAIL test/auth.test.js\n  ✔ Missing bearer token returns error (12ms)\n  ✖ Valid token verification failed: JWT verify was bypassed\n  ✖ Unauthorized role check failed: allowedRoles guard missing\n  ✖ Expired token was not rejected\nTotal: 1 passed, 3 failed',
        tests: [
          { name: 'Missing bearer check', status: 'passed', executionTimeMs: 12, output: 'Detected missing header' },
          { name: 'JWT signature validation', status: 'failed', executionTimeMs: 8, output: 'Expected token verification, received hardcoded dummy user' },
          { name: 'Role match enforcement', status: 'failed', executionTimeMs: 7, output: 'Allowed roles ignored' },
          { name: 'Expiration check', status: 'failed', executionTimeMs: 6, output: 'Expired token erroneously allowed' },
        ],
      },
      missingImplementation: [
        'Import jsonwebtoken library or crypto module.',
        'Decode and verify signature using JWT_SECRET.',
        'Inspect decoded.exp and decoded.role against allowedRoles array.',
        'Proper JSON error responses (e.g. res.status(401).json({ error: ... }) instead of res.send(401)).',
      ],
      suggestedCorrections: [
        {
          fileOrTopic: 'auth.js: Token parsing and verification',
          explanation: 'Use jsonwebtoken.verify inside a try-catch block to properly check signature and expiry.',
          suggestedCodeSnippet: `const jwt = require('jsonwebtoken');
try {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!allowedRoles.includes(decoded.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  req.user = decoded;
  next();
} catch (err) {
  return res.status(401).json({ error: 'Invalid or expired token' });
}`,
        },
      ],
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
    },
  },
];

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'MTG-2026-001',
    title: 'Cohort 2026-Q1 Weekly Mentorship & Progress Sync',
    agenda:
      'Weekly standup: Review sprint milestone progress, discuss blockers on auth & metrics tasks, showcase best pull requests, and Q&A with Lead Mentors.',
    startTime: '2026-10-26T17:00:00Z', // Today / Tomorrow depending on time
    endTime: '2026-10-26T18:00:00Z',
    timezone: 'UTC',
    meetLink: 'https://meet.google.com/abc-intern-sync',
    hostTrainerName: 'Dr. Sarah Jenkins',
    hostTrainerId: 'TRN-001',
    attendeeInternIds: ['ALL'],
    reminderMinutesBefore: 15,
    isReminderLogged: true,
    status: 'upcoming',
  },
  {
    id: 'MTG-2026-002',
    title: '1:1 Technical Mentoring: Liam Patel',
    agenda:
      'Deep dive into distributed transactions, database index optimization, and review of JWT middleware performance characteristics.',
    startTime: '2026-10-27T19:00:00Z',
    endTime: '2026-10-27T19:45:00Z',
    timezone: 'UTC',
    meetLink: 'https://meet.google.com/xyz-backend-sync',
    hostTrainerName: 'Dr. Sarah Jenkins',
    hostTrainerId: 'TRN-001',
    attendeeInternIds: ['INT-2026-002'],
    reminderMinutesBefore: 30,
    isReminderLogged: true,
    status: 'upcoming',
  },
  {
    id: 'MTG-2026-003',
    title: 'Frontend Architecture & A11y Clinic: Maya Chen & Sophia Rodriguez',
    agenda:
      'Interactive design review of MetricsCard component, color contrast inspection with axe-core, and React 19 server actions discussion.',
    startTime: '2026-10-28T18:30:00Z',
    endTime: '2026-10-28T19:30:00Z',
    timezone: 'UTC',
    meetLink: 'https://meet.google.com/fnt-arch-showcase',
    hostTrainerName: 'Alex Mercer',
    hostTrainerId: 'TRN-002',
    attendeeInternIds: ['INT-2026-001', 'INT-2026-003'],
    reminderMinutesBefore: 15,
    isReminderLogged: true,
    status: 'upcoming',
  },
  {
    id: 'MTG-2026-004',
    title: 'Data & Pipeline Architecture Review: Aisha Al-Mansoor',
    agenda:
      'Review streaming schema validator, discuss batch memory benchmarks and vector embeddings setup for task 4.',
    startTime: '2026-10-29T13:00:00Z',
    endTime: '2026-10-29T13:45:00Z',
    timezone: 'UTC',
    meetLink: 'https://meet.google.com/dat-sprint-ai26',
    hostTrainerName: 'Dr. Sarah Jenkins',
    hostTrainerId: 'TRN-001',
    attendeeInternIds: ['INT-2026-005'],
    reminderMinutesBefore: 15,
    isReminderLogged: true,
    status: 'upcoming',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.tasks && parsed.submissions && parsed.meetings) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing database, re-seeding default data:', err);
    }

    const initialData: DatabaseSchema = {
      users: SEED_USERS,
      tasks: SEED_TASKS,
      submissions: SEED_SUBMISSIONS,
      meetings: SEED_MEETINGS,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file to disk:', err);
    }
  }

  public resetToDefault(): void {
    this.data = {
      users: JSON.parse(JSON.stringify(SEED_USERS)),
      tasks: JSON.parse(JSON.stringify(SEED_TASKS)),
      submissions: JSON.parse(JSON.stringify(SEED_SUBMISSIONS)),
      meetings: JSON.parse(JSON.stringify(SEED_MEETINGS)),
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };
    this.saveData(this.data);
  }

  // --- Users & Interns ---
  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public getAllInterns(): User[] {
    return this.data.users.filter((u) => u.role === 'intern');
  }

  // --- Tasks ---
  public getAllTasks(): Task[] {
    return this.data.tasks;
  }

  public getTaskById(taskId: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === taskId);
  }

  public getTasksForIntern(internId: string): Task[] {
    return this.data.tasks.filter((t) => t.assignedTo.includes('ALL') || t.assignedTo.includes(internId));
  }

  public createTask(task: Task): Task {
    this.data.tasks.unshift(task);
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return task;
  }

  public updateTask(taskId: string, updates: Partial<Task>): Task | undefined {
    const task = this.data.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;
    Object.assign(task, updates);
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return task;
  }

  public deleteTask(taskId: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t.id !== taskId);
    if (this.data.tasks.length !== initialLen) {
      this.data.lastUpdated = new Date().toISOString();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- Submissions ---
  public getAllSubmissions(): Submission[] {
    return this.data.submissions;
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.data.submissions.find((s) => s.id === id);
  }

  public getSubmissionsForIntern(internId: string): Submission[] {
    return this.data.submissions.filter((s) => s.internId === internId);
  }

  public getSubmissionsForTask(taskId: string): Submission[] {
    return this.data.submissions.filter((s) => s.taskId === taskId);
  }

  public createSubmission(submission: Submission): Submission {
    const existingIndex = this.data.submissions.findIndex(
      (s) => s.taskId === submission.taskId && s.internId === submission.internId
    );

    if (existingIndex >= 0) {
      this.data.submissions[existingIndex] = submission;
    } else {
      this.data.submissions.unshift(submission);
    }

    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return submission;
  }

  public updateSubmission(id: string, updates: Partial<Submission>): Submission | undefined {
    const sub = this.data.submissions.find((s) => s.id === id);
    if (!sub) return undefined;
    Object.assign(sub, updates);
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return sub;
  }

  public overrideEvaluation(
    submissionId: string,
    override: {
      trainerId: string;
      trainerName: string;
      newStatus: 'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW';
      scorePercent: number;
      trainerFeedback: string;
    }
  ): Submission | undefined {
    const sub = this.data.submissions.find((s) => s.id === submissionId);
    if (!sub || !sub.evaluationReport) return undefined;

    sub.status =
      override.newStatus === 'PASS'
        ? 'passed'
        : override.newStatus === 'NEEDS IMPROVEMENT'
        ? 'needs_improvement'
        : 'trainer_review';

    sub.evaluationReport.overallStatus = override.newStatus;
    sub.evaluationReport.scorePercent = override.scorePercent;
    sub.evaluationReport.trainerOverride = {
      trainerId: override.trainerId,
      trainerName: override.trainerName,
      overrideAt: new Date().toISOString(),
      originalStatus: sub.evaluationReport.overallStatus,
      newStatus: override.newStatus,
      scorePercent: override.scorePercent,
      trainerFeedback: override.trainerFeedback,
    };

    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return sub;
  }

  // --- Meetings ---
  public getAllMeetings(): Meeting[] {
    return this.data.meetings;
  }

  public getMeetingById(meetingId: string): Meeting | undefined {
    return this.data.meetings.find((m) => m.id === meetingId);
  }

  public getMeetingsForIntern(internId: string): Meeting[] {
    return this.data.meetings.filter(
      (m) => m.attendeeInternIds.includes('ALL') || m.attendeeInternIds.includes(internId)
    );
  }

  public createMeeting(meeting: Meeting): Meeting {
    this.data.meetings.unshift(meeting);
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return meeting;
  }

  public updateMeeting(meetingId: string, updates: Partial<Meeting>): Meeting | undefined {
    const meeting = this.data.meetings.find((m) => m.id === meetingId);
    if (!meeting) return undefined;
    Object.assign(meeting, updates);
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return meeting;
  }

  public recordMeetingEmailDispatch(
    meetingId: string,
    result: { sentAt: string; recipientCount: number; status: 'sent' | 'failed'; error?: string }
  ): Meeting | undefined {
    const meeting = this.data.meetings.find((m) => m.id === meetingId);
    if (!meeting) return undefined;
    meeting.lastEmailSentAt = result.sentAt;
    meeting.lastEmailRecipientCount = result.recipientCount;
    meeting.lastEmailStatus = result.status;
    meeting.lastEmailError = result.error;
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return meeting;
  }

  public updateUserEmail(userId: string, email: string): User | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.email = email;
    this.data.lastUpdated = new Date().toISOString();
    this.saveData(this.data);
    return user;
  }

  public deleteMeeting(meetingId: string): boolean {
    const initialLen = this.data.meetings.length;
    this.data.meetings = this.data.meetings.filter((m) => m.id !== meetingId);
    if (this.data.meetings.length !== initialLen) {
      this.data.lastUpdated = new Date().toISOString();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- Aggregated Statistics ---
  public getInternStats(internId: string): InternDashboardStats {
    const internTasks = this.getTasksForIntern(internId);
    const internSubs = this.getSubmissionsForIntern(internId);
    const meetings = this.getMeetingsForIntern(internId);

    const now = new Date();
    const passedCount = internSubs.filter((s) => s.status === 'passed').length;
    const inProgressCount = internTasks.length - internSubs.length;

    let overdueCount = 0;
    for (const t of internTasks) {
      const sub = internSubs.find((s) => s.taskId === t.id);
      if ((!sub || sub.status !== 'passed') && new Date(t.deadline) < now) {
        overdueCount++;
      }
    }

    const scores = internSubs
      .map((s) => s.evaluationReport?.scorePercent)
      .filter((sc): sc is number => typeof sc === 'number');

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Next upcoming meeting
    const upcomingMeetings = meetings
      .filter((m) => new Date(m.endTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
      totalAssigned: internTasks.length,
      completedTasks: passedCount,
      inProgressTasks: Math.max(0, inProgressCount),
      pendingSubmissions: internSubs.filter((s) => s.status === 'submitted' || s.status === 'trainer_review').length,
      overdueTasks: overdueCount,
      averageScorePercent: avgScore,
      nextMeeting: upcomingMeetings[0] || null,
    };
  }

  public getTrainerStats(): TrainerDashboardStats {
    const interns = this.getAllInterns();
    const tasks = this.getAllTasks();
    const subs = this.getAllSubmissions();
    const meetings = this.getAllMeetings();
    const now = new Date();

    const passed = subs.filter((s) => s.evaluationReport?.overallStatus === 'PASS').length;
    const needsImprovement = subs.filter((s) => s.evaluationReport?.overallStatus === 'NEEDS IMPROVEMENT').length;
    const trainerReview = subs.filter(
      (s) => s.evaluationReport?.overallStatus === 'TRAINER REVIEW' || s.status === 'submitted'
    ).length;

    // Overdue count across all assignments
    let overdueCount = 0;
    for (const intern of interns) {
      const assigned = this.getTasksForIntern(intern.id);
      const internSubs = this.getSubmissionsForIntern(intern.id);
      for (const t of assigned) {
        const sub = internSubs.find((s) => s.taskId === t.id);
        if ((!sub || sub.status !== 'passed') && new Date(t.deadline) < now) {
          overdueCount++;
        }
      }
    }

    const upcomingMeetings = meetings.filter((m) => new Date(m.endTime) > now).length;

    return {
      totalInterns: interns.length,
      tasksAssigned: tasks.length,
      pendingSubmissions: subs.filter((s) => s.status === 'submitted' || s.status === 'trainer_review').length,
      overdueTasks: overdueCount,
      evaluationsSummary: {
        passed,
        needsImprovement,
        trainerReview,
      },
      upcomingMeetingsCount: upcomingMeetings,
    };
  }
}

export const db = new Database();
