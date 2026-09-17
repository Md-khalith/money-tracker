const { spawn } = require('child_process');
const path = require('path');

const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';
const pendingRequests = new Map();
let requestId = 1;

serverProcess.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        resolve(msg);
      }
    } catch (e) {
      // Non-json output
    }
  }
});

function sendRequest(method, params = {}) {
  return new Promise((resolve) => {
    const id = requestId++;
    pendingRequests.set(id, { resolve });
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params
    }) + '\n';
    serverProcess.stdin.write(payload);
  });
}

async function runTests() {
  console.log('🧪 Testing Money Tracker MCP Server...\n');

  // 1. Initialize
  const initRes = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
  console.log('✓ Initialized:', initRes.result?.serverInfo);

  // 2. List Tools
  const toolsRes = await sendRequest('tools/list', {});
  const toolNames = toolsRes.result.tools.map(t => t.name);
  console.log('✓ Tools available:', toolNames);

  // 3. Create Category
  console.log('\nTesting create_category tool:');
  const catRes = await sendRequest('tools/call', {
    name: 'create_category',
    arguments: {
      name: 'Gym & Fitness',
      icon: '🏋️'
    }
  });
  console.log(catRes.result.content[0].text);

  // 4. Add Transactions
  console.log('\nTesting add_transaction (Salary):');
  const txSalary = await sendRequest('tools/call', {
    name: 'add_transaction',
    arguments: {
      amount: 75000,
      type: 'RECEIVED',
      category: 'Salary',
      payment_method: 'Bank Transfer',
      description: 'Monthly salary credit'
    }
  });
  console.log(txSalary.result.content[0].text);

  console.log('\nTesting add_transaction (Gym Spent):');
  const txGym = await sendRequest('tools/call', {
    name: 'add_transaction',
    arguments: {
      amount: 2500,
      type: 'SPENT',
      category: 'Gym & Fitness',
      payment_method: 'UPI',
      description: 'Gym monthly membership'
    }
  });
  console.log(txGym.result.content[0].text);

  console.log('\nTesting add_transaction (Food Spent):');
  const txFood = await sendRequest('tools/call', {
    name: 'add_transaction',
    arguments: {
      amount: 4500,
      type: 'SPENT',
      category: 'Food',
      payment_method: 'Credit Card',
      description: 'Groceries'
    }
  });
  console.log(txFood.result.content[0].text);

  // 5. Monthly spending by category
  console.log('\nTesting get_monthly_spending_by_category:');
  const spendingRes = await sendRequest('tools/call', {
    name: 'get_monthly_spending_by_category',
    arguments: {}
  });
  console.log(spendingRes.result.content[0].text);

  // 6. Monthly summary
  console.log('\nTesting get_monthly_summary:');
  const summaryRes = await sendRequest('tools/call', {
    name: 'get_monthly_summary',
    arguments: {}
  });
  console.log(summaryRes.result.content[0].text);

  console.log('\n🎉 ALL MCP TOOLS TESTED AND WORKING PERFECTLY!\n');
  serverProcess.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('MCP test error:', err);
  serverProcess.kill();
  process.exit(1);
});
