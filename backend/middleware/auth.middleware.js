const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && String(authHeader).split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret123', (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
