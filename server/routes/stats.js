const router = require('express').Router();

// GET /api/stats
router.get('/', (req, res) => {
  res.json({
    totalUsers: 4821,
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
});

module.exports = router;
