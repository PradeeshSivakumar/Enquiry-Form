const { pool } = require('../config/db');

async function getActiveDepartments() {
  const [departments] = await pool.execute(
    `SELECT id, department_id, name, description, created_at, updated_at
     FROM departments
     WHERE is_deleted = 0
     ORDER BY name ASC`
  );

  return departments;
}

async function getDepartments({ search = '' }) {
  const filters = ['is_deleted = 0'];
  const params = [];

  if (search) {
    const likeSearch = `%${search}%`;
    filters.push('(department_id LIKE ? OR name LIKE ? OR description LIKE ?)');
    params.push(likeSearch, likeSearch, likeSearch);
  }

  const [departments] = await pool.execute(
    `SELECT id, department_id, name, description, created_at, updated_at
     FROM departments
     WHERE ${filters.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return departments;
}

async function createDepartment(department) {
  console.log('Service: createDepartment called with:', department);

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [department.name]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Department name already exists.');
    err.statusCode = 400;
    throw err;
  }

  const departmentId = await getNextDepartmentId();
  console.log('Service: Generated department_id:', departmentId);

  const [result] = await pool.execute(
    `INSERT INTO departments (department_id, name, description)
     VALUES (?, ?, ?)`,
    [departmentId, department.name, department.description || '']
  );

  console.log('Service: Insert result:', result);

  return {
    id: result.insertId,
    department_id: departmentId,
    message: 'Department added successfully.'
  };
}

async function updateDepartment(id, department) {
  const [existingRows] = await pool.execute(
    `SELECT id FROM departments WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Department not found.');
    err.statusCode = 404;
    throw err;
  }

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id <> ? AND is_deleted = 0 LIMIT 1`,
    [department.name, id]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Department name already exists.');
    err.statusCode = 400;
    throw err;
  }

  await pool.execute(
    `UPDATE departments
     SET name = ?, description = ?
     WHERE id = ? AND is_deleted = 0`,
    [department.name, department.description || '', id]
  );

  return { message: 'Department updated successfully.' };
}

async function deleteDepartment(id) {
  const [result] = await pool.execute(
    `UPDATE departments SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Department not found.');
    err.statusCode = 404;
    throw err;
  }

  return { message: 'Department deleted successfully.' };
}

async function existsByName(name) {
  if (!name) {
    return false;
  }

  const [rows] = await pool.execute(
    `SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [name]
  );

  return rows.length > 0;
}

async function getNextDepartmentId() {
  const [rows] = await pool.execute(
    `SELECT department_id FROM departments ORDER BY id DESC LIMIT 1`
  );

  if (rows.length === 0) {
    return 'DEP001';
  }

  const match = String(rows[0].department_id || '').match(/^DEP(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `DEP${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  getActiveDepartments,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  existsByName
};
