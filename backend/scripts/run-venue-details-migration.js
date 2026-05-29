const { pool } = require('../config/db');

async function run() {
  try {
    // 1. Create venue_details table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venue_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venue_master_id INT NOT NULL UNIQUE,
        venue VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        year VARCHAR(50) NOT NULL,
        FOREIGN KEY (venue_master_id) REFERENCES venue_master(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ venue_details table created or already exists.');

    // 2. Fetch all existing venues from venue_master
    const [venueRows] = await pool.query('SELECT id, venue FROM venue_master');
    console.log(`Found ${venueRows.length} existing venues in venue_master.`);

    // Helper to split venue parts
    function splitVenueParts(venueStr) {
      if (!venueStr) return { venueName: '', city: '', year: '' };
      const parts = venueStr.split('-');
      if (parts.length >= 3) {
        const year = (parts[parts.length - 1] || '').trim();
        const city = (parts[parts.length - 2] || '').trim();
        const venueName = parts.slice(0, parts.length - 2).join('-').trim();
        return { venueName, city, year };
      }
      return { venueName: (venueStr || '').trim(), city: '', year: '' };
    }

    let insertedCount = 0;
    for (const row of venueRows) {
      // Check if already exists in venue_details
      const [existing] = await pool.query('SELECT id FROM venue_details WHERE venue_master_id = ?', [row.id]);
      if (existing.length === 0) {
        const { venueName, city, year } = splitVenueParts(row.venue);
        await pool.query(
          'INSERT INTO venue_details (venue_master_id, venue, city, year) VALUES (?, ?, ?, ?)',
          [row.id, venueName || '', city || '', year || '']
        );
        insertedCount++;
      }
    }
    console.log(`✓ Processed existing venues: inserted ${insertedCount} detail records.`);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
