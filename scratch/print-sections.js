const { pool } = require('../backend/config/db');

async function run() {
  try {
    const [sections] = await pool.execute('SELECT * FROM sidebar_sections');
    console.log('SECTIONS IN DB:', JSON.stringify(sections, null, 2));
    const [items] = await pool.execute('SELECT * FROM sidebar_items');
    console.log('ITEMS IN DB:', JSON.stringify(items, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

run();
