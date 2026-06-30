const router = require('express').Router();
const { pool } = require('../config/db');

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const totalUsers = Number(rows[0]?.totalUsers || 0);

    res.json({
      totalUsers,
      revenue: 128450,
      orders: 1093,
      activeSessions: 237,
      changes: {
        totalUsers: +12.4,
        revenue: +8.1,
        orders: -3.2,
        activeSessions: +5.7,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
