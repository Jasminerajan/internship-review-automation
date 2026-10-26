import {
  User,
  Task,
  Submission,
  Meeting,
  ChatMessage,
  InternDashboardStats,
  TrainerDashboardStats,
  EmailServiceInfo,
} from './types/index.js';

class ApiClient {
  private currentUserId: string = 'INT-2026-001';
  private currentUserRole: string = 'intern';

  public setAuthContext(userId: string, role: string) {
    this.currentUserId = userId;
    this.currentUserRole = role;
  }

  public getAuthContext() {
    return { userId: this.currentUserId, role: this.currentUserRole };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
      'x-user-role': this.currentUserRole,
      ...(options.headers || {}),
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Users & Auth
  public async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  public async login(identifier: string): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  }

  // Interns
  public async getInterns(): Promise<User[]> {
    return this.request<User[]>('/api/interns');
  }

  public async getInternStats(internId: string): Promise<InternDashboardStats> {
    return this.request<InternDashboardStats>(`/api/interns/${internId}/stats`);
  }

  public async getTrainerStats(): Promise<TrainerDashboardStats> {
    return this.request<TrainerDashboardStats>('/api/trainer/stats', {
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  // Tasks
  public async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/tasks');
  }

  public async createTask(taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  public async updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  public async deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  // Submissions & Evaluations
  public async getSubmissions(): Promise<Submission[]> {
    return this.request<Submission[]>('/api/submissions');
  }

  public async createSubmission(submissionData: {
    taskId: string;
    type: 'code' | 'text' | 'github_repo' | 'mixed';
    textContent?: string;
    codeContent?: string;
    codeLanguage?: string;
    fileName?: string;
    githubRepoUrl?: string;
    githubBranch?: string;
  }): Promise<Submission> {
    return this.request<Submission>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  public async evaluateSubmission(submissionId: string): Promise<Submission> {
    return this.request<Submission>(`/api/submissions/${submissionId}/evaluate`, {
      method: 'POST',
    });
  }

  public async overrideEvaluation(
    submissionId: string,
    override: {
      newStatus: 'PASS' | 'NEEDS IMPROVEMENT' | 'TRAINER REVIEW';
      scorePercent: number;
      trainerFeedback: string;
    }
  ): Promise<Submission> {
    return this.request<Submission>(`/api/submissions/${submissionId}/override`, {
      method: 'POST',
      body: JSON.stringify(override),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  // Meetings
  public async getMeetings(): Promise<Meeting[]> {
    return this.request<Meeting[]>('/api/meetings');
  }

  public async createMeeting(meetingData: Partial<Meeting>): Promise<Meeting> {
    return this.request<Meeting>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  public async updateMeeting(meetingId: string, meetingData: Partial<Meeting>): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(meetingData),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  public async deleteMeeting(meetingId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  // Meeting Email Notification API
  public async getEmailStatus(): Promise<EmailServiceInfo> {
    return this.request<EmailServiceInfo>('/api/email/status');
  }

  public async sendMeetingEmail(
    meetingId: string,
    customNote?: string
  ): Promise<{
    success: boolean;
    message: string;
    recipients: Array<{ name: string; email: string }>;
    meetingTitle: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      recipients: Array<{ name: string; email: string }>;
      meetingTitle: string;
    }>(`/api/meetings/${meetingId}/send-email`, {
      method: 'POST',
      body: JSON.stringify({ customNote }),
      headers: {
        'x-prototype-trainer-panel': 'true',
      },
    });
  }

  public async requestSelfMeetingEmail(meetingId?: string): Promise<{
    success: boolean;
    message: string;
    recipientEmail: string;
    meetingTitle: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      recipientEmail: string;
      meetingTitle: string;
    }>('/api/interns/me/send-meeting-email', {
      method: 'POST',
      body: JSON.stringify({ meetingId }),
    });
  }

  // Chat
  public async sendChatMessage(
    internId: string,
    message: string,
    conversationHistory: Array<{ sender: 'user' | 'bot'; text: string }>
  ): Promise<ChatMessage> {
    return this.request<ChatMessage>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ internId, message, conversationHistory }),
    });
  }

  // Reset demo
  public async resetDemo(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/reset-demo', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
