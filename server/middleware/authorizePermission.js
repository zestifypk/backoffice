function authorizePermission(permission) {
  return (req, res, next) => {
    const permissions = req.auth?.permissions || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden: missing permission' });
    }
    return next();
  };
}

module.exports = authorizePermission;
