const { pool } = require('../config/db');

async function main() {
  const [columns] = await pool.query('SHOW COLUMNS FROM sidebar_items');
  const hasModuleKey = columns.some(c => c.Field === 'module_key');
  console.log('Current columns in sidebar_items:', columns.map(c => c.Field));
  console.log('Has module_key:', hasModuleKey);
  
  if (!hasModuleKey) {
    console.log('Altering table sidebar_items to add module_key...');
    // We add the column module_key
    await pool.query('ALTER TABLE sidebar_items ADD COLUMN module_key VARCHAR(60) NOT NULL DEFAULT "dashboard"');
    console.log('Altered successfully.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
