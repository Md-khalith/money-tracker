#!/usr/bin/env node

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createMcpServerInstance } = require('./tools');

const server = createMcpServerInstance();

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Money Tracker MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
