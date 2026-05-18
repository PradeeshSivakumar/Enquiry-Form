const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

dotenv.config({
  path: path.join(__dirname, '.env'),
  quiet: true
});

const app = express();
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'niralteksolutions@gmail.com',
    pass: 'toor qnnv zyqi ozzj'
  }
});
const port = Number(process.env.PORT);
const uploadDir = path.join(__dirname, '..', 'uploads');
const visitingCardsDir = path.join(uploadDir, 'visiting-cards');
const voiceNotesDir = path.join(uploadDir, 'voicenote');

fs.mkdirSync(visitingCardsDir, { recursive: true });
fs.mkdirSync(voiceNotesDir, { recursive: true });

const sslCertPath = path.join(__dirname, 'cert', 'Sem-demo.crt');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  queueLimit: 0,
 ssl: {
  rejectUnauthorized: false
}
});

pool.getConnection()
  .then(async (connection) => {
    console.log('Database connected successfully.');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('Query Result:', rows[0].result);
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('MySQL connection error:', err);
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'supersecret123', (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (file.fieldname === 'voiceNote') {
      callback(null, voiceNotesDir);
    } else {
      callback(null, visitingCardsDir);
    }
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    callback(null, `${Date.now()}-${baseName || file.fieldname}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === 'visitingCard' && !file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed for visiting cards.'));
      return;
    }
    if (file.fieldname === 'voiceNote' && !file.mimetype.startsWith('audio/') && !file.mimetype.startsWith('video/webm')) {
      callback(new Error('Only audio files are allowed for voice notes.'));
      return;
    }
    callback(null, true);
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api', (_req, res) => {
  res.json({
    message: 'NiralTek Enquiry Form API Server',
    version: '1.0.0',
    status: 'running',
    documentation: 'Visit /api for endpoint documentation'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Query employee by email (status check removed because column doesn't exist in user DB)
    const [users] = await pool.execute('SELECT * FROM employees WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'supersecret123',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/enquiries/visiting-card', upload.single('visitingCard'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Visiting card image is required.' });
      return;
    }

    const url = `/uploads/visiting-cards/${req.file.filename}`;

    const [result] = await pool.execute(
      `INSERT INTO visiting_cards (filename, url, file_size, mime_type, status)
       VALUES (?, ?, ?, ?, ?)`,
      [req.file.filename, url, req.file.size, req.file.mimetype, 0]
    );

    res.json({
      id: result.insertId,
      url,
      filename: req.file.filename,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/visiting-cards', async (req, res, next) => {
  try {
    const [cards] = await pool.execute(
      `SELECT id, filename, url, file_size, mime_type, uploaded_at FROM visiting_cards WHERE status = 0 ORDER BY uploaded_at DESC`
    );
    res.json(cards);
  } catch (error) {
    next(error);
  }
});

app.get('/api/visiting-cards/:id', async (req, res, next) => {
  try {
    const [cards] = await pool.execute(
      `SELECT id, filename, url, file_size, mime_type, uploaded_at FROM visiting_cards WHERE id = ? AND status = 0`,
      [req.params.id]
    );

    if (cards.length === 0) {
      res.status(404).json({ message: 'Visiting card not found.' });
      return;
    }

    res.json(cards[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/visiting-cards/:id', async (req, res, next) => {
  try {
    const [card] = await pool.execute(
      `SELECT filename FROM visiting_cards WHERE id = ?`,
      [req.params.id]
    );

    if (card.length === 0) {
      res.status(404).json({ message: 'Visiting card not found.' });
      return;
    }

    await pool.execute(
      `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Visiting card deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

app.post(
  '/api/enquiries',

  upload.fields([
    { name: 'visitingCard', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 }
  ]),

  async (req, res) => {

    try {

      const payload =
        normalizePayload(req.body);

      validatePayload(payload);

      let visitingCardId = null;
      let visitingCardUrl = null;

      let voiceNoteId = null;
      let voiceNoteUrl = null;



      // VISITING CARD
      if (
        req.files &&
        req.files['visitingCard'] &&
        req.files['visitingCard'][0]
      ) {

        const file =
          req.files['visitingCard'][0];

        const url =
          `/uploads/visiting-cards/${file.filename}`;

        const [result] =
          await pool.execute(

            `INSERT INTO visiting_cards
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
              url,
              file.size,
              file.mimetype,
              0
            ]
          );

        visitingCardId =
          result.insertId;

        visitingCardUrl = url;
      }



      // VOICE NOTE
      if (
        req.files &&
        req.files['voiceNote'] &&
        req.files['voiceNote'][0]
      ) {

        const file =
          req.files['voiceNote'][0];

        voiceNoteUrl =
          `/uploads/voicenote/${file.filename}`;

        const [result] =
          await pool.execute(

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

        voiceNoteId =
          result.insertId;
      }



      // ENQUIRY INSERT
      const [result] =
        await pool.execute(

          `INSERT INTO enquiries
          (
            title,
            full_name,
            company_name,
            job_title,
            email,
            mobile,
            department,
            interests,
            visiting_card_id,
            visiting_card_url,
            voice_note_id,
            voice_note_url,
            venue_id,
            remarks,
            lead_category
          )

          VALUES
          (
            ?, ?, ?, ?, ?, ?, ?,
            CAST(? AS JSON),
            ?, ?, ?, ?, ?, ?, ?
          )`,

          [
            payload.title,
            payload.fullName,
            payload.companyName,
            payload.jobTitle,
            payload.email,
            payload.mobile,
            payload.department,
            JSON.stringify(payload.interests),
            visitingCardId,
            visitingCardUrl,
            voiceNoteId,
            voiceNoteUrl,
            payload.venueId,
            payload.remarks,
            payload.leadCategory || 'Potential',
          ]
        );



      // SEND EMAIL
      try {

        await transporter.sendMail({

          from: 'niralteksolutions@gmail.com',

          to: payload.email,

          subject:
            'Thank You For Your Enquiry',

          html: `

            <div
              style="
                font-family: Arial, sans-serif;
                padding: 20px;
                background: #f8fafc;
              "
            >

              <div
                style="
                  max-width: 600px;
                  margin: auto;
                  background: white;
                  border-radius: 12px;
                  padding: 30px;
                  border: 1px solid #e2e8f0;
                "
              >

                <h2>
                  Thank You For Your Enquiry
                </h2>

                <p>
                  Dear ${payload.fullName},
                </p>

                <p>
                  Thank you for contacting
                  Niraltek Solutions.
                </p>

                <p>
                  We have successfully received
                  your enquiry and our team
                  will contact you shortly.
                </p>

              </div>

            </div>
          `
        });

        console.log(
          'Mail sent successfully'
        );

      }

      catch (mailError) {

        console.error(
          'MAIL ERROR:',
          mailError.message
        );
      }



      // SUCCESS RESPONSE
      res.status(201).json({

        success: true,

        payload: {

          ...payload,

          id: result.insertId,

          visitingCardId,

          createdAt:
            new Date().toISOString(),
        },
      });

    }

    catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message: error.message
      });
    }
  }
);


app.get('/api/enquiries', authenticateToken, async (_req, res, next) => {
  try {
    const [enquiries] = await pool.execute(
      `SELECT id, title, full_name, company_name, job_title, email, mobile, department, interests, visiting_card_url, voice_note_url, venue_id, remarks, created_at, lead_category
       FROM enquiries WHERE status = 0 ORDER BY created_at DESC`
    );
    res.json(enquiries);
  } catch (error) {
    next(error);
  }
});

app.put('/api/enquiries/:id/category', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!['Potential', 'Non Potential', 'Others'].includes(category)) {
      return res.status(400).json({ message: 'Invalid lead category.' });
    }

    await pool.execute(
      `UPDATE enquiries SET lead_category = ? WHERE id = ?`,
      [category, id]
    );

    res.json({ message: 'Lead category updated successfully.', category });
  } catch (error) {
    next(error);
  }
});

app.put('/api/enquiries/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, company_name, email, mobile, department, lead_category, venue_id } = req.body;

    await pool.execute(
      `UPDATE enquiries 
       SET full_name = ?, company_name = ?, email = ?, mobile = ?, department = ?, lead_category = ?, venue_id = ?
       WHERE id = ?`,
      [full_name, company_name || null, email, mobile, department || null, lead_category || 'Potential', venue_id || null, id]
    );

    res.json({ message: 'Visitor updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/enquiries/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE enquiries SET status = 1 WHERE id = ?', [id]);
    res.json({ message: 'Visitor deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/employees', authenticateToken, async (req, res, next) => {
  try {
    const [employees] = await pool.execute(
      `SELECT id, name, email, password, mobile_number, role, created_at, updated_at
       FROM employees
       WHERE status != 0
       ORDER BY created_at DESC`
    );

    res.json(employees);
  } catch (error) {
    next(error);
  }
});

app.post('/api/employees', authenticateToken, async (req, res, next) => {
  try {
    const { name, email, password, mobile_number, role } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO employees (name, email, password, mobile_number, role,status) VALUES (?, ?, ?, ?, ?,1)`,
      [name, email, password, mobile_number, role]
    );
    res.status(201).json({ id: result.insertId, message: 'Employee added successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    next(error);
  }
});

app.put('/api/employees/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, mobile_number, role } = req.body;

    let query = `UPDATE employees SET name = ?, email = ?, mobile_number = ?, role = ? WHERE id = ?`;
    let params = [name, email, mobile_number, role, id];

    if (password && password.trim() !== '') {
      query = `UPDATE employees SET name = ?, email = ?, password = ?, mobile_number = ?, role = ? WHERE id = ?`;
      params = [name, email, password, mobile_number, role, id];
    }

    await pool.execute(query, params);
    res.json({ message: 'Employee updated successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    next(error);
  }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE employees SET status = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Employee status updated to inactive successfully.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/venues', async (req, res, next) => {
  try {
    const [venues] = await pool.execute(
      `SELECT id, venue_id, venue, created_at, updated_at FROM venue_master ORDER BY created_at DESC`
    );
    res.json(venues);
  } catch (error) {
    next(error);
  }
});

app.post('/api/venues', authenticateToken, async (req, res, next) => {
  try {
    const { venue } = req.body;

    if (!venue) {
      return res.status(400).json({ message: 'Venue is required.' });
    }

    const [rows] = await pool.execute(`SELECT venue_id FROM venue_master ORDER BY id DESC LIMIT 1`);
    let nextNum = 1;
    if (rows.length > 0) {
      const lastId = rows[0].venue_id;
      const match = lastId.match(/^VEN(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const venue_id = `VEN${nextNum.toString().padStart(3, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO venue_master (venue_id, venue) VALUES (?, ?)`,
      [venue_id, venue]
    );
    res.status(201).json({ id: result.insertId, venue_id, message: 'Venue added successfully.' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/venues/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { venue } = req.body;

    if (!venue) {
      return res.status(400).json({ message: 'Venue is required.' });
    }

    await pool.execute(
      `UPDATE venue_master SET venue = ? WHERE id = ?`,
      [venue, id]
    );
    res.json({ message: 'Venue updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/venues/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Explicitly check if venue is used in enquiries to avoid relying on specific SQL error codes
    const [venueRows] = await pool.execute('SELECT venue_id FROM venue_master WHERE id = ?', [id]);
    if (venueRows.length === 0) {
      return res.status(404).json({ message: 'Venue not found.' });
    }

    const [enquiries] = await pool.execute('SELECT id FROM enquiries WHERE venue_id = ? LIMIT 1', [venueRows[0].venue_id]);
    if (enquiries.length > 0) {
      return res.status(400).json({ message: 'Cannot delete venue as it is being used in enquiries.' });
    }

    await pool.execute('UPDATE FROM venue_master WHERE id = ?', [id]);
    res.json({ message: 'Venue deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// Serve frontend in production (catch-all for Angular router)
const frontendDistPath = path.join(__dirname, '..', 'dist', 'niraltek-enquiry', 'browser');
if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    sql: error.sql,
  });

  if (error.code === 'ER_NO_REFERENCED_TABLE') {
    return res.status(500).json({
      message: 'Database schema error. Please ensure the visiting_cards table is created by running the updated schema.sql',
      code: error.code
    });
  }

  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      message: error.message,
      sql: error.sql,
      code: error.code
    });
  }

  res.status(500).json({
    message: error.message || 'Unable to save enquiry.',
    code: error.code
  });
});

app.listen(port, () => {
  console.log(`API server running at port ${port}`);
});

function normalizePayload(body) {
  return {
    title: emptyToNull(body.title),
    fullName: String(body.fullName || '').trim(),
    companyName: emptyToNull(body.companyName),
    jobTitle: emptyToNull(body.jobTitle),
    email: String(body.email || '').trim(),
    mobile: String(body.mobile || '').trim(),
    department: emptyToNull(body.department),
    interests: parseInterests(body.interests),
    remarks: emptyToNull(body.remarks),
    leadCategory: emptyToNull(body.leadCategory),
    venueId: emptyToNull(body.venueId ?? body.venue_id),
  };
}

function emptyToNull(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

function parseInterests(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validatePayload(payload) {
  if (!payload.fullName) {
    throw new Error('Full name is required.');
  }
  if (!payload.email) {
    throw new Error('Email is required.');
  }
  if (!payload.mobile) {
    throw new Error('Mobile is required.');
  }
  if (!payload.interests.length) {
    throw new Error('At least one product interest is required.');
  }
}
