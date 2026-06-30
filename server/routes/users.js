const router = require('express').Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorizePermission = require('../middleware/authorizePermission');

router.get('/', authenticate, authorizePermission('users:read'), userController.listUsers);
router.patch(
  '/:id/roles',
  authenticate,
  authorizePermission('users:assign-role'),
  userController.assignRole
);

module.exports = router;
