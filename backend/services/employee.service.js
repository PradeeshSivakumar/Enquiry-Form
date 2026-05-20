const { hashPassword } = require('./auth.service');
const { pool } = require('../config/db');

async function getEmployees() {
  const [employees] = await pool.execute(
    `SELECT id, name, email, mobile_number, role, status, \`delete\`, created_at, updated_at
     FROM employees
     WHERE \`delete\` = 1
     ORDER BY created_at DESC`
  );

  return employees;
}

async function createEmployee(employee) {
  try {
    const status = Number(employee.status) === 0 ? 0 : 1;
    const hashedPassword = await hashPassword(employee.password);
    const [result] = await pool.execute(
      `INSERT INTO employees (name, email, password, mobile_number, role, status, \`delete\`) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [employee.name, employee.email, hashedPassword, employee.mobile_number, employee.role, status]
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
    const status = Number(employee.status) === 0 ? 0 : 1;
    await pool.execute(
      `UPDATE employees SET name = ?, email = ?, mobile_number = ?, role = ?, status = ? WHERE id = ?`,
      [employee.name, employee.email, employee.mobile_number, employee.role, status, id]
    );
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
    'UPDATE employees SET `delete` = 0 WHERE id = ?',
    [id]
  );

  return { message: 'Employee deleted successfully.' };
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
