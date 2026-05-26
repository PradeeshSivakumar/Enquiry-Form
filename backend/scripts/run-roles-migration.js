const { pool } = require('../config/db');

const seedRolesSql = `
INSERT INTO roles (id, role_id, name, description, is_active, is_deleted) VALUES
(1, 'ROL001', 'Admin', 'System Administrator with full access', 1, 0),
(2, 'ROL002', 'Manager', 'Manager with access to most modules', 1, 0),
(3, 'ROL003', 'Employee', 'Regular employee access', 1, 0),
(4, 'ROL004', 'HR', 'Human Resources management', 1, 0),
(5, 'ROL005', 'Sales', 'Sales and lead management', 1, 0),
(6, 'ROL006', 'Visitor Manager', 'Manages visitors and venues', 1, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
`;

const seedSidebarRolesSql = `
INSERT INTO sidebar_items (id, section_id, name, route, icon, module_key, sort_order, is_active) VALUES
(9, 3, 'Role Master', '/roles', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 2C7.03 4.17 4 7.97 4 12.5c0 4.97 4.03 9.19 8 9.5 3.97-.31 8-4.53 8-9.5 0-4.53-3.03-8.33-8-10.5z" /></svg>', 'roles', 6, 1)
ON DUPLICATE KEY UPDATE section_id=VALUES(section_id), name=VALUES(name), route=VALUES(route), icon=VALUES(icon), module_key=VALUES(module_key), sort_order=VALUES(sort_order), is_active=VALUES(is_active);
`;

const seedAdminPermissionsSql = `
INSERT IGNORE INTO role_permissions (role_id, module_name, can_view, can_add, can_edit, can_delete, can_export, can_view_details, can_manage_permissions)
SELECT 1, name, 1, 1, 1, 1, 1, 1, 1 FROM sidebar_items;
`;

async function run() {
  try {
    console.log('Starting Roles RBAC migration/seed...');

    console.log('Seeding sidebar roles item...');
    await pool.execute(seedSidebarRolesSql);

    console.log('Seeding default roles...');
    await pool.execute(seedRolesSql);

    console.log('Seeding Admin permissions...');
    await pool.execute(seedAdminPermissionsSql);

    console.log('✓ Roles RBAC seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
