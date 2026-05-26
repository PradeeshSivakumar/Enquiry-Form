const { pool } = require('../config/db');

async function getRoles({ search = '' }) {
  let query = `
    SELECT r.id, r.role_id, r.name, r.description, r.is_active, r.is_deleted, r.created_at, r.updated_at
    FROM roles r
    WHERE r.is_deleted = 0
  `;
  const params = [];

  if (search) {
    query += ` AND (r.name LIKE ? OR r.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY r.name ASC`;
  const [roles] = await pool.execute(query, params);
  return roles;
}

async function getActiveRoles() {
  const [roles] = await pool.execute(
    `SELECT id, name FROM roles WHERE is_active = 1 AND is_deleted = 0 ORDER BY name ASC`
  );
  return roles;
}

async function createRole(role) {
  const [duplicateRows] = await pool.execute(
    `SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [role.name]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Role name already exists.');
    err.statusCode = 400;
    throw err;
  }

  const roleId = await getNextRoleId();

  try {
    const [result] = await pool.execute(
      `INSERT INTO roles (role_id, name, description) VALUES (?, ?, ?)`,
      [roleId, role.name, role.description || null]
    );

    return {
      id: result.insertId,
      role_id: roleId,
      message: 'Role added successfully.'
    };
  } catch (err) {
    // Handle unique constraint race or duplicate insertion attempts
    if (err && err.code === 'ER_DUP_ENTRY') {
      const e = new Error('Role name already exists.');
      e.statusCode = 400;
      throw e;
    }
    throw err;
  }
}

async function updateRole(id, role) {
  const [existingRows] = await pool.execute(
    `SELECT id FROM roles WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND id <> ? AND is_deleted = 0 LIMIT 1`,
    [role.name, id]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Role name already exists.');
    err.statusCode = 400;
    throw err;
  }

  await pool.execute(
    `UPDATE roles SET name = ?, description = ? WHERE id = ? AND is_deleted = 0`,
    [role.name, role.description || null, id]
  );

  return { message: 'Role updated successfully.' };
}

async function deleteRole(id) {
  // Check if role is Admin (id=1 usually, but let's check name)
  const [roles] = await pool.execute(`SELECT name FROM roles WHERE id = ?`, [id]);
  if (roles.length > 0 && roles[0].name.toLowerCase() === 'admin') {
    const err = new Error('Cannot delete the Admin role.');
    err.statusCode = 403;
    throw err;
  }

  const [result] = await pool.execute(
    `UPDATE roles SET is_deleted = 1, is_active = 0 WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }

  return { message: 'Role deleted successfully.' };
}

async function toggleRoleStatus(id) {
  const [roles] = await pool.execute(`SELECT name, is_active FROM roles WHERE id = ? AND is_deleted = 0`, [id]);
  
  if (roles.length === 0) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }

  if (roles[0].name.toLowerCase() === 'admin') {
    const err = new Error('Cannot deactivate the Admin role.');
    err.statusCode = 403;
    throw err;
  }

  const newStatus = roles[0].is_active ? 0 : 1;
  await pool.execute(`UPDATE roles SET is_active = ? WHERE id = ?`, [newStatus, id]);

  return { message: `Role ${newStatus ? 'activated' : 'deactivated'} successfully.` };
}

async function getRolePermissions(roleId) {
  // Check if role is Admin
  const [roleRow] = await pool.execute(`SELECT name FROM roles WHERE id = ?`, [roleId]);
  const isAdmin = roleRow.length > 0 && roleRow[0].name.toLowerCase() === 'admin';

  // Load active pages from the section bars (sidebar_items)
  const [pages] = await pool.execute(`SELECT id, name, module_key FROM sidebar_items WHERE is_active = 1 ORDER BY sort_order ASC`);
  const [permissions] = await pool.execute(`SELECT * FROM role_permissions WHERE role_id = ?`, [roleId]);

  return pages.map(page => {
    const perm = permissions.find(p => p.module_name === page.name) || {};
    return {
      module_id: page.id,
      module_name: page.name,
      module_key: page.module_key,
      can_view: isAdmin ? true : !!perm.can_view,
      can_add: isAdmin ? true : !!perm.can_add,
      can_edit: isAdmin ? true : !!perm.can_edit,
      can_delete: isAdmin ? true : !!perm.can_delete,
      can_export: isAdmin ? true : !!perm.can_export,
      can_view_details: isAdmin ? true : !!perm.can_view_details,
      can_manage_permissions: isAdmin ? true : !!perm.can_manage_permissions
    };
  });
}

async function saveRolePermissions(roleId, permissions) {
  // permissions is an array of { module_name, can_view, can_add, can_edit, can_delete, can_export, can_view_details, can_manage_permissions }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Delete existing permissions for this role
    await connection.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);

    if (permissions && permissions.length > 0) {
      const values = [];
      const placeholders = [];
      
      for (const p of permissions) {
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?)');
        values.push(
          roleId,
          p.module_name, // Store actual page name string!
          p.can_view ? 1 : 0,
          p.can_add ? 1 : 0,
          p.can_edit ? 1 : 0,
          p.can_delete ? 1 : 0,
          p.can_export ? 1 : 0,
          p.can_view_details ? 1 : 0,
          p.can_manage_permissions ? 1 : 0
        );
      }

      await connection.execute(
        `INSERT INTO role_permissions (role_id, module_name, can_view, can_add, can_edit, can_delete, can_export, can_view_details, can_manage_permissions) VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    await connection.commit();
    return { message: 'Permissions saved successfully.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getModules() {
  const [pages] = await pool.execute(`SELECT id, name, module_key, sort_order, is_active FROM sidebar_items WHERE is_active = 1 ORDER BY sort_order ASC`);
  return pages.map(page => ({
    id: page.id,
    name: page.name,
    module_key: page.module_key,
    sidebar_item_id: page.id,
    sort_order: page.sort_order,
    is_active: page.is_active
  }));
}

async function getNextRoleId() {
  const [rows] = await pool.execute(
    `SELECT role_id FROM roles ORDER BY id DESC LIMIT 1`
  );

  if (rows.length === 0) {
    return 'ROL001';
  }

  const match = String(rows[0].role_id || '').match(/^ROL(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `ROL${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  getRoles,
  getActiveRoles,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  getRolePermissions,
  saveRolePermissions,
  getModules
};
