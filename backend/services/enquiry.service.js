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
let voiceNote2ColumnsExist;
let alternateMobileColumnExists;
let visitingCard2ColumnsExist;
let detailsColumnExists;

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

async function hasVoiceNote2Columns() {
  if (voiceNote2ColumnsExist !== undefined) {
    return voiceNote2ColumnsExist;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME = 'voice_note_id_2'`
  );

  const exists = Number(rows[0]?.count || 0) > 0;
  if (exists) {
    voiceNote2ColumnsExist = true;
  } else {
    voiceNote2ColumnsExist = undefined;
  }
  return exists;
}

async function assertVoiceNote2Columns() {
  voiceNote2ColumnsExist = undefined;
  if (!(await hasVoiceNote2Columns())) {
    const err = new Error('Voice note 2 is not available. Run the database migration.');
    err.statusCode = 503;
    throw err;
  }
}

async function hasAlternateMobileColumn() {
  if (alternateMobileColumnExists !== undefined) {
    return alternateMobileColumnExists;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME = 'alternate_mobile'`
  );

  const exists = Number(rows[0]?.count || 0) > 0;
  alternateMobileColumnExists = exists ? true : undefined;
  return exists;
}

async function hasVisitingCard2Columns() {
  if (visitingCard2ColumnsExist !== undefined) {
    return visitingCard2ColumnsExist;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME = 'visiting_card_id_2'`
  );

  const exists = Number(rows[0]?.count || 0) > 0;
  visitingCard2ColumnsExist = exists ? true : undefined;
  return exists;
}

async function hasDetailsColumn() {
  if (detailsColumnExists !== undefined) {
    return detailsColumnExists;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME = 'details'`
  );

  const exists = Number(rows[0]?.count || 0) > 0;
  detailsColumnExists = exists ? true : undefined;
  return exists;
}

async function assertVisitingCard2Columns() {
  visitingCard2ColumnsExist = undefined;
  if (!(await hasVisitingCard2Columns())) {
    const err = new Error('Visiting card 2 is not available. Run the database migration.');
    err.statusCode = 503;
    throw err;
  }
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
  let visitingCardId2 = null;
  let visitingCardUrl2 = null;
  let voiceNoteId = null;
  let voiceNoteUrl = null;
  let voiceNoteId2 = null;
  let voiceNoteUrl2 = null;

  if (files.visitingCard && files.visitingCard[0]) {
    const card = await uploadVisitingCard(files.visitingCard[0]);
    visitingCardId = card.id;
    visitingCardUrl = card.url;
  }

  const hasVisitingCard2 = await hasVisitingCard2Columns();

  if (files.visitingCard2 && files.visitingCard2[0] && hasVisitingCard2) {
    const card = await uploadVisitingCard(files.visitingCard2[0]);
    visitingCardId2 = card.id;
    visitingCardUrl2 = card.url;
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

  const hasVoiceNote2 = await hasVoiceNote2Columns();

  if (files.voiceNote2 && files.voiceNote2[0] && hasVoiceNote2) {
    const file = files.voiceNote2[0];
    voiceNoteUrl2 = `/uploads/voicenote/${file.filename}`;

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
        voiceNoteUrl2,
        file.size,
        file.mimetype,
        0
      ]
    );

    voiceNoteId2 = result.insertId;
  }

  const hasOfficeNumber = await hasOfficeNumberColumn();
  const hasAlternateMobile = await hasAlternateMobileColumn();
  const hasDetails = await hasDetailsColumn();
  const columns = [
    'title',
    'full_name',
    'company_name',
    'job_title',
    'email',
    'mobile',
    ...(hasAlternateMobile ? ['alternate_mobile'] : []),
    ...(hasOfficeNumber ? ['office_number'] : []),
    'department',
    'interests',
    'visiting_card_id',
    'visiting_card_url',
    ...(hasVisitingCard2 ? ['visiting_card_id_2', 'visiting_card_url_2'] : []),
    'voice_note_id',
    'voice_note_url',
    ...(hasVoiceNote2 ? ['voice_note_id_2', 'voice_note_url_2'] : []),
    'venue_id',
    'referred_by',
    'remarks',
    ...(hasDetails ? ['details'] : []),
    'lead_category'
  ];
  const values = [
    payload.title || '',
    payload.fullName || '',
    payload.companyName || '',
    payload.jobTitle || '',
    payload.email || '',
    payload.mobile || '',
    ...(hasAlternateMobile ? [payload.alternateMobile || ''] : []),
    ...(hasOfficeNumber ? [payload.officeNumber || ''] : []),
    payload.department || '',
    JSON.stringify(payload.interests || []),
    visitingCardId || null,
    visitingCardUrl || '',
    ...(hasVisitingCard2 ? [visitingCardId2 || null, visitingCardUrl2 || ''] : []),
    voiceNoteId || null,
    voiceNoteUrl || '',
    ...(hasVoiceNote2 ? [voiceNoteId2 || null, voiceNoteUrl2 || ''] : []),
    payload.venueId || '',
    payload.referred_by || '',
    payload.remarks || '',
    ...(hasDetails ? [payload.details || ''] : []),
    payload.leadCategory || ''
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
      visitingCardId2,
      visitingCardUrl2,
      alternateMobile: payload.alternateMobile,
      details: payload.details,
      voiceNoteId,
      voiceNoteUrl,
      voiceNoteId2,
      voiceNoteUrl2,
      venueId: payload.venueId,
      venue_id: payload.venueId,
      createdAt: new Date().toISOString()
    }
  };
}

