#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { createMcpServerInstance } = require('./tools');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.MCP_PORT || process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

// Parse JSON request bodies while allowing raw streams for streaming
app.use(express.json());

// CORS configuration for remote Streamable HTTP MCP clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Mcp-Session-Id',
    'Mcp-Protocol-Version'
  ],
  exposedHeaders: [
    'Mcp-Session-Id',
    'Mcp-Protocol-Version'
  ]
}));

// Active Streamable HTTP session transports: sessionId -> StreamableHTTPServerTransport
const sessions = new Map();

// Helper to create a new session with StreamableHTTPServerTransport
async function createNewSession() {
  let transport;
  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, transport);
    },
    onsessionclosed: (id) => {
      sessions.delete(id);
    }
  });

  const server = createMcpServerInstance();
  await server.connect(transport);
  return transport;
}

// Root / Service Info
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'money-tracker-mcp-remote',
    transport: 'streamable-http',
    endpoint: '/mcp',
    apiBaseUrl: API_BASE_URL
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'money-tracker-mcp-remote',
    transport: 'streamable-http',
    endpoint: '/mcp',
    activeSessions: sessions.size,
    apiBaseUrl: API_BASE_URL,
    timestamp: new Date().toISOString()
  });
});

// Streamable HTTP Endpoint: /mcp
app.all('/mcp', async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  try {
    const sessionId = req.headers['mcp-session-id'];

    // 1. If an existing session ID is provided in request headers
    if (sessionId) {
      const transport = sessions.get(sessionId);
      if (!transport) {
        return res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null
        });
      }

      if (req.method === 'DELETE') {
        try {
          await transport.handleRequest(req, res, req.body);
        } finally {
          sessions.delete(sessionId);
        }
        return;
      }

      return await transport.handleRequest(req, res, req.body);
    }

    // 2. If no session ID is provided, this must be an initialization POST request
    if (req.method === 'POST') {
      const transport = await createNewSession();
      return await transport.handleRequest(req, res, req.body);
    }

    // 3. Any GET or DELETE without a session ID is invalid
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Missing required Mcp-Session-Id header' },
      id: null
    });
  } catch (err) {
    console.error('[MCP Streamable HTTP Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: err.message || 'Internal server error' },
        id: null
      });
    }
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Money Tracker Remote MCP Server listening on http://${HOST}:${PORT}`);
  console.log(`- Health: http://${HOST}:${PORT}/health`);
  console.log(`- Streamable HTTP Endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`- Backend API: ${API_BASE_URL}`);
});
