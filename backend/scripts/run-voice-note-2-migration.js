const { pool } = require('../config/db');

const migrationSql = `ALTER TABLE enquiries
  ADD COLUMN voice_note_id_2 INT NULL AFTER voice_note_url,
  ADD COLUMN voice_note_url_2 VARCHAR(500) NULL AFTER voice_note_id_2`;

async function run() {
  try {
    await pool.execute(migrationSql);
    console.log('Migration applied successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'enquiries'
       AND COLUMN_NAME IN ('voice_note_id_2', 'voice_note_url_2')`
  );

  console.log('Columns present:', rows.map((row) => row.COLUMN_NAME).join(', ') || 'none');
  process.exit(0);
}

run();