async function getEnquiries() {
  const officeNumberSelect = await hasOfficeNumberColumn() ? 'office_number' : 'NULL AS office_number';
  const alternateMobileSelect = await hasAlternateMobileColumn() ? 'alternate_mobile' : 'NULL AS alternate_mobile';
  const visitingCard2Select = await hasVisitingCard2Columns() ? 'visiting_card_url_2' : 'NULL AS visiting_card_url_2';
  const voiceNote2Select = await hasVoiceNote2Columns() ? 'voice_note_url_2' : 'NULL AS voice_note_url_2';
  const detailsSelect = await hasDetailsColumn() ? 'details' : 'NULL AS details';
  const [enquiries] = await pool.execute(
    `SELECT id, title, full_name, company_name, job_title, email, mobile, ${alternateMobileSelect}, ${officeNumberSelect}, department, interests, visiting_card_url, ${visitingCard2Select}, voice_note_url, ${voiceNote2Select}, venue_id,referred_by,  remarks, ${detailsSelect}, created_at, lead_category
     FROM enquiries WHERE status = 0 ORDER BY created_at DESC`
  );

  return enquiries;
}

async function getFilteredEnquiries(filters = {}) {
  const {
    fromDate,
    toDate,
    department,
    product,
    category,
    venue,
    search,
    limit = 1000,
    offset = 0
  } = filters;

  const hasOfficeNumber = await hasOfficeNumberColumn();
  const hasAlternateMobile = await hasAlternateMobileColumn();
  const hasVisitingCard2 = await hasVisitingCard2Columns();
  const hasVoiceNote2 = await hasVoiceNote2Columns();
  const hasDetails = await hasDetailsColumn();

  const officeNumberSelect = hasOfficeNumber ? 'office_number' : 'NULL AS office_number';
  const alternateMobileSelect = hasAlternateMobile ? 'alternate_mobile' : 'NULL AS alternate_mobile';
  const visitingCard2Select = hasVisitingCard2 ? 'visiting_card_url_2' : 'NULL AS visiting_card_url_2';
  const voiceNote2Select = hasVoiceNote2 ? 'voice_note_url_2' : 'NULL AS voice_note_url_2';
  const detailsSelect = hasDetails ? 'details' : 'NULL AS details';

  let whereClauses = [];
  let params = [];

  // Base clauses
  whereClauses.push('status = 0');
  whereClauses.push('email IS NOT NULL');
  whereClauses.push("TRIM(email) != ''");

  if (fromDate) {
    whereClauses.push('created_at >= ?');
    params.push(`${fromDate} 00:00:00`);
  }
  if (toDate) {
    whereClauses.push('created_at <= ?');
    params.push(`${toDate} 23:59:59`);
  }
  if (department) {
    whereClauses.push('department = ?');
    params.push(department);
  }
  if (product) {
    whereClauses.push('JSON_CONTAINS(interests, JSON_ARRAY(?))');
    params.push(product);
  }
  if (category) {
    whereClauses.push('lead_category = ?');
    params.push(category);
  }
  if (venue) {
    whereClauses.push('venue_id = ?');
    params.push(venue);
  }

  if (search) {
    let searchClauses = [
      'full_name LIKE ?',
      'company_name LIKE ?',
      'job_title LIKE ?',
      'email LIKE ?',
      'mobile LIKE ?',
      'department LIKE ?',
      'CAST(interests AS CHAR) LIKE ?'
    ];
    let searchVal = `%${search}%`;
    let searchParams = [searchVal, searchVal, searchVal, searchVal, searchVal, searchVal, searchVal];

    if (hasAlternateMobile) {
      searchClauses.push('alternate_mobile LIKE ?');
      searchParams.push(searchVal);
    }
    if (hasOfficeNumber) {
      searchClauses.push('office_number LIKE ?');
      searchParams.push(searchVal);
    }
    if (hasDetails) {
      searchClauses.push('details LIKE ?');
      searchParams.push(searchVal);
    }

    whereClauses.push(`(${searchClauses.join(' OR ')})`);
    params = params.concat(searchParams);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const selectSql = `
    SELECT id, title, full_name, company_name, job_title, email, mobile, 
           ${alternateMobileSelect}, ${officeNumberSelect}, department, interests, 
           visiting_card_url, ${visitingCard2Select}, voice_note_url, ${voiceNote2Select}, 
           venue_id, referred_by, remarks, ${detailsSelect}, created_at, lead_category
    FROM enquiries
    WHERE id IN (
      SELECT MAX(id)
      FROM enquiries
      ${whereSql}
      GROUP BY email
    )
    ORDER BY created_at DESC
  `;

  // Count query for pagination
  const countSql = `
    SELECT COUNT(DISTINCT email) AS total
    FROM enquiries
    ${whereSql}
  `;

  // Fetch count
  const [countResult] = await pool.execute(countSql, params);
  const total = countResult[0]?.total || 0;

  // Fetch data with limit and offset interpolated directly to avoid binding type errors in mysql2
  const parsedLimit = isNaN(Number(limit)) ? 1000 : Number(limit);
  const parsedOffset = isNaN(Number(offset)) ? 0 : Number(offset);
  const dataSql = `${selectSql} LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;
  const [enquiries] = await pool.execute(dataSql, params);

  return {
    visitors: enquiries,
    total
  };
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

async function updateVisitingCard2(id, file) {
  await assertVisitingCard2Columns();

  const [existingRows] = await pool.execute(
    `SELECT visiting_card_id_2 FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  const card = await uploadVisitingCard(file);

  await pool.execute(
    `UPDATE enquiries SET visiting_card_id_2 = ?, visiting_card_url_2 = ? WHERE id = ?`,
    [card.id, card.url, id]
  );

  const previousCardId = existingRows[0].visiting_card_id_2;
  if (previousCardId) {
    await pool.execute(
      `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
      [previousCardId]
    );
  }

  return {
    message: 'Visiting card 2 updated successfully.',
    visitingCardUrl2: card.url
  };
}

async function removeVisitingCard2(id) {
  await assertVisitingCard2Columns();

  const [existingRows] = await pool.execute(
    `SELECT visiting_card_id_2 FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `UPDATE enquiries SET visiting_card_id_2 = NULL, visiting_card_url_2 = NULL WHERE id = ?`,
    [id]
  );

  const previousCardId = existingRows[0].visiting_card_id_2;
  if (previousCardId) {
    await pool.execute(
      `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
      [previousCardId]
    );
  }

  return {
    message: 'Visiting card 2 removed successfully.',
    visitingCardUrl2: null
  };
}

async function updateVoiceNote(id, file) {
  const [existingRows] = await pool.execute(
    `SELECT voice_note_id FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  const voiceNoteUrl = `/uploads/voicenote/${file.filename}`;
  const [result] = await pool.execute(
    `INSERT INTO voice_notes (filename, url, file_size, mime_type, status)
     VALUES (?, ?, ?, ?, ?)`,
    [file.filename, voiceNoteUrl, file.size, file.mimetype, 0]
  );

  await pool.execute(
    `UPDATE enquiries SET voice_note_id = ?, voice_note_url = ? WHERE id = ?`,
    [result.insertId, voiceNoteUrl, id]
  );

  const previousVoiceNoteId = existingRows[0].voice_note_id;
  if (previousVoiceNoteId) {
    await pool.execute(
      `UPDATE voice_notes SET status = 1 WHERE id = ?`,
      [previousVoiceNoteId]
    );
  }

  return {
    message: 'Voice note updated successfully.',
    voiceNoteUrl
  };
}

async function removeVoiceNote(id) {
  const [existingRows] = await pool.execute(
    `SELECT voice_note_id FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `UPDATE enquiries SET voice_note_id = NULL, voice_note_url = NULL WHERE id = ?`,
    [id]
  );

  const previousVoiceNoteId = existingRows[0].voice_note_id;
  if (previousVoiceNoteId) {
    await pool.execute(
      `UPDATE voice_notes SET status = 1 WHERE id = ?`,
      [previousVoiceNoteId]
    );
  }

  return {
    message: 'Voice note removed successfully.',
    voiceNoteUrl: null
  };
}

async function updateVoiceNote2(id, file) {
  await assertVoiceNote2Columns();

  const [existingRows] = await pool.execute(
    `SELECT voice_note_id_2 FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  const voiceNoteUrl2 = `/uploads/voicenote/${file.filename}`;
  const [result] = await pool.execute(
    `INSERT INTO voice_notes (filename, url, file_size, mime_type, status)
     VALUES (?, ?, ?, ?, ?)`,
    [file.filename, voiceNoteUrl2, file.size, file.mimetype, 0]
  );

  await pool.execute(
    `UPDATE enquiries SET voice_note_id_2 = ?, voice_note_url_2 = ? WHERE id = ?`,
    [result.insertId, voiceNoteUrl2, id]
  );

  const previousVoiceNoteId2 = existingRows[0].voice_note_id_2;
  if (previousVoiceNoteId2) {
    await pool.execute(
      `UPDATE voice_notes SET status = 1 WHERE id = ?`,
      [previousVoiceNoteId2]
    );
  }

  return {
    message: 'Voice note 2 updated successfully.',
    voiceNoteUrl2
  };
}

async function removeVoiceNote2(id) {
  await assertVoiceNote2Columns();

  const [existingRows] = await pool.execute(
    `SELECT voice_note_id_2 FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Visitor not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `UPDATE enquiries SET voice_note_id_2 = NULL, voice_note_url_2 = NULL WHERE id = ?`,
    [id]
  );

  const previousVoiceNoteId2 = existingRows[0].voice_note_id_2;
  if (previousVoiceNoteId2) {
    await pool.execute(
      `UPDATE voice_notes SET status = 1 WHERE id = ?`,
      [previousVoiceNoteId2]
    );
  }

  return {
    message: 'Voice note 2 removed successfully.',
    voiceNoteUrl2: null
  };
}

async function updateEnquiry(id, enquiry) {
  const hasOfficeNumber = await hasOfficeNumberColumn();
  const hasAlternateMobile = await hasAlternateMobileColumn();
  const hasDetails = await hasDetailsColumn();
  const officeNumberSet = hasOfficeNumber ? 'office_number = ?, ' : '';
  const alternateMobileSet = hasAlternateMobile ? 'alternate_mobile = ?, ' : '';
  const detailsSet = hasDetails ? 'details = ?, remarks = ?' : 'remarks = ?';
  const officeNumberValue = hasOfficeNumber ? [enquiry.office_number || ''] : [];
  const alternateMobileValue = hasAlternateMobile ? [enquiry.alternate_mobile || ''] : [];
  const detailsValue = hasDetails ? [enquiry.details || '', enquiry.remarks || ''] : [enquiry.remarks || ''];

  await pool.execute(
    `UPDATE enquiries
 SET full_name = ?, 
 company_name = ?, 
 email = ?, 
 mobile = ?, 
 ${alternateMobileSet}
 ${officeNumberSet}
 department = ?, 
 interests = CAST(? AS JSON), 
 lead_category = ?, 
 venue_id = ?, 
 referred_by = ?,
 ${detailsSet}
 WHERE id = ?`,
    [
      enquiry.full_name,
      enquiry.company_name || '',
      enquiry.email,
      enquiry.mobile,
      ...alternateMobileValue,
      ...officeNumberValue,
      enquiry.department || '',
      JSON.stringify(enquiry.interests || []),
      enquiry.lead_category || '',
      enquiry.venue_id || '',
      enquiry.referred_by || '',
      ...detailsValue,
      id
    ]
  );

  return { message: 'Visitor updated successfully.' };
}

async function getEnquiryById(id) {
  const [rows] = await pool.execute(
    `SELECT id, department, lead_category FROM enquiries WHERE id = ? AND status = 0`,
    [id]
  );
  return rows[0] || null;
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

async function bulkImportEnquiries(enquiries, options = {}) {
  const skipDuplicates = options.skipDuplicates !== false;
  
  const hasOfficeNumber = await hasOfficeNumberColumn();
  const hasAlternateMobile = await hasAlternateMobileColumn();
  const hasDetails = await hasDetailsColumn();

  // Fetch existing records for duplicate check
  const [existingRows] = await pool.execute('SELECT email, mobile FROM enquiries WHERE status = 0');
  const existingEmails = new Set(existingRows.map(r => String(r.email || '').trim().toLowerCase()));
  const existingMobiles = new Set(existingRows.map(r => String(r.mobile || '').trim()));

  const results = {
    total: enquiries.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (let i = 0; i < enquiries.length; i++) {
      const row = enquiries[i];
      const rowNum = i + 1;

      // Basic backend presence checks
      const fullName = row.full_name || row.fullName;
      const email = String(row.email || '').trim();
      const mobile = String(row.mobile || '').trim();

      if (!fullName) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Full name is required.`);
        continue;
      }
      if (!email) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Email is required.`);
        continue;
      }
      if (!mobile) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Mobile is required.`);
        continue;
      }

      // Check duplicates
      const isEmailDup = existingEmails.has(email.toLowerCase());
      const isMobileDup = existingMobiles.has(mobile);

      if (isEmailDup || isMobileDup) {
        if (skipDuplicates) {
          results.skipped++;
          continue;
        }
      }

      // Parse interests
      let interests = [];
      if (row.interests) {
        if (Array.isArray(row.interests)) {
          interests = row.interests;
        } else if (typeof row.interests === 'string') {
          interests = row.interests.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      const columns = [
        'title',
        'full_name',
        'company_name',
        'job_title',
        'email',
        'mobile',
        ...(hasAlternateMobile ? ['alternate_mobile'] : []),
        ...(hasOfficeNumber ? ['office_number'] : []),
        'department',
        'interests',
        'venue_id',
        'referred_by',
        'remarks',
        ...(hasDetails ? ['details'] : []),
        'lead_category'
      ];

      const values = [
        row.title || 'Mr',
        fullName.trim(),
        row.company_name || row.companyName || '',
        row.job_title || row.jobTitle || '',
        email,
        mobile,
        ...(hasAlternateMobile ? [row.alternate_mobile || row.alternateMobile || ''] : []),
        ...(hasOfficeNumber ? [row.office_number || row.officeNumber || ''] : []),
        row.department || '',
        JSON.stringify(interests),
        row.venue_id || row.venueId || '',
        row.referred_by || row.referredBy || '',
        row.remarks || '',
        ...(hasDetails ? [row.details || ''] : []),
        row.lead_category || row.leadCategory || ''
      ];

      const placeholders = columns.map(column => column === 'interests' ? 'CAST(? AS JSON)' : '?').join(', ');

      await connection.execute(
        `INSERT INTO enquiries (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      // Track duplicate sets to avoid duplicates within same uploaded Excel
      existingEmails.add(email.toLowerCase());
      existingMobiles.add(mobile);
      results.imported++;
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return results;
}

module.exports = {
  uploadVisitingCard,
  createEnquiry,
  getEnquiries,
  getFilteredEnquiries,
  updateLeadCategory,
  updateVisitingCard,
  removeVisitingCard,
  updateVisitingCard2,
  removeVisitingCard2,
  updateVoiceNote,
  removeVoiceNote,
  updateVoiceNote2,
  removeVoiceNote2,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryById,
  bulkImportEnquiries
};

