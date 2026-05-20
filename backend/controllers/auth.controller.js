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

module.exports = {
  login
};
