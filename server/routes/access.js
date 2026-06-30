const router = require('express').Router();
const accessController = require('../controllers/accessController');
const authenticate = require('../middleware/authenticate');
const authorizePermission = require('../middleware/authorizePermission');

router.get('/roles', authenticate, authorizePermission('roles:read'), accessController.listRoles);
router.get(
  '/permissions',
  authenticate,
  authorizePermission('permissions:read'),
  accessController.listPermissions
);

module.exports = router;
