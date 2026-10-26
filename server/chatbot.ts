import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db.js';
import { sendMeetingEmailNotification } from './email.js';
import { ChatMessage } from '../src/types/index.js';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper date formatter: "October 28 at 6:00 PM"
const formatFriendlyDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[d.getMonth()];
    const day = d.getDate();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${month} ${day} at ${time}`;
  } catch {
    return isoString;
  }
};

export async function handleInternChatMessage(
  internId: string,
  message: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }>
): Promise<ChatMessage> {
  // 1. Fetch authorized data exclusively for this intern
  const intern = db.getUserById(internId);
  if (!intern || intern.role !== 'intern') {
    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: 'Sorry about that, but I could not verify your intern session. Please log in with a valid intern identifier.',
      quickReplies: ['Return to Login'],
    };
  }

  const firstName = intern.name.split(' ')[0];
  const assignedTasks = db.getTasksForIntern(internId);
  const internSubmissions = db.getSubmissionsForIntern(internId);
  const internMeetings = db.getMeetingsForIntern(internId);

  // Match tasks with submission status
  const tasksWithStatus = assignedTasks.map((t) => {
    const sub = internSubmissions.find((s) => s.taskId === t.id);
    return {
      id: t.id,
      title: t.title,
      track: t.track,
      priority: t.priority,
      deadline: t.deadline,
      deliverables: t.deliverables,
      acceptanceCriteria: t.acceptanceCriteria,
      status: sub ? sub.status : 'not_started',
      score: sub?.evaluationReport?.scorePercent,
      evaluationStatus: sub?.evaluationReport?.overallStatus,
      acceptanceCriteriaCount: t.acceptanceCriteria.length,
    };
  });

  const now = new Date();
  const upcomingMeetings = internMeetings
    .filter((m) => new Date(m.endTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 2. Chatbot Email Action Workflow: Intern Request Meeting Details by Email
  const lower = message.toLowerCase().trim();
  const lastBotMsg = history.filter((h) => h.sender === 'bot').slice(-1)[0]?.text.toLowerCase() || '';

  const isAwaitingEmailConfirmation =
    lastBotMsg.includes('would you like me to send') ||
    lastBotMsg.includes('should i go ahead and dispatch') ||
    lastBotMsg.includes('confirm the details:') ||
    lastBotMsg.includes('confirm recipient');

  const isConfirmingEmail =
    lower === 'yes, email my meeting details' ||
    lower === 'confirm send' ||
    lower === 'yes, send it' ||
    lower === 'yes, please send' ||
    lower === 'send meeting email' ||
    (isAwaitingEmailConfirmation &&
      (lower === 'yes' ||
        lower === 'yep' ||
        lower === 'sure' ||
        lower === 'please' ||
        lower.startsWith('yes') ||
        lower.includes('confirm') ||
        lower.includes('send')));

  const isCancellingEmail =
    lower === 'no, cancel' ||
    lower === 'cancel' ||
    (isAwaitingEmailConfirmation && (lower === 'no' || lower.startsWith('no')));

  const isRequestingEmail =
    (lower.includes('email') || lower.includes('mail')) &&
    (lower.includes('meet') ||
      lower.includes('sync') ||
      lower.includes('schedule') ||
      lower.includes('details') ||
      lower.includes('link') ||
      lower.includes('send'));

  // Handle Cancellation
  if (isCancellingEmail) {
    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `No problem at all, ${firstName}! I cancelled the email request. Your verified Google Meet link and schedule are always available right here in your Meetings tab. What else can I help you with today?`,
      quickReplies: ['What should I work on today?', 'When is my next meeting?', 'How did my last submission go?'],
    };
  }

  // Handle Confirmed Email Send
  if (isConfirmingEmail) {
    const targetMeeting = upcomingMeetings[0] || internMeetings[0];
    if (!targetMeeting) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! There are currently no upcoming meetings scheduled on your calendar to email.`,
        quickReplies: ['What should I work on today?', 'Who is my mentor?'],
      };
    }

    try {
      const result = await sendMeetingEmailNotification({
        meeting: targetMeeting,
        recipients: [{ id: intern.id, name: intern.name, email: intern.email }],
      });

      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `All done, ${firstName}! ✉️ The details for **${targetMeeting.title}** on ${formatFriendlyDate(targetMeeting.startTime)} (${targetMeeting.timezone}) have been dispatched directly to your registered email (**${intern.email}**).\n\nYou'll find the full agenda and verified Google Meet link in your inbox. Let me know if you want to prep any questions for ${targetMeeting.hostTrainerName} beforehand!`,
        contextCards: [
          {
            type: 'meeting',
            title: targetMeeting.title,
            subtitle: `Dispatched to ${intern.email}`,
            badgeText: 'EMAIL SENT',
            badgeColor: 'green',
            linkId: targetMeeting.meetLink,
          },
        ],
        quickReplies: ['What is my task today?', 'How did my last submission go?', 'Explain the acceptance criteria'],
      };
    } catch (err: any) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}, I tried to send the email, but the backend email service reported an error:\n\n*${err.message}*\n\nBecause of our strict data accuracy policy, no false delivery confirmation will be given. You can still jump right into the meeting using your verified link: [Join Google Meet](${targetMeeting.meetLink}). Would you like me to share the meeting agenda here?`,
        contextCards: [
          {
            type: 'meeting',
            title: targetMeeting.title,
            subtitle: `Direct link available below`,
            badgeText: 'DELIVERY PENDING CONFIG',
            badgeColor: 'amber',
            linkId: targetMeeting.meetLink,
          },
        ],
        quickReplies: ['Show meeting agenda', 'What should I work on today?', 'When is my next meeting?'],
      };
    }
  }

  // Handle Initial Email Request (Confirm meeting and recipient address first)
  if (isRequestingEmail) {
    const targetMeeting = upcomingMeetings[0] || internMeetings[0];
    if (!targetMeeting) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! You don't have any upcoming meetings scheduled right now on your calendar, so there are no meeting details to email. If you need to schedule a sync with your lead mentor (${intern.mentorName || 'Dr. Sarah Jenkins'}), feel free to ping them directly!`,
        quickReplies: ['What should I work on today?', 'How did my last submission go?'],
      };
    }

    const meetingDate = formatFriendlyDate(targetMeeting.startTime);

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! I can definitely send those meeting details over. Before I send it, please confirm the details:\n\n• **Meeting:** ${targetMeeting.title}\n• **Date & Time:** ${meetingDate} (${targetMeeting.timezone})\n• **Recipient Email:** ${intern.email}\n\nWould you like me to send the verified Google Meet link and full agenda to **${intern.email}**?`,
      contextCards: [
        {
          type: 'meeting',
          title: targetMeeting.title,
          subtitle: `Recipient: ${intern.email}`,
          badgeText: 'CONFIRM RECIPIENT',
          badgeColor: 'blue',
          linkId: targetMeeting.meetLink,
        },
      ],
      quickReplies: ['Yes, email my meeting details', 'No, cancel'],
    };
  }

  // Call Gemini if key exists
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `You are InternMate AI, a friendly, supportive, intelligent, and approachable AI internship mentor at ACME Corp.
You are currently chatting with intern ${intern.name} (first name: ${firstName}, ID: ${intern.id}, Track: ${intern.track || 'Engineering'}, Mentor: ${intern.mentorName || 'Dr. Sarah Jenkins'}, Timezone: ${intern.timezone || 'UTC'}).

