const { pool } = require('../config/db');

async function getEmployees() {
  const [employees] = await pool.execute(
    `SELECT id, name, email, password, mobile_number, role, created_at, updated_at
     FROM employees
     WHERE status != 0
     ORDER BY created_at DESC`
  );

  return employees;
}

async function createEmployee(employee) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO employees (name, email, password, mobile_number, role,status) VALUES (?, ?, ?, ?, ?,1)`,
      [employee.name, employee.email, employee.password, employee.mobile_number, employee.role]
    );

    return { id: result.insertId, message: 'Employee added successfully.' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.message = 'Email already exists.';
      error.statusCode = 400;
    }
    throw error;
  }
}

async function updateEmployee(id, employee) {
  try {
    let query = `UPDATE employees SET name = ?, email = ?, mobile_number = ?, role = ? WHERE id = ?`;
    let params = [employee.name, employee.email, employee.mobile_number, employee.role, id];

    if (employee.password && employee.password.trim() !== '') {
      query = `UPDATE employees SET name = ?, email = ?, password = ?, mobile_number = ?, role = ? WHERE id = ?`;
      params = [employee.name, employee.email, employee.password, employee.mobile_number, employee.role, id];
    }

    await pool.execute(query, params);
    return { message: 'Employee updated successfully.' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.message = 'Email already exists.';
      error.statusCode = 400;
    }
    throw error;
  }
}

async function deleteEmployee(id) {
  await pool.execute(
    'UPDATE employees SET status = 0 WHERE id = ?',
    [id]
  );

  return { message: 'Employee status updated to inactive successfully.' };
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
