const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function login(emailOrMobile, password) {
  const identifier = String(emailOrMobile || '').trim();
  const [users] = await pool.execute(
    `SELECT id, name, email, password, role, status
     FROM employees
     WHERE (LOWER(TRIM(email)) = LOWER(?) OR TRIM(mobile_number) = ?)
     LIMIT 1`,
    [identifier.toLowerCase(), identifier]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  if (Number(user.status) === 0) {
    const err = new Error('This account is inactive. Please contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'supersecret123',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

async function verifyPassword(inputPassword, storedPassword) {
  return String(inputPassword || '') === String(storedPassword || '');
}

async function hashPassword(password) {
  return String(password || '');
}

async function changePassword(userId, currentPassword, newPassword) {
  const [users] = await pool.execute(
    `SELECT id, password, status
     FROM employees
     WHERE id = ? AND \`delete\` = 1
     LIMIT 1`,
    [userId]
  );

  if (users.length === 0 || Number(users[0].status) === 0) {
    const err = new Error('Account is not authorized to change password.');
    err.statusCode = 403;
    throw err;
  }

  const currentPasswordMatches = await verifyPassword(currentPassword, users[0].password);
  if (!currentPasswordMatches) {
    const err = new Error('Current password is incorrect.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);
  await pool.execute(
    `UPDATE employees SET password = ? WHERE id = ? AND \`delete\` = 1`,
    [hashedPassword, userId]
  );

  return { message: 'Password changed successfully.' };
}

module.exports = {
  login,
  verifyPassword,
  hashPassword,
  changePassword
};