CONVERSATION & PERSONALITY RULES:
1. Use natural, conversational English, like a friendly, helpful teammate. Be warm, approachable, encouraging, and professional.
2. Start with a brief friendly acknowledgment when appropriate. Examples: "Hey ${firstName}!", "Sure, let's look at that!", "No worries, I'll explain it."
3. AVOID robotic openings such as "You have 1 pending task(s) in your queue." or "AUTHORIZED DATABASE RECORDS:". Speak naturally.
4. Explain information in natural, flowing sentences rather than rigid formal reports or long mechanical bullet dumps.
5. Use the intern's first name naturally when it is available, but do not repeat it in every message.
6. Use emojis sparingly and naturally (e.g. 👋, 📌, ✨).
7. Adapt the length of responses to the question. Give short, direct answers to simple questions and detailed explanations when the intern needs help.
8. Explain technical concepts in beginner-friendly language with practical examples.
9. When an intern says they are confused, stuck, or overwhelmed, break the task into smaller, manageable steps and offer guidance without making them feel bad.
10. After explaining a task, offer a relevant next step, such as reviewing acceptance criteria, creating a plan, or explaining a difficult concept.
11. When discussing submissions, explain what was done well, what needs improvement, and how to fix it constructively. Celebrate genuine progress without inventing achievements.
12. Ask a follow-up question only when it would genuinely help the conversation forward.
13. Do NOT pretend to be a human. You are an AI internship mentor.

