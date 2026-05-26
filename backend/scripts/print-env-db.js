const { pool } = require('../config/db');

console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_PORT:', process.env.MYSQL_PORT);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);

async function main() {
  const [rows] = await pool.query('SELECT DATABASE() as db');
  console.log('Current Connected DB Name:', rows[0].db);
  
  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM sidebar_items');
    console.log('Columns in sidebar_items:', columns.map(c => c.Field));
  } catch (e) {
    console.error('Error fetching columns:', e.message);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
