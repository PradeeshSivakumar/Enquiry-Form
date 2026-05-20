function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (!userRole || !allowedRoles.some((role) => role.toLowerCase() === String(userRole).toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to perform this action.' });
    }

    next();
  };
}

module.exports = authorizeRoles;
