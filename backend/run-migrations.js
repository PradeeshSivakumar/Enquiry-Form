const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let successCount = 0;
    let skipCount = 0;

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await pool.execute(sql);
        console.log(`✓ Migration completed: ${file}`);
        successCount++;
      } catch (error) {
        // Skip migrations that fail due to duplicate columns/tables
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⊘ Migration skipped (already exists): ${file}`);
          skipCount++;
        } else {
          console.error(`✗ Migration failed: ${file}`);
          console.error(`  Error: ${error.message}`);
          // Continue with other migrations
        }
      }
    }

    console.log(`\nMigration summary:`);
    console.log(`  - Completed: ${successCount}`);
    console.log(`  - Skipped: ${skipCount}`);
    console.log(`  - Total: ${migrationFiles.length}`);
    console.log('Migrations finished!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
