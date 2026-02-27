const { google } = require('googleapis');
const logger = require('../utils/logger');
const { generatePlanPDF, generateReceiptPDF } = require('../utils/pdf.generator');

if (process.env.EMAIL_USER && process.env.GMAIL_REFRESH_TOKEN) {
  logger.info(`[Email] Gmail API (HTTP) configured for: ${process.env.EMAIL_USER}`);
} else {
  logger.warn('[Email] Gmail API not configured — emails will be skipped.');
}

const getGmailClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
};

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!process.env.EMAIL_USER || !process.env.GMAIL_REFRESH_TOKEN) {
    logger.warn(`[Email] Not configured — skipping send to ${to}`);
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || `Focus Fitness <${process.env.EMAIL_USER}>`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const boundary = `ff_boundary_${Date.now()}`;

  let mimeMessage;
  if (attachments.length === 0) {
    // Simple email
    mimeMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text,
    ].join('\r\n');
  } else {
    // Multipart email with attachments
    const htmlBase64 = Buffer.from(html || text, 'utf-8').toString('base64');
    const parts = [
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      htmlBase64,
    ];
    for (const att of attachments) {
      parts.push(
        `--${boundary}`,
        `Content-Type: ${att.mimeType}; name="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${att.filename}"`,
        '',
        att.data.toString('base64'),
      );
    }
    parts.push(`--${boundary}--`);
    mimeMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      ...parts,
    ].join('\r\n');
  }

  const raw = Buffer.from(mimeMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await getGmailClient().users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    logger.info(`[Email] Sent to ${to} | Subject: ${subject} | MessageId: ${res.data.id}`);
    return { messageId: res.data.id };
  } catch (gmailErr) {
    const msg = gmailErr.message || 'Gmail API error';
    logger.error(`[Email] Gmail API error sending to ${to}: ${msg}`);
    throw new Error(`Email delivery failed: ${msg}`);
  }
};

// ── Email Templates ────────────────────────────────────────────────────────

const emailHeader = (subtitle) => `
  <tr>
    <td style="background:#111;padding:28px 36px;border-bottom:3px solid #e11d48;">
      <h1 style="margin:0;color:#e11d48;font-size:24px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Focus Fitness</h1>
      <p style="margin:4px 0 0;color:#555;font-size:10px;letter-spacing:2px;text-transform:uppercase;">${subtitle}</p>
    </td>
  </tr>`;

const emailFooter = () => `
  <tr>
    <td style="background:#111;padding:20px 36px;border-top:1px solid #1e1e1e;">
      <p style="color:#444;font-size:11px;margin:0;line-height:1.6;">This is an automated message from Focus Fitness. If you believe this was sent in error, please contact us at the gym.</p>
      <p style="color:#333;font-size:10px;margin:10px 0 0;">Focus Fitness &mdash; All rights reserved.</p>
    </td>
  </tr>`;

const emailWrapper = (rows) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">${rows}</table>
    </td></tr>
  </table>