DATA ACCURACY & PRIVACY (CRITICAL):
- Ground all facts (tasks, deadlines, deliverables, scores, meeting times, Google Meet URLs) strictly on the AUTHORIZED DATABASE RECORDS provided below.
- NEVER invent tasks, deadlines, meeting dates, Google Meet links, test results, or scores.
- If information is missing, explain honestly and suggest checking with their mentor (${intern.mentorName || 'Dr. Sarah Jenkins'}).
- You ONLY have access to ${firstName}'s private records. NEVER mention or disclose other interns' submissions, grades, or personal details.

AUTHORIZED DATABASE RECORDS FOR ${intern.name}:
- Active & Assigned Tasks (${tasksWithStatus.length}):
${JSON.stringify(tasksWithStatus, null, 2)}

- Recent Submissions & Evaluations (${internSubmissions.length}):
${JSON.stringify(
  internSubmissions.map((s) => ({
    id: s.id,
    taskId: s.taskId,
    taskTitle: s.taskTitle,
    type: s.type,
    submittedAt: s.submittedAt,
    status: s.status,
    scorePercent: s.evaluationReport?.scorePercent,
    overallStatus: s.evaluationReport?.overallStatus,
    requirementsSatisfied: s.evaluationReport?.requirementsSatisfied || [],
    requirementsNotSatisfied: s.evaluationReport?.requirementsNotSatisfied || [],
    missingImplementation: s.evaluationReport?.missingImplementation || [],
    suggestedCorrections: s.evaluationReport?.suggestedCorrections || [],
    trainerOverride: s.evaluationReport?.trainerOverride,
  })),
  null,
  2
)}

