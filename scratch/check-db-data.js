const { pool } = require('../backend/config/db');

async function main() {
  const [departments] = await pool.query('SELECT name FROM departments WHERE is_deleted = 0');
  const [categories] = await pool.query('SELECT name FROM lead_categories WHERE is_deleted = 0');
  console.log('Active Departments:', departments.map(d => d.name));
  console.log('Active Lead Categories:', categories.map(c => c.name));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
