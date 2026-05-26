const { pool } = require('../backend/config/db');

async function updateSidebar() {
  try {
    console.log('Checking for existing section...');
    const [sections] = await pool.execute(
      `SELECT id FROM sidebar_sections WHERE name = 'Roles and Permissions'`
    );
    
    let sectionId;
    
    if (sections.length > 0) {
      sectionId = sections[0].id;
      console.log('Section already exists with ID:', sectionId);
    } else {
      const [maxRows] = await pool.execute(`SELECT MAX(sort_order) as max_sort FROM sidebar_sections`);
      const nextSortOrder = (maxRows[0].max_sort || 0) + 1;
      
      console.log('Creating new section with sort order:', nextSortOrder);
      const [result] = await pool.execute(
        `INSERT INTO sidebar_sections (name, sort_order, is_active) VALUES ('Roles and Permissions', ?, 1)`,
        [nextSortOrder]
      );
      sectionId = result.insertId;
      console.log('Created section with ID:', sectionId);
    }
    
    console.log('Moving Roles item to new section...');
    const [updateResult] = await pool.execute(
      `UPDATE sidebar_items SET section_id = ? WHERE name = 'Roles'`,
      [sectionId]
    );
    
    console.log('Rows affected:', updateResult.affectedRows);
    console.log('✓ Successfully moved Roles to "Roles and Permissions" category.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }
}

updateSidebar();
