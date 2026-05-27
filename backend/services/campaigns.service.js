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
      COUNT(CASE WHEN status IN ('Sent', 'Completed') THEN 1 END) AS total_campaigns,
      SUM(CASE WHEN status IN ('Sent', 'Completed') THEN sent_count ELSE 0 END) AS total_sent,
      SUM(CASE WHEN status IN ('Sent', 'Completed') THEN failed_count ELSE 0 END) AS total_failed,
      SUM(CASE WHEN status IN ('Sent', 'Completed') THEN open_count ELSE 0 END) AS total_opened,
      COUNT(CASE WHEN status = 'Draft' THEN 1 END) AS total_drafts,
      COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) AS total_scheduled,
      COUNT(CASE WHEN status = 'Failed' THEN 1 END) AS total_failed_campaigns,
      COUNT(CASE WHEN status = 'Scheduled' AND (scheduled_at IS NULL OR scheduled_at > UTC_TIMESTAMP()) THEN 1 END) AS pending_triggers,
      COUNT(CASE WHEN status IN ('Sent', 'Completed') AND DATE(created_at) = CURRENT_DATE() THEN 1 END) AS sent_today
    FROM campaigns
  `);

  const [recentCampaigns] = await pool.execute(`
    SELECT id, name, subject, sent_count, failed_count, open_count, created_at, status
    FROM campaigns
    WHERE status IN ('Sent', 'Completed', 'Failed')
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
    recentCampaigns,
    totalDrafts: Number(metrics.total_drafts || 0),
    totalScheduled: Number(metrics.total_scheduled || 0),
    totalFailedCampaigns: Number(metrics.total_failed_campaigns || 0),
    pendingTriggers: Number(metrics.pending_triggers || 0),
    sentToday: Number(metrics.sent_today || 0)
  };
}

async function getCampaigns(search = '', limit = 10, offset = 0, sortKey = 'created_at', sortDirection = 'DESC', status = '') {
  const allowedSortKeys = ['id', 'name', 'subject', 'sent_count', 'failed_count', 'open_count', 'created_at', 'status', 'scheduled_at'];
  const safeSortKey = allowedSortKeys.includes(sortKey) ? `c.${sortKey}` : 'c.created_at';
  const safeSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let query = `
    SELECT c.id, c.name, c.subject, c.sent_count, c.failed_count, c.open_count, c.created_at, c.status, c.scheduled_at, c.timezone, c.recipient_ids, c.trigger_type, c.next_execution, e.name AS creator_name
    FROM campaigns c
    LEFT JOIN employees e ON c.created_by = e.id
  `;
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push(`(c.name LIKE ? OR c.subject LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    if (status === 'Sent') {
      conditions.push(`c.status IN ('Sent', 'Completed')`);
    } else if (status === 'Scheduled') {
      conditions.push(`c.status IN ('Scheduled', 'Cancelled', 'Paused', 'Sending')`);
    } else {
      conditions.push(`c.status = ?`);
      params.push(status);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY ${safeSortKey} ${safeSortDirection} LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [campaigns] = await pool.query(query, params);

  let countQuery = `SELECT COUNT(*) AS total FROM campaigns c`;
  const countParams = [];
  const countConditions = [];

  if (search) {
    countConditions.push(`(c.name LIKE ? OR c.subject LIKE ?)`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    if (status === 'Sent') {
      countConditions.push(`c.status IN ('Sent', 'Completed')`);
    } else if (status === 'Scheduled') {
      countConditions.push(`c.status IN ('Scheduled', 'Cancelled', 'Paused', 'Sending')`);
    } else {
      countConditions.push(`c.status = ?`);
      countParams.push(status);
    }
  }

  if (countConditions.length > 0) {
    countQuery += ` WHERE ` + countConditions.join(' AND ');
  }

  const [[{ total }]] = await pool.query(countQuery, countParams);

  return {
    campaigns,
    total
  };
}

async function getCampaignById(id) {
  const [campaigns] = await pool.execute(
    `SELECT c.id, c.name, c.subject, c.body, c.template_id, c.sent_count, c.failed_count, c.open_count, c.created_at, c.status, c.scheduled_at, c.timezone, c.recipient_ids, c.trigger_type, c.next_execution, e.name AS creator_name
     FROM campaigns c
     LEFT JOIN employees e ON c.created_by = e.id
     WHERE c.id = ?`,
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

async function sendCampaignBackground(campaign, visitorIds) {
  const { id, subject, body } = campaign;

  const placeholders = visitorIds.map(() => '?').join(',');
  const [visitors] = await pool.query(
    `SELECT id, title, full_name, company_name, email, department FROM enquiries WHERE id IN (${placeholders})`,
    visitorIds
  );

  let sent = 0;
  let failed = 0;
  let opened = 0;

  // Clear previous execution recipients if retry
  await pool.execute(`DELETE FROM campaign_recipients WHERE campaign_id = ?`, [id]);

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
      [id, visitor.id, visitor.email || 'N/A', status, openedAt, errorMessage]
    );
  }

  // Update statistics back to the Campaign table
  const finalStatus = failed === visitors.length ? 'Failed' : 'Sent';
  await pool.execute(
    `UPDATE campaigns SET sent_count = ?, failed_count = ?, open_count = ?, status = ? WHERE id = ?`,
    [sent, failed, opened, finalStatus, id]
  );
}

async function sendCampaign(data) {
  const { name, subject, body, templateId, visitorIds, userId } = data;
  if (!visitorIds || visitorIds.length === 0) {
    const err = new Error('No recipients selected.');
    err.statusCode = 400;
    throw err;
  }

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
    `INSERT INTO campaigns (name, subject, body, template_id, status, recipient_ids, created_by) VALUES (?, ?, ?, ?, 'Sending', ?, ?)`,
    [name.trim(), subject.trim(), body, templateId || null, JSON.stringify(visitorIds), userId || null]
  );
  const campaignId = result.insertId;

  const campaign = { id: campaignId, name, subject, body };
  sendCampaignBackground(campaign, visitorIds).catch(err => {
    console.error(`Background campaign send failed for ${campaignId}:`, err);
  });

  return {
    success: true,
    campaignId,
    stats: { sent: visitorIds.length, failed: 0, opened: 0 }
  };
}

async function createCampaign(data) {
  const { name, subject, body, templateId, visitorIds, status, scheduledAt, timezone, triggerType, userId } = data;
  const [result] = await pool.execute(
    `INSERT INTO campaigns (name, subject, body, template_id, status, scheduled_at, timezone, recipient_ids, trigger_type, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      subject.trim(),
      body,
      templateId || null,
      status || 'Draft',
      scheduledAt || null,
      timezone || 'IST',
      visitorIds ? JSON.stringify(visitorIds) : null,
      triggerType || 'scheduled',
      userId || null
    ]
  );
  return { id: result.insertId, ...data };
}

