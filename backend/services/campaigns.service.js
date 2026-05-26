const { pool } = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER || 'niralteksolutions@gmail.com',
    pass: process.env.SMTP_PASS || 'toor qnnv zyqi ozzj'
  }
});

function personalizeContent(templateStr, recipient) {
  if (!templateStr) return '';
  return templateStr
    .replace(/\{\{name\}\}/g, recipient.full_name || '')
    .replace(/\{\{company\}\}/g, recipient.company_name || '')
    .replace(/\{\{department\}\}/g, recipient.department || '');
}

async function getCampaignDashboard() {
  const [[metrics]] = await pool.execute(`
    SELECT 
      COUNT(*) AS total_campaigns,
      SUM(sent_count) AS total_sent,
      SUM(failed_count) AS total_failed,
      SUM(open_count) AS total_opened
    FROM campaigns
  `);

  const [recentCampaigns] = await pool.execute(`
    SELECT id, name, subject, sent_count, failed_count, open_count, created_at
    FROM campaigns
    ORDER BY created_at DESC
    LIMIT 5
  `);

  const totalSent = Number(metrics.total_sent || 0);
  const totalOpened = Number(metrics.total_opened || 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return {
    totalCampaigns: Number(metrics.total_campaigns || 0),
    totalSent,
    totalFailed: Number(metrics.total_failed || 0),
    openRate,
    recentCampaigns
  };
}

async function getCampaigns(search = '', limit = 10, offset = 0, sortKey = 'created_at', sortDirection = 'DESC') {
  const allowedSortKeys = ['id', 'name', 'subject', 'sent_count', 'failed_count', 'open_count', 'created_at'];
  const safeSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'created_at';
  const safeSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let query = `
    SELECT id, name, subject, sent_count, failed_count, open_count, created_at
    FROM campaigns
  `;
  const params = [];

  if (search) {
    query += ` WHERE name LIKE ? OR subject LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY ${safeSortKey} ${safeSortDirection} LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [campaigns] = await pool.query(query, params);

  let countQuery = `SELECT COUNT(*) AS total FROM campaigns`;
  const countParams = [];
  if (search) {
    countQuery += ` WHERE name LIKE ? OR subject LIKE ?`;
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const [[{ total }]] = await pool.query(countQuery, countParams);

  return {
    campaigns,
    total
  };
}

async function getCampaignById(id) {
  const [campaigns] = await pool.execute(
    `SELECT id, name, subject, body, template_id, sent_count, failed_count, open_count, created_at FROM campaigns WHERE id = ?`,
    [id]
  );

  if (campaigns.length === 0) {
    const err = new Error('Campaign not found.');
    err.statusCode = 404;
    throw err;
  }

  const [recipients] = await pool.execute(
    `SELECT cr.id, cr.email, cr.status, cr.opened_at, cr.error_message, cr.sent_at, e.full_name AS visitor_name
     FROM campaign_recipients cr
     LEFT JOIN enquiries e ON cr.visitor_id = e.id
     WHERE cr.campaign_id = ?`,
    [id]
  );

  return {
    ...campaigns[0],
    recipients
  };
}

async function getTemplates() {
  const [templates] = await pool.execute(
    `SELECT id, name, subject, body, created_at FROM campaign_templates ORDER BY name ASC`
  );
  return templates;
}

async function createTemplate(data) {
  const [result] = await pool.execute(
    `INSERT INTO campaign_templates (name, subject, body) VALUES (?, ?, ?)`,
    [data.name.trim(), data.subject.trim(), data.body]
  );
  return { id: result.insertId, ...data };
}

async function updateTemplate(id, data) {
  await pool.execute(
    `UPDATE campaign_templates SET name = ?, subject = ?, body = ? WHERE id = ?`,
    [data.name.trim(), data.subject.trim(), data.body, id]
  );
  return { id, ...data };
}

async function deleteTemplate(id) {
  await pool.execute(`DELETE FROM campaign_templates WHERE id = ?`, [id]);
  return { message: 'Template deleted successfully.' };
}

async function sendCampaign(data) {
  const { name, subject, body, templateId, visitorIds } = data;
  if (!visitorIds || visitorIds.length === 0) {
    const err = new Error('No recipients selected.');
    err.statusCode = 400;
    throw err;
  }

  // Fetch recipients details
  const placeholders = visitorIds.map(() => '?').join(',');
  const [visitors] = await pool.query(
    `SELECT id, title, full_name, company_name, email, department FROM enquiries WHERE id IN (${placeholders})`,
    visitorIds
  );

  if (visitors.length === 0) {
    const err = new Error('Recipients not found in Visitor Directory.');
    err.statusCode = 400;
    throw err;
  }

  // Create Campaign entry
  const [result] = await pool.execute(
    `INSERT INTO campaigns (name, subject, body, template_id) VALUES (?, ?, ?, ?)`,
    [name.trim(), subject.trim(), body, templateId || null]
  );
  const campaignId = result.insertId;

  let sent = 0;
  let failed = 0;
  let opened = 0;

  for (const visitor of visitors) {
    let status = 'Delivered';
    let errorMessage = null;
    let openedAt = null;

    if (!visitor.email) {
      status = 'Failed';
      errorMessage = 'Missing email address';
      failed++;
    } else {
      try {
        const personalizedSubject = personalizeContent(subject, visitor);
        const personalizedBody = personalizeContent(body, visitor);

        await transporter.sendMail({
          from: `"NiralTek Solutions" <${process.env.SMTP_USER || 'niralteksolutions@gmail.com'}>`,
          to: visitor.email,
          subject: personalizedSubject,
          html: personalizedBody
        });

        status = 'Delivered';
        sent++;
      } catch (err) {
        console.error(`Failed to send email to ${visitor.email}:`, err);
        status = 'Failed';
        errorMessage = err.message || 'SMTP Connection Error';
        failed++;
      }
    }

    await pool.execute(
      `INSERT INTO campaign_recipients (campaign_id, visitor_id, email, status, opened_at, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
      [campaignId, visitor.id, visitor.email || 'N/A', status, openedAt, errorMessage]
    );
  }

  // Update statistics back to the Campaign table
  await pool.execute(
    `UPDATE campaigns SET sent_count = ?, failed_count = ?, open_count = ? WHERE id = ?`,
    [sent, failed, opened, campaignId]
  );

  return {
    success: true,
    campaignId,
    stats: { sent, failed, opened }
  };
}

async function getVisitorRecipientHistory(visitorId) {
  const [history] = await pool.execute(`
    SELECT cr.id, cr.campaign_id, cr.email, cr.status, cr.opened_at, cr.error_message, cr.sent_at, c.name AS campaign_name, c.subject
    FROM campaign_recipients cr
    INNER JOIN campaigns c ON cr.campaign_id = c.id
    WHERE cr.visitor_id = ?
    ORDER BY cr.sent_at DESC
  `, [visitorId]);

  let lastContacted = null;
  if (history.length > 0) {
    lastContacted = history[0].sent_at;
  }

  return {
    lastContacted,
    history
  };
}

module.exports = {
  getCampaignDashboard,
  getCampaigns,
  getCampaignById,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendCampaign,
  getVisitorRecipientHistory
};
