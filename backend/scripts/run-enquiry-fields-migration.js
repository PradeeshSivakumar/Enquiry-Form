const { pool } = require('../config/db');

const migrationSql = `ALTER TABLE enquiries
  ADD COLUMN alternate_mobile VARCHAR(20) NULL AFTER mobile,
  ADD COLUMN visiting_card_id_2 INT NULL AFTER visiting_card_url,
  ADD COLUMN visiting_card_url_2 VARCHAR(500) NULL AFTER visiting_card_id_2,
  ADD COLUMN details TEXT NULL AFTER remarks`;

async function run() {
  try {
    await pool.execute(migrationSql);
    console.log('Migration applied successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('One or more columns already exist.');
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
       AND COLUMN_NAME IN ('alternate_mobile', 'visiting_card_id_2', 'visiting_card_url_2', 'details')`
  );

  console.log('Columns present:', rows.map((row) => row.COLUMN_NAME).join(', ') || 'none');
  process.exit(0);
}

run();