</body></html>`;

// ── Email Templates ────────────────────────────────────────────────────────

const sendWelcomeEmail = async ({ fullName, email, phone, dueDate }) => {
  if (!email) {
    logger.warn(`[Email] No email for member ${fullName}, skipping welcome email.`);
    return { skipped: true };
  }

  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  const subject = `Welcome to Focus Fitness — Membership Confirmed`;
  const text = `Dear ${fullName},\n\nYour membership at Focus Fitness has been successfully registered.\n\nMembership Details:\n  Name: ${fullName}\n  Phone: ${phone}\n  Status: Active\n  Next Due Date: ${dueDateStr}\n\nMonthly payments are due on the 10th of each month. Please make your payment at the gym counter to maintain your active membership.\n\nFocus Fitness`;

  const html = emailWrapper(`
    ${emailHeader('Membership Confirmation')}
    <tr>
      <td style="background:#161616;padding:36px;">
        <p style="color:#e11d48;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Welcome Aboard</p>
        <h2 style="color:#f0f0f0;font-size:20px;margin:0 0 10px;font-weight:700;">Dear ${fullName},</h2>
        <p style="color:#999;font-size:14px;line-height:1.7;margin:0 0 28px;">Your membership at Focus Fitness has been successfully registered. We are pleased to have you as a member.</p>
        <div style="border-top:1px solid #2a2a2a;margin:0 0 24px;"></div>
        <p style="color:#555;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Membership Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:11px 14px;background:#1f1f1f;color:#666;font-size:12px;width:45%;">Full Name</td>
            <td style="padding:11px 14px;background:#1f1f1f;color:#f0f0f0;font-size:12px;font-weight:600;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#191919;color:#666;font-size:12px;">Phone</td>
            <td style="padding:11px 14px;background:#191919;color:#f0f0f0;font-size:12px;font-weight:600;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#1f1f1f;color:#666;font-size:12px;">Status</td>
            <td style="padding:11px 14px;background:#1f1f1f;color:#22c55e;font-size:12px;font-weight:600;">Active</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#191919;color:#666;font-size:12px;">Next Due Date</td>
            <td style="padding:11px 14px;background:#191919;color:#f0f0f0;font-size:12px;font-weight:600;">${dueDateStr}</td>
          </tr>
        </table>
        <div style="border-top:1px solid #2a2a2a;margin:24px 0;"></div>
        <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">Monthly payments are due on the <strong style="color:#f0f0f0;">10th of each month</strong>. Please make your payment at the gym counter to maintain your active membership status.</p>
      </td>
    </tr>
    ${emailFooter()}`);

  return sendEmail({ to: email, subject, text, html });
};

const sendPaymentReminder = async ({ name, email, phone, dueDate, amount }) => {
  if (!email) {
    logger.warn(`[Email] No email for member ${name}, skipping reminder.`);
    return { skipped: true };
  }

  const subject = `Payment Reminder — Focus Fitness`;
  const text = `Dear ${name},\n\nYour monthly membership fee of LKR ${amount} is due on ${dueDate}.\n\nPlease make your cash payment at the gym before the due date to keep your membership active.\n\nFocus Fitness`;

  const html = emailWrapper(`
    ${emailHeader('Payment Reminder')}
    <tr>
      <td style="background:#161616;padding:36px;">
        <p style="color:#e11d48;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Action Required</p>
        <h2 style="color:#f0f0f0;font-size:20px;margin:0 0 10px;font-weight:700;">Dear ${name},</h2>
        <p style="color:#999;font-size:14px;line-height:1.7;margin:0 0 28px;">Your monthly membership payment is due soon. Please settle your balance before the due date to keep your membership active.</p>
        <div style="border-top:1px solid #2a2a2a;margin:0 0 24px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:14px;background:#1f1f1f;color:#666;font-size:12px;width:45%;">Amount Due</td>
            <td style="padding:14px;background:#1f1f1f;color:#e11d48;font-size:16px;font-weight:700;">LKR ${amount}</td>
          </tr>
          <tr>
            <td style="padding:14px;background:#191919;color:#666;font-size:12px;">Due Date</td>
            <td style="padding:14px;background:#191919;color:#f0f0f0;font-size:14px;font-weight:600;">${dueDate}</td>
          </tr>
        </table>
        <div style="border-top:1px solid #2a2a2a;margin:24px 0;"></div>
        <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">Payments are accepted in cash at the gym counter. If you have already paid, please disregard this notice.</p>
      </td>
    </tr>
    ${emailFooter()}`);

  return sendEmail({ to: email, subject, text, html });
};

const sendBirthdayWish = async ({ name, email }) => {
  if (!email) {
    logger.warn(`[Email] No email for member ${name}, skipping birthday wish.`);
    return { skipped: true };
  }

  const subject = `Happy Birthday — Compliments from Focus Fitness`;
  const text = `Dear ${name},\n\nWishing you a very happy birthday from all of us at Focus Fitness.\n\nWe hope this year brings you great health, strength, and success in all your fitness goals.\n\nFocus Fitness Team`;

  const html = emailWrapper(`
    ${emailHeader('Birthday Greetings')}
    <tr>
      <td style="background:#161616;padding:36px;text-align:center;">
        <div style="width:64px;height:4px;background:#e11d48;margin:0 auto 28px;border-radius:2px;"></div>
        <h2 style="color:#f0f0f0;font-size:26px;margin:0 0 8px;font-weight:700;letter-spacing:1px;">Happy Birthday</h2>
        <p style="color:#e11d48;font-size:18px;font-weight:600;margin:0 0 28px;">${name}</p>
        <p style="color:#999;font-size:14px;line-height:1.8;max-width:380px;margin:0 auto 28px;">Wishing you a wonderful birthday and continued success in your fitness journey. Thank you for being a valued member of Focus Fitness.</p>
        <div style="border-top:1px solid #2a2a2a;margin:0 auto;max-width:280px;"></div>
        <p style="color:#555;font-size:12px;margin:24px 0 0;letter-spacing:1px;text-transform:uppercase;">Focus Fitness Team</p>
      </td>
    </tr>
    ${emailFooter()}`);

  return sendEmail({ to: email, subject, text, html });
};

const sendPaymentReceiptEmail = async ({ name, email, receiptNumber, amount, month, year, collectedBy, nextDueDate }) => {
  if (!email) return { skipped: true };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = MONTHS[(month - 1)] || month;
  const dueDateStr = nextDueDate
    ? new Date(nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  const subject = `Payment Confirmed — ${monthName} ${year} | Focus Fitness`;
  const text = `Dear ${name},\n\nYour payment of LKR ${amount} for ${monthName} ${year} has been received.\nReceipt: ${receiptNumber}\nNext Due Date: ${dueDateStr}\n\nFocus Fitness`;

  const html = emailWrapper(`
    ${emailHeader('Payment Receipt')}
    <tr>
      <td style="background:#161616;padding:36px;">
        <p style="color:#e11d48;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Payment Confirmed</p>
        <h2 style="color:#f0f0f0;font-size:20px;margin:0 0 10px;font-weight:700;">Dear ${name},</h2>
        <p style="color:#999;font-size:14px;line-height:1.7;margin:0 0 28px;">Your membership payment has been successfully recorded. Thank you for staying active with Focus Fitness. A PDF receipt is attached for your records.</p>
        <div style="border-top:1px solid #2a2a2a;margin:0 0 24px;"></div>
        <p style="color:#555;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Receipt Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:11px 14px;background:#1f1f1f;color:#666;font-size:12px;width:45%;">Receipt No.</td>
            <td style="padding:11px 14px;background:#1f1f1f;color:#e11d48;font-size:12px;font-weight:700;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#191919;color:#666;font-size:12px;">Period</td>
            <td style="padding:11px 14px;background:#191919;color:#f0f0f0;font-size:12px;font-weight:600;">${monthName} ${year}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#1f1f1f;color:#666;font-size:12px;">Amount Paid</td>
            <td style="padding:11px 14px;background:#1f1f1f;color:#22c55e;font-size:16px;font-weight:700;">LKR ${amount}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#191919;color:#666;font-size:12px;">Collected By</td>
            <td style="padding:11px 14px;background:#191919;color:#f0f0f0;font-size:12px;font-weight:600;">${collectedBy || 'Focus Fitness Staff'}</td>
          </tr>
          <tr>
            <td style="padding:11px 14px;background:#1f1f1f;color:#666;font-size:12px;">Next Due Date</td>
            <td style="padding:11px 14px;background:#1f1f1f;color:#f0f0f0;font-size:12px;font-weight:600;">${dueDateStr}</td>
          </tr>
        </table>
        <div style="border-top:1px solid #2a2a2a;margin:24px 0 0;"></div>
        <p style="color:#555;font-size:12px;margin:20px 0 0;">Please retain this receipt for your records. If you have any questions, contact us at the gym.</p>
      </td>
    </tr>
    ${emailFooter()}`);

  // Generate PDF receipt attachment
  const pdfBuffer = await generateReceiptPDF({ name, receiptNumber, amount, month, year, collectedBy, nextDueDate });
  const pdfFilename = `Receipt_${receiptNumber}.pdf`;

  return sendEmail({ to: email, subject, text, html, attachments: [{ filename: pdfFilename, mimeType: 'application/pdf', data: pdfBuffer }] });
};

const sendPlanEmail = async ({ name, email, type, title, content }) => {
  if (!email) return { skipped: true };

  const typeLabel = type === 'MEAL_PLAN' ? 'Meal Plan' : 'Workout Schedule';
  const instruction = type === 'MEAL_PLAN'
    ? 'Follow this meal plan consistently for best results. Stay hydrated and try to eat at regular times each day.'
    : 'Complete each session as scheduled. Focus on proper form and rest adequately between sets.';

  const subject = title
    ? `${typeLabel}: ${title} \u2014 Focus Fitness`
    : `Your ${typeLabel} \u2014 Focus Fitness`;

  const contentHtml = content
    .split('\n')
    .map((line) => line.trim() === '' ? '<br>' : `<p style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 4px;">${line}</p>`)
    .join('');

  const html = emailWrapper(`
    ${emailHeader(typeLabel)}
    <tr>
      <td style="background:#161616;padding:36px;">
        <p style="color:#e11d48;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">${typeLabel} &mdash; Focus Fitness</p>
        <h2 style="color:#f0f0f0;font-size:20px;margin:0 0 6px;font-weight:700;">${name}</h2>
        ${title ? `<p style="color:#e11d48;font-size:15px;font-weight:600;margin:4px 0 20px;">${title}</p>` : '<div style="margin-bottom:20px;"></div>'}
        <p style="color:#999;font-size:13px;line-height:1.7;margin:0 0 24px;">${instruction}</p>
        <div style="border-top:1px solid #2a2a2a;margin:0 0 24px;"></div>
        <div style="background:#1a1a1a;border-radius:8px;padding:20px 24px;border-left:3px solid #e11d48;">
          ${contentHtml}
        </div>
        <div style="border-top:1px solid #2a2a2a;margin:24px 0 0;"></div>
        <p style="color:#555;font-size:12px;margin:20px 0 0;">This plan was prepared by your trainer at Focus Fitness. A PDF copy is attached for easy reference. Contact us at the gym for any questions.</p>
      </td>
    </tr>
    ${emailFooter()}`);

  // Generate PDF attachment
  const pdfBuffer = await generatePlanPDF({ name, type, title, content });
  const pdfFilename = `${typeLabel.replace(' ', '_')}_${name.replace(/\s+/g, '_')}.pdf`;

  const text = `${name} — ${typeLabel}${title ? ` — ${title}` : ''}\n\n${instruction}\n\n${content}\n\nFocus Fitness`;
  return sendEmail({
    to: email,
    subject,
    text,
    html,
    attachments: [{ filename: pdfFilename, mimeType: 'application/pdf', data: pdfBuffer }],
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendPaymentReminder, sendBirthdayWish, sendPaymentReceiptEmail, sendPlanEmail };
