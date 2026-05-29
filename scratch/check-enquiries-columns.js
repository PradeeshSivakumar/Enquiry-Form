const { pool } = require('../backend/config/db');

async function main() {
  const [columns] = await pool.query('SHOW COLUMNS FROM enquiries');
  console.log('Columns in enquiries:');
  console.log(columns.map(c => `${c.Field}: ${c.Type} (Null: ${c.Null}, Default: ${c.Default})`).join('\n'));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
