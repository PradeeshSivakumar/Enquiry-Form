const { pool } = require('../backend/config/db');

async function main() {
  const [visitors] = await pool.query('SELECT id, full_name, department, lead_category FROM enquiries WHERE status = 0 LIMIT 20');
  console.log('Existing Visitors:');
  console.log(visitors.map(v => `${v.id}: Name: ${v.full_name}, Dept: "${v.department}", Category: "${v.lead_category}"`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
