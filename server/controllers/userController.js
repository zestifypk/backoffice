const userService = require('../services/userService');

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

async function assignRole(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { roleName } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({ error: 'user id and roleName are required' });
    }

    const result = await userService.assignRole({ userId, roleName });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  assignRole,
};
