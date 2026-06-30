const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const permissionRepository = require('../repositories/permissionRepository');

function buildTokenPayload(user, roles, permissions) {
  return {
    sub: user.id,
    email: user.email,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };
}

async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error('Email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name,
    email,
    passwordHash,
  });

  const userRole = await roleRepository.findRoleByName('user');
  if (userRole) {
    await roleRepository.assignRole(user.id, userRole.id);
  }

  return user;
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const roles = await roleRepository.findRolesByUserId(user.id);
  const permissions = await permissionRepository.findPermissionsByUserId(user.id);

  const tokenPayload = buildTokenPayload(user, roles, permissions);
  const token = jwt.sign(tokenPayload, getEnv('JWT_SECRET', 'dev-secret-change-me'), {
    expiresIn: getEnv('JWT_EXPIRES_IN', '1h'),
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      status: user.status,
      roles: tokenPayload.roles,
      permissions: tokenPayload.permissions,
    },
  };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const roles = await roleRepository.findRolesByUserId(userId);
  const permissions = await permissionRepository.findPermissionsByUserId(userId);

  return {
    ...user,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
