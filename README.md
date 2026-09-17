# Money Tracker 💰

A simple, self-hosted personal finance tracking web application designed to be lightweight, private, and easy to run.

Each installation uses its own local SQLite database. There are **no cloud dependencies, no user accounts, no login screens, and no tracking**.

> **Clone → Install → Run → Start tracking money.**

---

## Features

- **Income & Expense Tracking**: Record money received and spent with positive amounts.
- **Categorization**: Assign custom categories with emoji icons to transactions.
- **Payment Methods**: Cash, UPI, Debit Card, Credit Card, Bank Transfer, Other.
- **Dashboard Overview**:
  - **Total Received**
  - **Total Spent**
  - **Net Balance**
  - **Spending by Category** with percentage progress bars
  - **Recent Activity** list
- **Period Filtering**:
  - This Week
  - This Month (Default)
  - Last Month
  - This Year
  - All Time
  - Custom Date Range (Start Date & End Date)
- **Search & Multi-Filter**: Search by description or category, filter by transaction type, category, and payment method simultaneously.
- **Transaction Management**: Add, edit, and delete transactions with confirmation safeguards.
- **Category Management**: View, create, rename, and safely delete categories (prevents deletion if referenced by transactions).
- **CSV Export**: Export all or filtered transactions for a selected date range to `.csv`.
- **Responsive Design**: Clean desktop experience with mobile-optimized card views.
- **Indian Rupee (INR) Formatting**: Standard `₹` notation with Indian grouping (e.g. `₹1,25,000`).

---

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **Typography**: Roboto with Open Sans fallback

---

## Installation & Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd money-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```
   *(Or run `npm install` in both the root and `client/` directories)*

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Open in your browser**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## Production Build & Run

To build and serve the production app from a single server:

```bash
npm run build
npm start
```
The application will be served at `http://localhost:5000`.

---

## Database Location & Backup

The SQLite database file is automatically created and initialized on the first run:

```text
data/money-tracker.db
```

### Backing Up Your Data

To create a complete backup:
1. Simply copy the `data/money-tracker.db` file to a secure backup folder or external drive.
2. You can also use the **Export CSV** feature on the dashboard to export your transaction history at any time.

*Note: The database file is intentionally ignored in `.gitignore` so your personal finances are never committed to Git.*

---

## Project Structure

```text
money-tracker/
├── client/                     # Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Header, Cards, Table, Modals, Filters
│   │   ├── pages/              # Dashboard page
│   │   ├── services/           # Frontend API client
│   │   ├── utils/              # INR currency & date utilities
│   │   ├── App.jsx             # Root React component
│   │   └── main.jsx            # React entrypoint
│   └── package.json
│
├── server/                     # Backend (Express + SQLite)
│   ├── controllers/            # Route controllers
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic & SQL queries
│   ├── db/                     # SQLite connection, schema & seeds
│   ├── middleware/             # Error handling middleware
│   └── server.js               # Express server entrypoint
│
├── data/                       # SQLite database directory (gitignored)
│   └── .gitkeep
│
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Root package scripts
└── README.md                   # Documentation
```

---

## Model Context Protocol (MCP) Server

Money Tracker includes a built-in MCP server that allows AI assistants (like Claude, Cursor, or Antigravity) to manage your finances through natural language tool calls.

### Available MCP Tools

1. **`create_category`**: Create a new category with a name and optional emoji icon.
2. **`add_transaction`**: Add a financial transaction (SPENT or RECEIVED), auto-resolving category names or IDs.
3. **`get_monthly_spending_by_category`**: View a breakdown of spending by category for any month with percentage progress bars.
4. **`list_categories`**: View all categories with icons and transaction counts.
5. **`get_monthly_summary`**: Get quick total received, total spent, and net balance for a month.

### Running & Configuring the MCP Server

- **Local Stdio run**:
  ```bash
  npm run mcp
  ```
- **Remote Cloud HTTP/SSE run**:
  ```bash
  npm run mcp:remote
  ```
- **Local Configuration** (`mcp_config.json`):
  ```json
  {
    "mcpServers": {
      "money-tracker": {
        "command": "node",
        "args": ["<path-to-money-tracker>/mcp/server.js"]
      }
    }
  }
  ```
- **Remote Cloud Configuration** (SSE):
  ```json
  {
    "mcpServers": {
      "money-tracker-remote": {
        "serverUrl": "https://mcp.yourdomain.com/sse",
        "headers": {
          "Authorization": "Bearer <optional-mcp-api-key>"
        }
      }
    }
  }
  ```

---

## Deploying Backend to Render

You can deploy this Express API to [Render](https://render.com) as a **Web Service**:

### Render Web Service Settings

| Setting | Value |
| :--- | :--- |
| **Environment** | `Node` |
| **Node Version** | `20` (or `>=18`) |
| **Build Command** | `npm install` (or `npm install --omit=dev`) |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

### Render Environment Variables

Configure these in the Render Dashboard under **Environment**:

| Variable | Value / Description | Required? |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string (`postgresql://...?sslmode=require`) | **Yes** |
| `NODE_ENV` | `production` | Recommended |
| `FRONTEND_URL` | `https://md-khalith.github.io` | Recommended |

*Note: Render automatically injects `PORT`, and the server automatically binds to `0.0.0.0:${PORT}`.*

---

## Cloud Deployment (Multi-Host)

See the full [Cloud Deployment Guide](file:///e:/money-tracker/07-cloud-deployment.md) for deploying Frontend (GitHub Pages / Vercel), Backend API (Render), and MCP Server independently.

---

## Future Possibilities

- Monthly budget limits per category
- Recurring transaction reminders
- Visual spending trend charts over time
- Dark mode toggle

---

## License

MIT License. Free for personal and commercial use.
