const roleRepository = require('../repositories/roleRepository');
const permissionRepository = require('../repositories/permissionRepository');

async function listRoles(req, res, next) {
  try {
    const roles = await roleRepository.listRoles();
    return res.json(roles);
  } catch (error) {
    return next(error);
  }
}

async function listPermissions(req, res, next) {
  try {
    const permissions = await permissionRepository.listPermissions();
    return res.json(permissions);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listRoles,
  listPermissions,
};