async function updateCampaign(id, data) {
  const { name, subject, body, templateId, visitorIds, status, scheduledAt, timezone, triggerType } = data;
  await pool.execute(
    `UPDATE campaigns 
     SET name = ?, subject = ?, body = ?, template_id = ?, status = ?, scheduled_at = ?, timezone = ?, recipient_ids = ?, trigger_type = ?
     WHERE id = ?`,
    [
      name.trim(),
      subject.trim(),
      body,
      templateId || null,
      status || 'Draft',
      scheduledAt || null,
      timezone || 'IST',
      visitorIds ? JSON.stringify(visitorIds) : null,
      triggerType || 'scheduled',
      id
    ]
  );
  return { id, ...data };
}

async function triggerCampaign(id) {
  const [campaigns] = await pool.execute(
    `SELECT id, name, subject, body, template_id, recipient_ids FROM campaigns WHERE id = ?`,
    [id]
  );
  if (campaigns.length === 0) {
    const err = new Error('Campaign not found.');
    err.statusCode = 404;
    throw err;
  }
  const campaign = campaigns[0];
  let visitorIds = [];
  if (campaign.recipient_ids) {
    try {
      visitorIds = JSON.parse(campaign.recipient_ids);
    } catch (e) {
      visitorIds = campaign.recipient_ids.split(',').map(Number).filter(n => !isNaN(n));
    }
  }

  if (visitorIds.length === 0) {
    const err = new Error('No recipients selected for this campaign.');
    err.statusCode = 400;
    throw err;
  }

  // Update status to 'Sending'
  await pool.execute(
    `UPDATE campaigns SET status = 'Sending', trigger_type = 'manual' WHERE id = ?`,
    [id]
  );

  // Trigger background sending
  sendCampaignBackground(campaign, visitorIds).catch(err => {
    console.error(`Background manual trigger failed for campaign ${id}:`, err);
  });

  return { success: true, message: 'Campaign execution started.' };
}

async function pauseCampaign(id) {
  await pool.execute(
    `UPDATE campaigns SET status = 'Cancelled' WHERE id = ?`,
    [id]
  );
  return { success: true, message: 'Campaign schedule paused/cancelled.' };
}

async function resumeCampaign(id, scheduledAt, timezone) {
  await pool.execute(
    `UPDATE campaigns SET status = 'Scheduled', scheduled_at = ?, timezone = ? WHERE id = ?`,
    [scheduledAt, timezone || 'IST', id]
  );
  return { success: true, message: 'Campaign schedule resumed/rescheduled.' };
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
  createCampaign,
  updateCampaign,
  triggerCampaign,
  pauseCampaign,
  resumeCampaign,
  sendCampaignBackground,
  getVisitorRecipientHistory
};
