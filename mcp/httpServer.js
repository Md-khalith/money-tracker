#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { createMcpServerInstance } = require('./tools');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || process.env.MCP_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const MCP_API_KEY = process.env.MCP_API_KEY;
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Optional Authentication Middleware
function authMiddleware(req, res, next) {
  if (!MCP_API_KEY) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];
  const queryKey = req.query.apiKey;

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  } else if (queryKey) {
    token = queryKey.trim();
  }

  if (token === MCP_API_KEY) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized: Invalid or missing MCP API key.'
  });
}

// Store active SSE transports by sessionId
const activeTransports = new Map();

// Service Info / Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'money-tracker-mcp-remote',
    transport: 'sse',
    apiBaseUrl: API_BASE_URL,
    endpoints: {
      health: '/health',
      sse: '/sse',
      messages: '/messages'
    },
    auth: MCP_API_KEY ? 'enabled' : 'none'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'money-tracker-mcp-remote',
    transport: 'sse',
    activeSessions: activeTransports.size,
    apiBaseUrl: API_BASE_URL,
    timestamp: new Date().toISOString()
  });
});

// SSE Connection Endpoint
app.get('/sse', authMiddleware, async (req, res) => {
  console.log(`[MCP-SSE] Incoming connection from ${req.ip}`);

  // Create a new SSEServerTransport pointing client to POST /messages
  const transport = new SSEServerTransport('/messages', res);
  const server = createMcpServerInstance();

  activeTransports.set(transport.sessionId, transport);

  req.on('close', () => {
    console.log(`[MCP-SSE] Session ${transport.sessionId} closed`);
    activeTransports.delete(transport.sessionId);
  });

  try {
    await server.connect(transport);
    console.log(`[MCP-SSE] Session ${transport.sessionId} connected`);
  } catch (err) {
    console.error(`[MCP-SSE] Connection error for session ${transport.sessionId}:`, err);
    activeTransports.delete(transport.sessionId);
  }
});

// Message Handling Endpoint
app.post('/messages', authMiddleware, async (req, res) => {
  const sessionId = req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing required query parameter: sessionId' });
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    return res.status(404).json({ error: `Session "${sessionId}" not found or has expired.` });
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (err) {
    console.error(`[MCP-SSE] Error handling message for session ${sessionId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Money Tracker Remote MCP Server listening on http://${HOST}:${PORT}`);
  console.log(`- Health: http://${HOST}:${PORT}/health`);
  console.log(`- SSE Endpoint: http://${HOST}:${PORT}/sse`);
  console.log(`- Backend API: ${API_BASE_URL}`);
  console.log(`- Auth: ${MCP_API_KEY ? 'Enabled (MCP_API_KEY)' : 'Disabled (Public)'}`);
});
