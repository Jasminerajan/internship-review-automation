import nodemailer, { Transporter } from 'nodemailer';
import { Meeting, User } from '../src/types/index.js';

export interface EmailServiceStatus {
  configured: boolean;
  provider: string;
  host?: string;
  user?: string;
  from?: string;
  errorReason?: string;
  instructions: string;
}

export interface SendMeetingEmailResult {
  success: boolean;
  messageId?: string;
  recipientCount: number;
  recipients: string[];
  sentAt: string;
  provider: string;
}

/**
 * Checks whether real email dispatch credentials are configured in the environment.
 */
export function getEmailServiceStatus(): EmailServiceStatus {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT || '587';
  const from = process.env.EMAIL_FROM || (user ? `"InternMate Mentorship" <${user}>` : undefined);

  if (!host || !user || !pass) {
    return {
      configured: false,
      provider: 'unconfigured',
      instructions:
        'To enable real email delivery, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS (e.g., Gmail App Password or SendGrid/Mailgun SMTP) in your backend environment (.env). In accordance with data integrity rules, simulated email delivery is strictly disabled.',
    };
  }

  return {
    configured: true,
    provider: host.includes('gmail') ? 'Gmail SMTP' : `SMTP (${host})`,
    host,
    user,
    from,
    instructions: `Connected to ${host}:${port} as ${user}. Ready to dispatch verified meeting emails.`,
  };
}

/**
 * Creates a verified nodemailer transport based on server environment.
 */
function createTransporter(): Transporter | null {
  const status = getEmailServiceStatus();
  if (!status.configured) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Sends verified meeting details to authorized intern recipients.
 * Throws an explicit error if credentials are unconfigured or SMTP delivery fails.
 * NEVER fakes or simulates delivery.
 */
export async function sendMeetingEmailNotification(params: {
  meeting: Meeting;
  recipients: Array<{ id: string; name: string; email: string }>;
  senderTrainerName?: string;
  customNote?: string;
}): Promise<SendMeetingEmailResult> {
  const { meeting, recipients, senderTrainerName, customNote } = params;

  if (!recipients || recipients.length === 0) {
    throw new Error('No valid recipients provided for meeting email dispatch.');
  }

  // Validate recipient emails
  const validRecipients = recipients.filter(
    (r) => r.email && r.email.includes('@') && !r.email.endsWith('.example.invalid')
  );

  if (validRecipients.length === 0) {
    throw new Error('All recipient records are missing valid email addresses.');
  }

  const status = getEmailServiceStatus();
  if (!status.configured) {
    throw new Error(
      `Email service is not configured on the backend server. Missing environment variables: ${
        [!process.env.SMTP_HOST && 'SMTP_HOST', !process.env.SMTP_USER && 'SMTP_USER', !process.env.SMTP_PASS && 'SMTP_PASS']
          .filter(Boolean)
          .join(', ')
      }. Please configure your SMTP provider in .env to enable real email transmission. Test simulations are disabled by policy.`
    );
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Failed to initialize SMTP transporter with current credentials.');
  }

  // Format date and time
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedStartTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedEndTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fromAddress = process.env.EMAIL_FROM || `"InternMate AI" <${process.env.SMTP_USER}>`;
  const recipientEmails = validRecipients.map((r) => r.email);

  const subject = `[InternMate Sync] ${meeting.title} - ${formattedDate}`;

  const plainTextBody = `
InternMate Mentorship Conference Notice
=======================================

Hello,

You are scheduled for the following mentorship session:

Meeting: ${meeting.title}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime} (${meeting.timezone})
Host: ${meeting.hostTrainerName || senderTrainerName || 'Mentor Team'}

Verified Google Meet Room:
${meeting.meetLink}

Agenda:
${meeting.agenda}

${customNote ? `Mentor Note:\n${customNote}\n\n` : ''}
Reminder: A calendar reminder is set for ${meeting.reminderMinutesBefore} minutes prior to start.

---
Dispatched by InternMate AI Enterprise Platform
Grounded in authorized cohort database records.
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f1f5f9; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; background-color: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .title { color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 8px 0; }
    .agenda-card { background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .agenda-title { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .agenda-text { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .label { color: #94a3b8; width: 110px; font-weight: 500; }
    .value { color: #f1f5f9; font-weight: 600; }
    .btn-meet { display: block; text-align: center; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 24px 0 16px 0; }
    .url-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 8px; text-align: center; }
    .footer { border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Verified Mentorship Sync</span>
    <h1 class="title">${meeting.title}</h1>
    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Host: <strong>${meeting.hostTrainerName || senderTrainerName || 'Mentor'}</strong></p>

    <div class="agenda-card">
      <div class="agenda-title">Meeting Agenda</div>
      <p class="agenda-text">${meeting.agenda}</p>
    </div>

    <table class="details-table">
      <tr>
        <td class="label">Date:</td>
        <td class="value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="label">Time:</td>
        <td class="value">${formattedStartTime} – ${formattedEndTime} (${meeting.timezone})</td>
      </tr>
      <tr>
        <td class="label">Calendar:</td>
        <td class="value">Reminder logged (${meeting.reminderMinutesBefore}m prior)</td>
      </tr>
      ${customNote ? `<tr><td class="label">Mentor Note:</td><td class="value">${customNote}</td></tr>` : ''}
    </table>

    <a href="${meeting.meetLink}" class="btn-meet" target="_blank">
      🚀 Join Google Meet Conference
    </a>
    <div class="url-fallback">
      Direct Link: <a href="${meeting.meetLink}" style="color: #60a5fa;">${meeting.meetLink}</a>
    </div>

    <div class="footer">
      Dispatched automatically by InternMate AI • Enterprise Intern Growth Platform<br>
      Only verified meetings from company records are transmitted.
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmails.join(', '),
      subject,
      text: plainTextBody,
      html: htmlBody,
    });

    return {
      success: true,
      messageId: info.messageId,
      recipientCount: validRecipients.length,
      recipients: recipientEmails,
      sentAt: new Date().toISOString(),
      provider: status.provider,
    };
  } catch (err: any) {
    throw new Error(`SMTP dispatch error: ${err.message || 'Unknown network failure during email transmission'}`);
  }
}