- Scheduled Verified Meetings (${upcomingMeetings.length} upcoming):
${JSON.stringify(
  upcomingMeetings.map((m) => ({
    id: m.id,
    title: m.title,
    agenda: m.agenda,
    startTime: m.startTime,
    endTime: m.endTime,
    meetLink: m.meetLink,
    hostTrainer: m.hostTrainerName,
    reminderMinutesBefore: m.reminderMinutesBefore,
    isReminderLogged: m.isReminderLogged,
  })),
  null,
  2
)}`;

      const formattedHistory = history.slice(-6).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      }));

      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: {
                type: Type.STRING,
                description: 'The main conversational response in natural, warm mentor tone using conversational sentences.',
              },
              contextCards: {
                type: Type.ARRAY,
                description: 'Optional relevant cards (task, meeting, evaluation) referenced in the answer.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: 'task | meeting | evaluation | tip' },
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    status: { type: Type.STRING },
                    linkId: { type: Type.STRING },
                    badgeText: { type: Type.STRING },
                    badgeColor: { type: Type.STRING },
                  },
                  required: ['type', 'title'],
                },
              },
              quickReplies: {
                type: Type.ARRAY,
                description: '2 to 4 suggested follow-up questions the intern might naturally ask next.',
                items: { type: Type.STRING },
              },
            },
            required: ['replyText', 'quickReplies'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 4000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: parsed.replyText || `Hey ${firstName}! How can I help you with your internship tasks or meetings today?`,
        contextCards: parsed.contextCards || [],
        quickReplies: parsed.quickReplies || [
          'What should I work on today?',
          'When is my next meeting?',
          'How did my last submission go?',
        ],
      };
    } catch (err) {
      console.warn('Gemini chat failed, falling back to conversational grounded query handler:', err);
    }
  }

  // Conversational Grounded Query Engine (Fallback when Gemini is offline / key absent)
  return handleDeterministicGroundedQuery(
    intern,
    message,
    tasksWithStatus,
    internSubmissions,
    upcomingMeetings
  );
}

function handleDeterministicGroundedQuery(
  intern: ReturnType<typeof db.getUserById> & {},
  message: string,
  tasks: Array<any>,
  submissions: Array<any>,
  meetings: Array<any>
): ChatMessage {
  const firstName = intern.name.split(' ')[0];
  const lower = message.toLowerCase();
  const contextCards: ChatMessage['contextCards'] = [];

  // Helper date formatter: "October 28 at 6:00 PM"
  const formatFriendlyDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[d.getMonth()];
      const day = d.getDate();
      const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${month} ${day} at ${time}`;
    } catch {
      return isoString;
    }
  };

  // 1. Next meeting query
  if (lower.includes('meeting') || lower.includes('meet') || lower.includes('sync') || lower.includes('standup') || lower.includes('call') || lower.includes('when')) {
    if (meetings.length === 0) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! You don't have any upcoming meetings scheduled right now on your calendar. Your lead mentor is **${intern.mentorName || 'Dr. Sarah Jenkins'}**, so feel free to ping them if you need a quick sync!`,
        quickReplies: ['What should I work on today?', 'How did my last submission go?'],
      };
    }

    const nextM = meetings[0];
    const meetingDate = formatFriendlyDate(nextM.startTime);

    contextCards.push({
      type: 'meeting',
      title: nextM.title,
      subtitle: `${meetingDate} (${nextM.timezone}) with ${nextM.hostTrainerName}`,
      linkId: nextM.meetLink,
      badgeText: 'Verified Google Meet',
      badgeColor: 'blue',
    });

    const trainerFirst = nextM.hostTrainerName ? nextM.hostTrainerName.split(' ')[0] : 'your mentor';

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! You've got **${nextM.title}** coming up on ${meetingDate} (${nextM.timezone}) hosted by ${nextM.hostTrainerName}.\n\nThe agenda is focused on ${nextM.agenda.toLowerCase()}.\n\nWhenever you're ready, here's your verified Google Meet link: [Join Meeting](${nextM.meetLink}). I've also verified your calendar reminder is set for ${nextM.reminderMinutesBefore} minutes before we start. Want me to help you prep any questions for ${trainerFirst}?`,
      contextCards,
      quickReplies: ['Email me my meeting details', 'What should I work on today?', 'How did my last submission go?'],
    };
  }

  // 2. Performance / evaluation query
  if (lower.includes('perform') || lower.includes('score') || lower.includes('feedback') || lower.includes('grade') || lower.includes('how did i do') || lower.includes('review')) {
    const evaluatedSubs = submissions.filter((s) => s.evaluationReport);
    if (evaluatedSubs.length === 0) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! You don't have any completed evaluations yet. Once you submit code or a write-up for your active task, our automated test runner and mentor rubric will review it and give you detailed feedback!`,
        quickReplies: ['What should I work on today?', 'When is my next meeting?'],
      };
    }

    const latest = evaluatedSubs[0];
    const report = latest.evaluationReport;

    contextCards.push({
      type: 'evaluation',
      title: latest.taskTitle || 'Task Evaluation',
      subtitle: `Score: ${report.scorePercent}% • Status: ${report.overallStatus}`,
      linkId: latest.id,
      badgeText: report.overallStatus,
      badgeColor: report.overallStatus === 'PASS' ? 'green' : 'amber',
    });

    const isPass = report.overallStatus === 'PASS';
    const praiseText = isPass
      ? `Great work! You scored **${report.scorePercent}%** and passed.`
      : `You scored **${report.scorePercent}%** (${report.overallStatus.toLowerCase()}).`;

    const satisfiedHighlights = report.requirementsSatisfied && report.requirementsSatisfied.length > 0
      ? `You did a solid job with ${report.requirementsSatisfied.map((r: any) => r.requirement).slice(0, 2).join(' and ')}.`
      : '';

    const improvementHighlights = report.requirementsNotSatisfied && report.requirementsNotSatisfied.length > 0
      ? `To get this all the way across the finish line, take another look at ${report.requirementsNotSatisfied.map((r: any) => r.requirement).slice(0, 2).join(' and ')}.`
      : report.requirementsPartiallySatisfied && report.requirementsPartiallySatisfied.length > 0
      ? `A few areas could use a bit more polish: ${report.requirementsPartiallySatisfied.map((r: any) => r.requirement).slice(0, 2).join(', ')}.`
      : `All core requirements look great!`;

    const suggestion = report.suggestedCorrections && report.suggestedCorrections[0]
      ? `\n\n💡 **Tip from the review:** ${report.suggestedCorrections[0].explanation}`
      : '';

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! On your latest submission for **${latest.taskTitle}**, ${praiseText} ${satisfiedHighlights} ${improvementHighlights}${suggestion}\n\nWant to walk through how to make those updates, or should we look at your next task?`,
      contextCards,
      quickReplies: ['View detailed rubric', 'What should I work on today?', 'When is my next meeting?'],
    };
  }

  // 3. Intern feeling confused / stuck / asking for help
  if (lower.includes('confused') || lower.includes('stuck') || lower.includes('help') || lower.includes('overwhelmed') || lower.includes('difficult') || lower.includes('dont understand') || lower.includes("don't understand")) {
    const pending = tasks.filter((t) => t.status !== 'passed');
    const activeTask = pending[0] || tasks[0];

    if (!activeTask) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `No worries, ${firstName}! You don't have any pending tasks right now. If something from a previous assignment or concept was unclear, just tell me what concept you'd like to explore and we can walk through it together!`,
        quickReplies: ['When is my next meeting?', 'Review my past evaluations'],
      };
    }

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `No worries at all, ${firstName}! Getting stuck on a new concept is a completely normal part of the internship learning curve. Let's take **${activeTask.title}** one step at a time:\n\n1. First, focus just on setting up the main file structure—don't worry about edge cases or complex validations yet.\n2. Once the main function or component is in place, we can test the simplest happy path.\n3. After that, we'll review the acceptance criteria together to make sure everything lines up.\n\nWhich part of the task feels like the biggest roadblock right now?`,
      contextCards: [
        {
          type: 'task',
          title: activeTask.title,
          subtitle: `Priority: ${activeTask.priority.toUpperCase()} • ${activeTask.deliverables.length} Deliverable(s)`,
          linkId: activeTask.id,
          badgeText: activeTask.status.replace('_', ' ').toUpperCase(),
        },
      ],
      quickReplies: ['Explain the acceptance criteria', 'What are the deliverables?', 'Break it down into a plan'],
    };
  }

  // 4. Deliverables or acceptance criteria inquiry
  if (lower.includes('criteria') || lower.includes('deliverable') || lower.includes('requirement') || lower.includes('rubric')) {
    const pending = tasks.filter((t) => t.status !== 'passed');
    const activeTask = pending[0] || tasks[0];

    if (!activeTask) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! You don't currently have any active tasks in your queue, so there are no deliverables due right now.`,
        quickReplies: ['When is my next meeting?', 'Who is my mentor?'],
      };
    }

    const delivSentence = activeTask.deliverables && activeTask.deliverables.length > 0
      ? `For **${activeTask.title}**, you'll be submitting: ${activeTask.deliverables.join(', ')}.`
      : `For **${activeTask.title}**, check the task instructions for details.`;

    const criteriaList = activeTask.acceptanceCriteria && activeTask.acceptanceCriteria.length > 0
      ? `The mentors will evaluate your work on:\n${activeTask.acceptanceCriteria.map((c: any) => `• **${c.category}** (${c.weight}%): ${c.description}`).join('\n')}`
      : 'The standard rubric criteria apply.';

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Sure, let's look at that! ${delivSentence}\n\n${criteriaList}\n\nI recommend tackling the functionality first, then adding your test cases and documentation. Want some tips on how to structure the tests?`,
      contextCards: [
        {
          type: 'task',
          title: activeTask.title,
          subtitle: `Priority: ${activeTask.priority.toUpperCase()}`,
          linkId: activeTask.id,
          badgeText: 'RUBRIC ACTIVE',
        },
      ],
      quickReplies: ['How should I structure my submission?', 'When is my next meeting?', 'What should I work on today?'],
    };
  }

  // 5. Mentor or track inquiry
  if (lower.includes('mentor') || lower.includes('advisor') || lower.includes('track') || lower.includes('cohort')) {
    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! You're on the **${intern.track || 'Engineering'}** track with **${intern.cohort || 'Cohort 2026-Q1'}**. Your lead mentor is **${intern.mentorName || 'Dr. Sarah Jenkins'}**.\n\nThey're here to support you throughout the cohort—so whenever you're tackling tricky architecture or want feedback on your growth, don't hesitate to reach out or bring it up in your weekly sync!`,
      quickReplies: ['When is my next meeting?', 'What should I work on today?'],
    };
  }

  // 6. Task inquiry: "What is my task today?", "Show pending tasks", "What should I work on?"
  const pending = tasks.filter((t) => t.status !== 'passed');
  if (lower.includes('today') || lower.includes('pending') || lower.includes('task') || lower.includes('work') || lower.includes('all tasks') || lower.includes('focus')) {
    if (pending.length === 0) {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! Amazing news—you've completed all your assigned tasks and you're completely caught up! 🎉 Take a breather or check in with **${intern.mentorName || 'Dr. Sarah Jenkins'}** if you want to explore an optional stretch challenge.`,
        quickReplies: ['When is my next meeting?', 'Review my past evaluations'],
      };
    }

    const currentTask = pending[0];
    const deadlineFormatted = formatFriendlyDate(currentTask.deadline);

    contextCards.push({
      type: 'task',
      title: currentTask.title,
      subtitle: `Due: ${deadlineFormatted} • Priority: ${currentTask.priority.toUpperCase()}`,
      linkId: currentTask.id,
      badgeText: currentTask.status.replace('_', ' ').toUpperCase(),
      badgeColor: currentTask.priority === 'urgent' || currentTask.priority === 'high' ? 'red' : 'blue',
    });

    const deliverablesSummary = currentTask.deliverables && currentTask.deliverables.length > 0
      ? `You'll need to ${currentTask.deliverables.map((d: string) => d.toLowerCase().replace(/^(the |a )/, '')).join(', ')}.`
      : 'Check the task details for the full instructions.';

    return {
      id: `MSG-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! 👋 Your main focus today is the **${currentTask.title}**. It's due on ${deadlineFormatted}. ${deliverablesSummary} I'd start with the core implementation first. Want me to walk you through the requirements?`,
      contextCards,
      quickReplies: ['Walk me through the requirements', 'When is my next meeting?', 'How did my last submission go?'],
    };
  }

  // 7. Friendly natural greeting fallback
  return {
    id: `MSG-${Date.now()}`,
    sender: 'bot',
    timestamp: new Date().toISOString(),
    text: `Hey ${firstName}! 👋 Hope your day is going well. I'm here to help you navigate your internship—whether you want to check what task to tackle next, get advice on acceptance criteria, or check your next meeting schedule. What can I help you with?`,
    quickReplies: [
      'What should I work on today?',
      'When is my next meeting?',
      'How did my last submission go?',
      'I am a bit stuck on my task',
    ],
  };
}
