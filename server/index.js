const express = require('express');
const cors = require('cors');
const statsRouter = require('./routes/stats');
const usersRouter = require('./routes/users');
const activityRouter = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/activity', activityRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
