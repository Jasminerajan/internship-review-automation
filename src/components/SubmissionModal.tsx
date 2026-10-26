import React, { useState, useRef } from 'react';
import {
  X,
  Code,
  Github,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import { Task, Submission } from '../types/index.js';
import { api } from '../api.js';

interface SubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSubmissionComplete: (submission: Submission) => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  task,
  onClose,
  onSubmissionComplete,
}) => {
  const [submissionType, setSubmissionType] = useState<'code' | 'github_repo' | 'text'>('code');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [fileName, setFileName] = useState('solution.ts');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalProgressStep, setEvalProgressStep] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real file reader handler for code and documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmissionError(null);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'ts' || ext === 'tsx') setCodeLanguage('typescript');
    else if (ext === 'js' || ext === 'jsx') setCodeLanguage('javascript');
    else if (ext === 'py') setCodeLanguage('python');
    else if (ext === 'sql') setCodeLanguage('sql');
    else if (ext === 'json') setCodeLanguage('json');
    else if (ext === 'dockerfile') setCodeLanguage('dockerfile');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      if (submissionType === 'text') {
        setTextContent(content);
        setUploadFeedback(`Uploaded document: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      } else {
        setCodeContent(content);
        setUploadFeedback(`Loaded source file: ${file.name} (${content.split('\n').length} lines)`);
      }
    };
    reader.onerror = () => {
      setSubmissionError('Error reading file from disk');
    };
    reader.readAsText(file);
  };

  // Sample templates to let the user easily demo different evaluation outcomes
  const handleLoadSample = (outcome: 'pass' | 'needs_improvement') => {
    if (task.id === 'TASK-2026-101') {
      if (outcome === 'pass') {
        setCodeLanguage('typescript');
        setFileName('authMiddleware.ts');
        setCodeContent(`import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateAndAuthorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'intern-test-secret';

    try {
      const decoded = jwt.verify(token, secret) as { role: string; exp: number };
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden: Role not authorized' });
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
}`);
        setTextContent('Implemented JWT authentication middleware with Bearer scheme parsing, signature verification, expiration checks, and RBAC guard.');
      } else {
        setCodeLanguage('javascript');
        setFileName('auth.js');
        setCodeContent(`function authenticateAndAuthorize(allowedRoles) {
  return function(req, res, next) {
    var token = req.headers['authorization'];
    if (!token) return res.send(401);
    // TODO: implement verify signature and role check
    req.user = { role: 'intern' };
    next();
  }
}
module.exports = authenticateAndAuthorize;`);
        setTextContent('Initial draft of auth middleware. Need to complete signature check and unit tests.');
      }
    } else {
      setCodeLanguage('typescript');
      setFileName('solution.ts');
      setCodeContent(`// Implementation for ${task.title}
export class SolutionHandler {
  constructor(private config: Record<string, any> = {}) {}

  public execute(input: any) {
    if (!input) throw new Error('Invalid input payload');
    return { status: 'success', data: input, processedAt: new Date().toISOString() };
  }
}`);
      setTextContent(`Completed implementation according to acceptance criteria for ${task.title}.`);
    }
    setUploadFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEvalProgressStep('Running automated sandbox tests & AST parsing...');

    try {
      setTimeout(() => {
        setEvalProgressStep('Executing test assertions in isolated Node VM...');
      }, 700);

      setTimeout(() => {
        setEvalProgressStep('Generating Gemini AI evaluation report & rubric comparison...');
      }, 1500);

      const submission = await api.createSubmission({
        taskId: task.id,
        type: submissionType,
        textContent,
        codeContent: submissionType === 'code' ? codeContent : undefined,
        codeLanguage: submissionType === 'code' ? codeLanguage : undefined,
        fileName: submissionType === 'code' ? fileName : undefined,
        githubRepoUrl: submissionType === 'github_repo' ? githubRepoUrl : undefined,
        githubBranch: submissionType === 'github_repo' ? githubBranch : undefined,
      });

      onSubmissionComplete(submission);
      onClose();
    } catch (err: any) {
      setSubmissionError(`Submission error: ${err.message || 'Verification harness encountered an issue'}`);
    } finally {
      setIsSubmitting(false);
      setEvalProgressStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
                {task.id}
              </span>
              <h3 className="text-base font-semibold text-white truncate max-w-md">{task.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated sandbox execution &amp; advisory Gemini evaluation will trigger upon submit.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {submissionError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Deliverables Reminder Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Required Deliverables:</span>
            <ul className="mt-1.5 list-disc list-inside space-y-1 text-slate-400">
              {(task.deliverables || []).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Submission Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSubmissionType('code')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  submissionType === 'code'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>Source Code File</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType('github_repo')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  submissionType === 'github_repo'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Github className="h-4 w-4" />
                <span>GitHub Repository</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType('text')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  submissionType === 'text'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Document &amp; Text</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Pre-loaders & File Upload Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 text-xs">
            {/* File Upload Trigger */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".ts,.tsx,.js,.jsx,.py,.sql,.json,.txt,.md,.pdf,.doc,.docx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-blue-500 hover:text-white transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400" />
                <span>Choose Local File ({submissionType === 'text' ? 'Doc/Text' : 'Code'})</span>
              </button>
              {uploadFeedback && (
                <span className="text-[11px] text-emerald-400 font-medium">{uploadFeedback}</span>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Presets:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('pass')}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                Load Passing (PASS)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('needs_improvement')}
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                Load Incomplete (NEEDS IMPR)
              </button>
            </div>
          </div>

          {/* Code Submission fields */}
          {submissionType === 'code' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">File Name</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="authMiddleware.ts"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="javascript">JavaScript (.js)</option>
                    <option value="python">Python (.py)</option>
                    <option value="dockerfile">Dockerfile</option>
                    <option value="sql">SQL (.sql)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Source Code</label>
                  <span className="text-[10px] text-slate-500">Node vm isolation environment</span>
                </div>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="// Paste, type, or upload your source code here..."
                  rows={9}
                  className="w-full font-mono text-xs rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* GitHub Repo Submission fields */}
          {submissionType === 'github_repo' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/acme-interns-2026/my-solution"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Branch</label>
                <input
                  type="text"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main or feature/auth-guard"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Text / Document writeup */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {submissionType === 'text' ? 'Document / Writeup Content' : 'Submission Notes & Architectural Summary'}
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Explain your architectural approach, test results, or design choices..."
              rows={submissionType === 'text' ? 8 : 3}
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
              required={submissionType === 'text'}
            />
          </div>

          {/* Test Runner Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-400">
            <Terminal className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p>
              Submissions undergo dual verification: first an automated test harness runs in an isolated sandbox,
              followed by an advisory Gemini evaluation against trainer-defined acceptance criteria.
            </p>
          </div>

          {/* Progress Indicator during submission */}
          {isSubmitting && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                <span>Automated Evaluation Engine Active</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{evalProgressStep}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Submit &amp; Run Automated Evaluation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
