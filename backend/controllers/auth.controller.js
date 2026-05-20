const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await authService.login(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    res.json(await authService.changePassword(req.user.id, currentPassword, newPassword));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  changePassword
};
