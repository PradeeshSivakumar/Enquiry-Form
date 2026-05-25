const { pool } = require('../config/db');

const createSectionsTableSql = `
CREATE TABLE IF NOT EXISTS sidebar_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createItemsTableSql = `
CREATE TABLE IF NOT EXISTS sidebar_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  route VARCHAR(255) NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sidebar_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const seedSectionsSql = `
INSERT INTO sidebar_sections (id, name, sort_order, is_active) VALUES
(1, 'Dashboard', 1, 1),
(2, 'Services', 2, 1),
(3, 'Master', 3, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), sort_order=VALUES(sort_order), is_active=VALUES(is_active);
`;

const seedItemsSql = `
INSERT INTO sidebar_items (id, section_id, name, route, icon, sort_order, is_active) VALUES
(1, 1, 'Dashboard', '/dashboard', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" /></svg>', 1, 1),
(2, 2, 'Visitors Directory', '/visitors-directory', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>', 1, 1),
(3, 3, 'Employees', '/employee', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>', 1, 1),
(4, 3, 'Departments', '/departments', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h8m-8 6h16" /></svg>', 2, 1),
(5, 3, 'Products', '/products', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" /><path stroke-linecap="round" stroke-linejoin="round" d="M3.29 7L12 12l8.71-5M12 22V12" /></svg>', 3, 1),
(6, 3, 'Venues', '/venue', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>', 4, 1),
(7, 3, 'Lead Categories', '/lead-categories', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>', 5, 1)
ON DUPLICATE KEY UPDATE section_id=VALUES(section_id), name=VALUES(name), route=VALUES(route), icon=VALUES(icon), sort_order=VALUES(sort_order), is_active=VALUES(is_active);
`;

async function run() {
  try {
    console.log('Starting sidebar navigation migration...');

    console.log('Creating sidebar_sections table...');
    await pool.execute(createSectionsTableSql);

    console.log('Creating sidebar_items table...');
    await pool.execute(createItemsTableSql);

    console.log('Seeding sidebar_sections...');
    await pool.execute(seedSectionsSql);

    console.log('Seeding sidebar_items...');
    await pool.execute(seedItemsSql);

    console.log('✓ Sidebar navigation migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
