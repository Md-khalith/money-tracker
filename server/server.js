const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Ensure DB is initialized
require('./db/database');

const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Configurable CORS for separate frontend deployment
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins === '*' ? true : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());

// API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoints for cloud load balancers and orchestrators
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    service: 'money-tracker-api',
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Serve frontend build in production if present
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Money Tracker server listening on http://${HOST}:${PORT}`);
});

module.exports = app;
