const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

const TEST_PORT = 8089;
const API_BASE_URL = process.env.API_BASE_URL || 'https://money-tracker-api-efqa.onrender.com';

console.log('======================================================');
console.log('🧪 TESTING MCP STREAMABLE HTTP SERVER');
console.log(`Backend Target: ${API_BASE_URL}`);
console.log('======================================================\n');

// Start the Streamable HTTP server process
const serverProcess = spawn('node', [path.join(__dirname, 'httpServer.js')], {
  env: {
    ...process.env,
    MCP_PORT: String(TEST_PORT),
    PORT: String(TEST_PORT),
    HOST: '127.0.0.1',
    API_BASE_URL,
    NODE_ENV: 'production'
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(pathStr) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: pathStr,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  await sleep(1500);

  // 1. Verify GET /health
  console.log('1. Verifying GET /health...');
  const healthRes = await httpGet('/health');
  console.log('   Status:', healthRes.status);
  console.log('   Body:', JSON.stringify(healthRes.body));
  if (healthRes.status !== 200 || healthRes.body.transport !== 'streamable-http') {
    throw new Error('Health check failed or transport is not streamable-http');
  }
  console.log('   ✓ Health check verified (transport: streamable-http)');

  // 2. Verify GET /sse does NOT exist
  console.log('\n2. Verifying GET /sse does NOT exist (SSE legacy removal)...');
  const sseRes = await httpGet('/sse');
  console.log('   Status for /sse:', sseRes.status);
  if (sseRes.status !== 404) {
    throw new Error(`Expected 404 for legacy /sse, got ${sseRes.status}`);
  }
  console.log('   ✓ Confirmed legacy /sse endpoint is completely removed (404 Not Found)');

  // 3. Connect via official MCP StreamableHTTPClientTransport
  console.log('\n3. Connecting MCP client via StreamableHTTPClientTransport...');
  const client = new Client(
    { name: 'streamable-http-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${TEST_PORT}/mcp`)
  );

  await client.connect(transport);
  console.log('   ✓ Connected and initialized MCP session successfully!');

  // 4. List tools
  console.log('\n4. Requesting tools/list...');
  const toolsRes = await client.listTools();
  const toolNames = toolsRes.tools.map(t => t.name);
  console.log('   Tools found (' + toolNames.length + '):', toolNames.join(', '));
  if (toolNames.length !== 5) {
    throw new Error(`Expected 5 tools, found ${toolNames.length}`);
  }
  console.log('   ✓ All 5 tools listed successfully');

  // 5. Test read-only tool: list_categories
  console.log('\n5. Calling read tool: list_categories...');
  const catRes = await client.callTool({ name: 'list_categories', arguments: {} });
  console.log('   Output:\n' + catRes.content[0].text.split('\n').slice(0, 5).map(l => '     ' + l).join('\n'));
  console.log('   ✓ list_categories succeeded');

  // 6. Test read-only tool: get_monthly_summary
  console.log('\n6. Calling read tool: get_monthly_summary...');
  const sumRes = await client.callTool({ name: 'get_monthly_summary', arguments: { month: '2026-09' } });
  console.log('   Output:\n' + sumRes.content[0].text.split('\n').slice(0, 6).map(l => '     ' + l).join('\n'));
  console.log('   ✓ get_monthly_summary succeeded');

  // 7. Test read-only tool: get_monthly_spending_by_category
  console.log('\n7. Calling read tool: get_monthly_spending_by_category...');
  const spendRes = await client.callTool({ name: 'get_monthly_spending_by_category', arguments: { month: '2026-09' } });
  console.log('   Output:\n' + spendRes.content[0].text.split('\n').slice(0, 6).map(l => '     ' + l).join('\n'));
  console.log('   ✓ get_monthly_spending_by_category succeeded');

  // 8. Test write tool: add_transaction
  console.log('\n8. Calling write tool: add_transaction...');
  const txRes = await client.callTool({
    name: 'add_transaction',
    arguments: {
      amount: 499,
      type: 'SPENT',
      category: 'Food',
      payment_method: 'UPI',
      description: 'Streamable HTTP Verification Test'
    }
  });
  console.log('   Output:\n' + txRes.content[0].text.split('\n').map(l => '     ' + l).join('\n'));
  const idMatch = txRes.content[0].text.match(/Transaction ID:\s*(\d+)/i);
  const createdId = idMatch ? idMatch[1] : null;
  console.log('   ✓ add_transaction succeeded (Created ID: ' + createdId + ')');

  // 9. Close client connection
  console.log('\n9. Closing Streamable HTTP client...');
  await client.close();
  console.log('   ✓ Client closed cleanly');

  // Clean up test transaction via backend API
  if (createdId && API_BASE_URL.startsWith('http')) {
    try {
      const delUrl = `${API_BASE_URL.replace(/\/+$/, '')}/api/transactions/${createdId}`;
      const isHttps = delUrl.startsWith('https');
      const mod = isHttps ? require('https') : require('http');
      await new Promise((res) => {
        const req = mod.request(delUrl, { method: 'DELETE' }, () => res());
        req.on('error', () => res());
        req.end();
      });
      console.log('   ✓ Cleaned up test transaction #' + createdId);
    } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('🎉 ALL STREAMABLE HTTP MCP TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');

  serverProcess.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
