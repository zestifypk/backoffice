const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { loadEnv, getEnv } = require('./config/env');
const { testConnection } = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const statsRouter = require('./routes/stats');
const usersRouter = require('./routes/users');
const activityRouter = require('./routes/activity');
const authRouter = require('./routes/auth');
const accessRouter = require('./routes/access');

loadEnv();

const app = express();
const PORT = Number(getEnv('PORT', '3001'));

app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3001'),
  })
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/activity', activityRouter);
app.use('/api/access', accessRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(errorHandler);

testConnection()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error({ err: error }, 'Failed to connect to MySQL. Server not started');
    process.exit(1);
  });
