const PDFDocument = require('pdfkit');

const RED = '#e11d48';
const BLACK = '#0d0d0d';
const DARK = '#161616';
const GREY = '#888888';
const WHITE = '#f0f0f0';
const LIGHT = '#cccccc';

/**
 * Generates a branded Focus Fitness plan PDF.
 * Returns a Buffer.
 */
const generatePlanPDF = ({ name, type, title, content }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;   // 595
    const H = doc.page.height;  // 841
    const M = 48;               // side margin

    // ── Page background ───────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(BLACK);

    // ── Header bar ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(BLACK);
    doc.rect(0, 87, W, 3).fill(RED);

    // Logo text
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(RED)
      .text('FOCUS FITNESS', M, 28, { characterSpacing: 4 });

    // Subtitle
    const typeLabel = type === 'MEAL_PLAN' ? 'MEAL PLAN' : 'WORKOUT SCHEDULE';
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GREY)
      .text(typeLabel, M, 56, { characterSpacing: 2 });

    // ── Member info band ──────────────────────────────────────────
    doc.rect(0, 90, W, 52).fill(DARK);

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(WHITE)
      .text(name, M, 104);

    if (title) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(RED)
        .text(title, M, 122);
    }

    // Date on the right
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GREY)
      .text(dateStr, 0, 116, { align: 'right', width: W - M });

    // ── Instruction line ──────────────────────────────────────────
    const instruction = type === 'MEAL_PLAN'
      ? 'Follow this meal plan consistently. Stay hydrated and eat at regular times each day.'
      : 'Complete each session as scheduled. Focus on proper form and rest adequately between sets.';

    doc
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .fillColor(GREY)
      .text(instruction, M, 162, { width: W - M * 2 });

    // ── Red left border accent + content ─────────────────────────
    const contentY = 192;
    doc.rect(M, contentY, 3, doc.page.height - contentY - 80).fill(RED);

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(WHITE)
      .text(content, M + 16, contentY + 4, {
        width: W - M * 2 - 16,
        lineGap: 4,
        paragraphGap: 6,
      });

    // ── Footer ────────────────────────────────────────────────────
    const footerY = doc.page.height - 48;
    doc.rect(0, footerY, W, 1).fill('#2a2a2a');

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(GREY)
      .text('Focus Fitness — This plan was prepared by your trainer. Contact us at the gym for any questions.', M, footerY + 12, {
        width: W - M * 2,
        align: 'center',
      });

    doc.end();
  });
};

/**
 * Generates a branded Focus Fitness payment receipt PDF.
 * Returns a Buffer.
 */
const generateReceiptPDF = ({ name, receiptNumber, amount, month, year, collectedBy, nextDueDate }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 48;

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = MONTHS[(month - 1)] || month;
    const dueDateStr = nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';
    const issuedStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Page background ───────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(BLACK);

    // ── Header bar ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(BLACK);
    doc.rect(0, 87, W, 3).fill(RED);

    doc.font('Helvetica-Bold').fontSize(22).fillColor(RED)
      .text('FOCUS FITNESS', M, 28, { characterSpacing: 4 });
    doc.font('Helvetica').fontSize(9).fillColor(GREY)
      .text('PAYMENT RECEIPT', M, 56, { characterSpacing: 2 });

    // Receipt number top-right
    doc.font('Helvetica').fontSize(9).fillColor(GREY)
      .text(receiptNumber, 0, 32, { align: 'right', width: W - M });
    doc.font('Helvetica').fontSize(8).fillColor('#555')
      .text(issuedStr, 0, 46, { align: 'right', width: W - M });

    // ── Member info band ──────────────────────────────────────────
    doc.rect(0, 90, W, 52).fill(DARK);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
      .text(name, M, 104);
    doc.font('Helvetica').fontSize(10).fillColor(GREY)
      .text('Member', M, 122);

    // ── PAID stamp (right side of band) ──────────────────────────
    doc.save();
    doc.rect(W - M - 80, 98, 80, 28).fill('#14532d');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#22c55e')
      .text('PAID', W - M - 80, 107, { width: 80, align: 'center' });
    doc.restore();

    // ── Amount block ─────────────────────────────────────────────
    const amtY = 168;
    doc.font('Helvetica').fontSize(9).fillColor(GREY)
      .text('AMOUNT PAID', M, amtY, { characterSpacing: 1.5 });
    doc.font('Helvetica-Bold').fontSize(32).fillColor(RED)
      .text(`LKR ${Number(amount).toLocaleString()}`, M, amtY + 14);
    doc.font('Helvetica').fontSize(10).fillColor(GREY)
      .text(`for ${monthName} ${year}`, M, amtY + 52);

    // ── Divider ───────────────────────────────────────────────────
    doc.rect(M, amtY + 70, W - M * 2, 1).fill('#2a2a2a');

    // ── Details table ─────────────────────────────────────────────
    const tableY = amtY + 86;
    const col1 = M;
    const col2 = M + 200;
    const rowH = 36;

    const rows = [
      ['Receipt Number', receiptNumber],
      ['Member Name',    name],
      ['Period',         `${monthName} ${year}`],
      ['Collected By',   collectedBy || 'Focus Fitness Staff'],
      ['Next Due Date',  dueDateStr],
    ];

    rows.forEach(([label, value], i) => {
      const rowY = tableY + i * rowH;
      const bg = i % 2 === 0 ? '#1a1a1a' : '#161616';
      doc.rect(M, rowY, W - M * 2, rowH).fill(bg);

      doc.font('Helvetica').fontSize(10).fillColor(GREY)
        .text(label, col1 + 12, rowY + 11, { width: 180 });

      const valueColor = label === 'Receipt Number' ? RED : WHITE;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(valueColor)
        .text(value, col2, rowY + 11, { width: W - col2 - M - 12 });
    });

    // ── Thank you message ─────────────────────────────────────────
    const msgY = tableY + rows.length * rowH + 32;
    doc.rect(M, msgY, W - M * 2, 1).fill('#2a2a2a');
    doc.font('Helvetica-Oblique').fontSize(11).fillColor(GREY)
      .text('Thank you for your payment. We look forward to seeing you at the gym!', M, msgY + 18, {
        width: W - M * 2, align: 'center',
      });

    // ── Footer ────────────────────────────────────────────────────
    const footerY = H - 48;
    doc.rect(0, footerY, W, 1).fill('#2a2a2a');
    doc.font('Helvetica').fontSize(8.5).fillColor(GREY)
      .text('Focus Fitness — This is an official payment receipt. Please retain for your records.', M, footerY + 12, {
        width: W - M * 2, align: 'center',
      });

    doc.end();
  });
};

module.exports = { generatePlanPDF, generateReceiptPDF, generateReceiptPDF };
