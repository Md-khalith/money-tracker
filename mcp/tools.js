const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Configurable API base URL for communicating with the backend (Render / local)
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}/api`;

const ALLOWED_PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

// Generic API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const res = await fetch(url, config);
  if (!res.ok) {
    let errMessage = `API request failed with status ${res.status}`;
    try {
      const json = await res.json();
      if (json.error) errMessage = json.error;
    } catch (_) {}
    throw new Error(errMessage);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Helper to format Indian Rupee
function formatINR(amount) {
  const num = Math.abs(Number(amount) || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2
  }).format(num);
  return `₹${formatted}`;
}

// Helper to get month date range: 'YYYY-MM' -> { startDate, endDate, monthName }
function getMonthDateRange(monthStr) {
  let year, monthIndex;
  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const parts = monthStr.split('-');
    year = parseInt(parts[0], 10);
    monthIndex = parseInt(parts[1], 10) - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthIndex = now.getMonth();
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const pad = (n) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(monthIndex + 1)}-01`;
  const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay.getDate())}`;
  const monthName = firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return { startDate, endDate, monthName, yearMonth: `${year}-${pad(monthIndex + 1)}` };
}

// Helper to resolve category by name or ID via backend API
async function resolveCategoryId(categoryInput) {
  const categories = await apiRequest('/categories');

  if (typeof categoryInput === 'number' || /^\d+$/.test(categoryInput)) {
    const id = Number(categoryInput);
    const found = categories.find((c) => c.id === id);
    if (found) return found;
  }

  const nameStr = String(categoryInput).trim().toLowerCase();
  const found = categories.find((c) => c.name.toLowerCase() === nameStr);
  if (found) return found;

  const available = categories.map((c) => `${c.icon ? c.icon + ' ' : ''}${c.name}`).join(', ');
  throw new Error(`Category "${categoryInput}" not found. Available categories: ${available}`);
}

function createMcpServerInstance() {
  const server = new Server(
    {
      name: 'money-tracker-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'create_category',
          description: 'Create a new category with a name and optional emoji icon for classifying transactions in Money Tracker.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The unique name of the category (e.g. "Investment", "Gym", "Pets", "Groceries")'
              },
              icon: {
                type: 'string',
                description: 'An optional emoji or icon character (e.g. "📈", "🏋️", "🐶", "🛒")'
              }
            },
            required: ['name']
          }
        },
        {
          name: 'add_transaction',
          description: 'Add a new financial transaction (either SPENT for expenses or RECEIVED for income) to Money Tracker.',
          inputSchema: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: 'The positive monetary amount in INR (e.g. 450.50 or 25000)'
              },
              type: {
                type: 'string',
                enum: ['SPENT', 'RECEIVED'],
                description: 'Transaction type: "SPENT" for expense or "RECEIVED" for income'
              },
              category: {
                type: 'string',
                description: 'The category name (e.g. "Food", "Salary", "Travel") or category ID'
              },
              payment_method: {
                type: 'string',
                enum: ALLOWED_PAYMENT_METHODS,
                description: 'Payment method: Cash, UPI, Debit Card, Credit Card, Bank Transfer, or Other (default: UPI)'
              },
              transaction_date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format (defaults to current date if omitted)'
              },
              description: {
                type: 'string',
                description: 'Optional note or description for the transaction (e.g. "Lunch with team", "Monthly salary")'
              }
            },
            required: ['amount', 'type', 'category']
          }
        },
        {
          name: 'get_monthly_spending_by_category',
          description: 'View the total money spent grouped by categories for a specific month (or current month if omitted), with amounts and percentages.',
          inputSchema: {
            type: 'object',
            properties: {
              month: {
                type: 'string',
                description: 'Target month in YYYY-MM format (e.g. "2026-09"). Defaults to the current month if not specified.'
              }
            }
          }
        },
        {
          name: 'list_categories',
          description: 'List all available categories in Money Tracker with their icons and transaction counts.',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_monthly_summary',
          description: 'Get total received, total spent, and net balance for a specific month (or current month).',
          inputSchema: {
            type: 'object',
            properties: {
              month: {
                type: 'string',
                description: 'Target month in YYYY-MM format (e.g. "2026-09"). Defaults to current month.'
              }
            }
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'create_category': {
          const { name: catName, icon } = args;
          if (!catName || !catName.trim()) {
            throw new Error('Category name is required.');
          }

          const created = await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({
              name: catName.trim(),
              icon: icon ? icon.trim() : null
            })
          });

          return {
            content: [
              {
                type: 'text',
                text: `✅ Category created successfully:\n- ID: ${created.id}\n- Name: ${created.name}\n- Icon: ${created.icon || 'None'}`
              }
            ]
          };
        }

        case 'add_transaction': {
          const { amount, type, category, payment_method, transaction_date, description } = args;

          const resolvedCategory = await resolveCategoryId(category);

          const todayStr = new Date().toISOString().slice(0, 10);
          const dateToUse = transaction_date || todayStr;
          const methodToUse = payment_method || 'UPI';

          const created = await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify({
              amount,
              type,
              categoryId: resolvedCategory.id,
              paymentMethod: methodToUse,
              transactionDate: dateToUse,
              description: description || ''
            })
          });

          const sign = created.type === 'RECEIVED' ? '+' : '-';
          return {
            content: [
              {
                type: 'text',
                text: `✅ Transaction added successfully:\n` +
                      `- Type: ${created.type}\n` +
                      `- Amount: ${sign} ${formatINR(created.amount)}\n` +
                      `- Category: ${created.categoryIcon ? created.categoryIcon + ' ' : ''}${created.categoryName}\n` +
                      `- Payment Method: ${created.paymentMethod}\n` +
                      `- Date: ${created.transactionDate}\n` +
                      `- Description: ${created.description || '(none)'}\n` +
                      `- Transaction ID: ${created.id}`
              }
            ]
          };
        }

        case 'get_monthly_spending_by_category': {
          const { month } = args;
          const { startDate, endDate, monthName, yearMonth } = getMonthDateRange(month);

          const dashboardData = await apiRequest(`/dashboard?startDate=${startDate}&endDate=${endDate}`);
          const { spendingByCategory = [], totalSpent = 0, totalReceived = 0, balance = 0 } = dashboardData;

          let output = `📊 Spending Breakdown by Category — ${monthName} (${yearMonth})\n`;
          output += `──────────────────────────────────────────────────\n`;
          output += `Total Spent:    ${formatINR(totalSpent)}\n`;
          output += `Total Received: ${formatINR(totalReceived)}\n`;
          output += `Net Balance:    ${formatINR(balance)}\n`;
          output += `──────────────────────────────────────────────────\n\n`;

          if (spendingByCategory.length === 0) {
            output += `No expenses recorded for ${monthName}.`;
          } else {
            output += `Category Breakdown:\n`;
            spendingByCategory.forEach((cat, index) => {
              const barLength = Math.round(cat.percentage / 5);
              const bar = '█'.repeat(barLength).padEnd(20, '░');
              const icon = cat.icon ? `${cat.icon} ` : '';
              output += `${index + 1}. ${icon}${cat.categoryName.padEnd(16)} ${bar} ${formatINR(cat.total).padStart(10)} (${cat.percentage}%)\n`;
            });
          }

          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        }

        case 'list_categories': {
          const categories = await apiRequest('/categories');
          let text = `📋 Available Categories (${categories.length}):\n\n`;
          categories.forEach((cat) => {
            text += `- [ID ${cat.id}] ${cat.icon ? cat.icon + ' ' : ''}${cat.name} (${cat.transactionCount} transactions)\n`;
          });

          return {
            content: [
              {
                type: 'text',
                text
              }
            ]
          };
        }

        case 'get_monthly_summary': {
          const { month } = args;
          const { startDate, endDate, monthName, yearMonth } = getMonthDateRange(month);
          const data = await apiRequest(`/dashboard?startDate=${startDate}&endDate=${endDate}`);

          const spendingByCategory = data.spendingByCategory || [];
          const topCat = spendingByCategory[0];
          const topCatStr = topCat ? `${topCat.icon ? topCat.icon + ' ' : ''}${topCat.categoryName} (${formatINR(topCat.total)})` : 'None';
          const recentTx = data.recentTransactions || [];

          let text = `📈 Financial Summary — ${monthName} (${yearMonth})\n`;
          text += `─────────────────────────────────────────\n`;
          text += `• Total Received: ${formatINR(data.totalReceived)}\n`;
          text += `• Total Spent:    ${formatINR(data.totalSpent)}\n`;
          text += `• Net Balance:    ${formatINR(data.balance)}\n`;
          text += `• Top Category:   ${topCatStr}\n`;
          text += `• Recent Count:   ${recentTx.length} transactions\n`;

          return {
            content: [
              {
                type: 'text',
                text
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `❌ Error: ${err.message}`
          }
        ]
      };
    }
  });

  return server;
}

module.exports = {
  createMcpServerInstance,
  formatINR,
  getMonthDateRange,
  resolveCategoryId,
  API_BASE_URL
};
