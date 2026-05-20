const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function login(email, password) {
  const [users] = await pool.execute(
    `SELECT id, name, email, password, role, status
     FROM employees
     WHERE LOWER(TRIM(email)) = LOWER(?)
     LIMIT 1`,
    [email.toLowerCase()]
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
  const stored = String(storedPassword || '');

  if (!stored) {
    return false;
  }

  if (inputPassword === stored) {
    return true;
  }

  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(stored);
  if (!isBcryptHash) {
    return false;
  }

  try {
    return await bcrypt.compare(inputPassword, stored);
  } catch {
    return false;
  }
}

module.exports = {
  login
};
