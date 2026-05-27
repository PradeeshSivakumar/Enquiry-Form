const { pool } = require('../config/db');

const migrationSqls = [
  "ALTER TABLE campaigns ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Sent'",
  "ALTER TABLE campaigns ADD COLUMN scheduled_at TIMESTAMP NULL DEFAULT NULL",
  "ALTER TABLE campaigns ADD COLUMN timezone VARCHAR(50) NULL DEFAULT 'IST'",
  "ALTER TABLE campaigns ADD COLUMN recipient_ids TEXT NULL",
  "ALTER TABLE campaigns ADD COLUMN trigger_type VARCHAR(50) NOT NULL DEFAULT 'scheduled'",
  "ALTER TABLE campaigns ADD COLUMN next_execution TIMESTAMP NULL DEFAULT NULL",
  "ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
];

async function run() {
  for (const sql of migrationSqls) {
    try {
      await pool.execute(sql);
      console.log(`Applied: ${sql}`);
    } catch (error) {
      if (error.code === 'ER_DUP_COLUMNNAME') {
        console.log(`Column already exists for query: ${sql}`);
      } else {
        console.error(`Migration step failed for query [${sql}]:`, error.message);
      }
    }
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'campaigns'
       AND COLUMN_NAME IN ('status', 'scheduled_at', 'timezone', 'recipient_ids', 'trigger_type', 'next_execution', 'updated_at')`
  );

  console.log('Columns present:', rows.map((row) => row.COLUMN_NAME).join(', ') || 'none');
  process.exit(0);
}

run();
