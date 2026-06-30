const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');

async function listUsers() {
  return userRepository.listAll();
}

async function assignRole({ userId, roleName }) {
  const role = await roleRepository.findRoleByName(roleName);
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  await roleRepository.assignRole(userId, role.id);
  return {
    userId,
    role: role.name,
  };
}

module.exports = {
  listUsers,
  assignRole,
};
