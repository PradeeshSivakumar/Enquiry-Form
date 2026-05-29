const { pool } = require('../backend/config/db');

async function main() {
  const [visitors] = await pool.query('SELECT id, full_name, department, lead_category FROM enquiries WHERE status = 0 LIMIT 20');
  console.log('Existing Visitors Actual Types:');
  visitors.forEach(v => {
    console.log(`${v.id}: Name: ${v.full_name}, Dept: ${v.department} (${typeof v.department}), Category: ${v.lead_category} (${typeof v.lead_category})`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
