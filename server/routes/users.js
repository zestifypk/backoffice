const router = require('express').Router();

const users = [
  { id: 1, name: 'Alice Johnson',  email: 'alice@example.com',  role: 'Admin',   status: 'Active',   joined: '2024-01-15' },
  { id: 2, name: 'Bob Martinez',   email: 'bob@example.com',    role: 'Editor',  status: 'Active',   joined: '2024-02-20' },
  { id: 3, name: 'Carol White',    email: 'carol@example.com',  role: 'Viewer',  status: 'Inactive', joined: '2024-03-05' },
  { id: 4, name: 'David Kim',      email: 'david@example.com',  role: 'Editor',  status: 'Active',   joined: '2024-04-11' },
  { id: 5, name: 'Eva Chen',       email: 'eva@example.com',    role: 'Admin',   status: 'Active',   joined: '2024-05-22' },
  { id: 6, name: 'Frank Nguyen',   email: 'frank@example.com',  role: 'Viewer',  status: 'Inactive', joined: '2024-06-01' },
];

// GET /api/users
router.get('/', (req, res) => {
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
