const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER || 'niralteksolutions@gmail.com',
    pass: process.env.SMTP_PASS || 'toor qnnv zyqi ozzj'
  }
});

let officeNumberColumnExists;

async function hasOfficeNumberColumn() {
  if (officeNumberColumnExists !== undefined) {
    return officeNumberColumnExists;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME = 'office_number'`
  );

  officeNumberColumnExists = Number(rows[0]?.count || 0) > 0;
  return officeNumberColumnExists;
}

async function uploadVisitingCard(file) {
  const url = `/uploads/visiting-cards/${file.filename}`;
  const [result] = await pool.execute(
    `INSERT INTO visiting_cards (filename, url, file_size, mime_type, status)
     VALUES (?, ?, ?, ?, ?)`,
    [file.filename, url, file.size, file.mimetype, 0]
  );

  return {
    id: result.insertId,
    url,
    filename: file.filename,
    uploadedAt: new Date().toISOString()
  };
}

async function createEnquiry(payload, files = {}) {
  let visitingCardId = null;
  let visitingCardUrl = null;
  let voiceNoteId = null;
  let voiceNoteUrl = null;

  if (files.visitingCard && files.visitingCard[0]) {
    const card = await uploadVisitingCard(files.visitingCard[0]);
    visitingCardId = card.id;
    visitingCardUrl = card.url;
  }

  if (files.voiceNote && files.voiceNote[0]) {
    const file = files.voiceNote[0];
    voiceNoteUrl = `/uploads/voicenote/${file.filename}`;

    const [result] = await pool.execute(
      `INSERT INTO voice_notes
      (
        filename,
        url,
        file_size,
        mime_type,
        status
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        file.filename,
        voiceNoteUrl,
        file.size,
        file.mimetype,
        0
      ]
    );

    voiceNoteId = result.insertId;
  }

  const hasOfficeNumber = await hasOfficeNumberColumn();
  const columns = [
    'title',
    'full_name',
    'company_name',
    'job_title',
    'email',
    'mobile',
    ...(hasOfficeNumber ? ['office_number'] : []),
    'department',
    'interests',
    'visiting_card_id',
    'visiting_card_url',
    'voice_note_id',
    'voice_note_url',
    'venue_id',
    'remarks',
    'lead_category'
  ];
  const values = [
    payload.title,
    payload.fullName,
    payload.companyName,
    payload.jobTitle,
    payload.email,
    payload.mobile,
    ...(hasOfficeNumber ? [payload.officeNumber] : []),
    payload.department,
    JSON.stringify(payload.interests),
    visitingCardId,
    visitingCardUrl,
    voiceNoteId,
    voiceNoteUrl,
    payload.venueId,
    payload.remarks,
    payload.leadCategory || 'Potential'
  ];
  const placeholders = columns.map(column => column === 'interests' ? 'CAST(? AS JSON)' : '?').join(', ');

  const [result] = await pool.execute(
    `INSERT INTO enquiries (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );

  sendThankYouMail(payload).catch((mailError) => {
    console.error('MAIL ERROR:', mailError.message);
  });

  return {
    success: true,
    payload: {
      ...payload,
      id: result.insertId,
      visitingCardId,
      visitingCardUrl,
      voiceNoteId,
      voiceNoteUrl,
      createdAt: new Date().toISOString()
    }
  };
}

async function getEnquiries() {
  const officeNumberSelect = await hasOfficeNumberColumn() ? 'office_number' : 'NULL AS office_number';
  const [enquiries] = await pool.execute(
    `SELECT id, title, full_name, company_name, job_title, email, mobile, ${officeNumberSelect}, department, interests, visiting_card_url, voice_note_url, venue_id, remarks, created_at, lead_category
     FROM enquiries WHERE status = 0 ORDER BY created_at DESC`
  );

  return enquiries;
}

async function updateLeadCategory(id, category) {
  await pool.execute(
    `UPDATE enquiries SET lead_category = ? WHERE id = ?`,
    [category, id]
  );

  return { message: 'Lead category updated successfully.', category };
}

async function updateVisitingCard(id, file) {
  const [existingRows] = await pool.execute(
    `SELECT visiting_card_id FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  const card = await uploadVisitingCard(file);

  await pool.execute(
    `UPDATE enquiries SET visiting_card_id = ?, visiting_card_url = ? WHERE id = ?`,
    [card.id, card.url, id]
  );

  const previousCardId = existingRows[0].visiting_card_id;
  if (previousCardId) {
    await pool.execute(
      `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
      [previousCardId]
    );
  }

  return {
    message: 'Visiting card updated successfully.',
    visitingCardUrl: card.url
  };
}

async function removeVisitingCard(id) {
  const [existingRows] = await pool.execute(
    `SELECT visiting_card_id FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `UPDATE enquiries SET visiting_card_id = NULL, visiting_card_url = NULL WHERE id = ?`,
    [id]
  );

  const previousCardId = existingRows[0].visiting_card_id;
  if (previousCardId) {
    await pool.execute(
      `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
      [previousCardId]
    );
  }

  return {
    message: 'Visiting card removed successfully.',
    visitingCardUrl: null
  };
}

async function updateEnquiry(id, enquiry) {
  const hasOfficeNumber = await hasOfficeNumberColumn();
  const officeNumberSet = hasOfficeNumber ? 'office_number = ?, ' : '';
  const officeNumberValue = hasOfficeNumber ? [enquiry.office_number || null] : [];

  await pool.execute(
    `UPDATE enquiries
     SET full_name = ?, company_name = ?, email = ?, mobile = ?, ${officeNumberSet}department = ?, interests = CAST(? AS JSON), lead_category = ?, venue_id = ?
     WHERE id = ?`,
    [
      enquiry.full_name,
      enquiry.company_name || null,
      enquiry.email,
      enquiry.mobile,
      ...officeNumberValue,
      enquiry.department || null,
      JSON.stringify(enquiry.interests),
      enquiry.lead_category || 'Potential',
      enquiry.venue_id || null,
      id
    ]
  );

  return { message: 'Visitor updated successfully.' };
}

async function deleteEnquiry(id) {
  await pool.execute('UPDATE enquiries SET status = 1 WHERE id = ?', [id]);
  return { message: 'Visitor deleted successfully.' };
}

async function sendThankYouMail(payload) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'niralteksolutions@gmail.com',
    to: payload.email,
    subject: 'Thank You For Your Enquiry',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2>Thank You For Your Enquiry</h2>
          <p>Dear ${payload.fullName},</p>
          <p>Thank you for contacting Niraltek Solutions.</p>
          <p>We have successfully received your enquiry and our team will contact you shortly.</p>
        </div>
      </div>
    `
  });

  console.log('Mail sent successfully');
}

module.exports = {
  uploadVisitingCard,
  createEnquiry,
  getEnquiries,
  updateLeadCategory,
  updateVisitingCard,
  removeVisitingCard,
  updateEnquiry,
  deleteEnquiry
};
