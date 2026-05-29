const { pool } = require('../backend/config/db');

async function main() {
  const [rows] = await pool.query('SELECT full_name, department FROM enquiries WHERE id = 239');
  console.log('Visitor 239 details in database:', rows[0]);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
