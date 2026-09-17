# Money Tracker — Cloud Deployment & Multi-Host Architecture

This guide explains how to deploy Money Tracker when the **Frontend**, **Backend API**, and **MCP Server** are hosted separately on different cloud services.

```text
┌───────────────────────────────┐
│           Frontend            │
│   (Vercel / Netlify / CDN)    │
│    https://app.example.com    │
└──────────────┬────────────────┘
               │ HTTPS (REST API)
               ▼
┌───────────────────────────────┐
│          Backend API          │
│    (Render / Fly.io / VPS)    │
│    https://api.example.com    │
└──────────────┬────────────────┘
               │ Local / Mounted Volume
               ▼
┌───────────────────────────────┐
│     Persistent SQLite DB      │
│    /var/data/money-tracker.db │
└───────────────────────────────┘

┌───────────────────────────────┐
│      AI Assistant / Client    │
│     (Claude, Cursor, AGY)     │
└──────────────┬────────────────┘
               │ HTTPS (SSE & POST)
               ▼
┌───────────────────────────────┐
│       Remote MCP Server       │
│    https://mcp.example.com    │
│   (/sse, /messages, /health)  │
└───────────────────────────────┘
```

---

## 1. Frontend Deployment (Cloud A)

### Recommended Platforms
- **Vercel**, **Netlify**, or **Cloudflare Pages**

### Configuration
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Public HTTPS URL of the deployed backend API | `https://api.example.com` |

*(If `VITE_API_URL` is omitted, the frontend assumes single-host / proxy mode and requests `/api` relative to the current domain).*

---

## 2. Backend API Deployment (Cloud B)

### Recommended Platforms
- **Render**, **Railway**, **Fly.io**, or **Docker/VPS**

### Configuration
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: Dynamically provided via `process.env.PORT`
- **Host Binding**: `0.0.0.0` (accessible from external requests)
- **Health Check Endpoint**: `GET /health` or `GET /api/health`

### Environment Variables
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Auto | Cloud platform port | `5000` |
| `HOST` | No | Host binding (defaults to `0.0.0.0`) | `0.0.0.0` |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS | `https://app.example.com` |
| `DATABASE_PATH` | Yes | Path on persistent disk for SQLite | `/var/data/money-tracker.db` |
| `NODE_ENV` | Yes | Set to production | `production` |

---

## 3. Persistent Storage for SQLite

SQLite stores the entire database in a single file (`money-tracker.db`). In cloud environments with ephemeral filesystems (like Render or Fly.io), changes made to the filesystem are lost on restart unless a **Persistent Disk/Volume** is attached.

1. **Attach a Persistent Volume** to your service (e.g. mount path `/var/data`).
2. Set `DATABASE_PATH=/var/data/money-tracker.db`.
3. The server automatically initializes the schema and seeds default categories on the first run.
4. Database records survive container restarts and redeployments.

---

## 4. Remote MCP Server Deployment (Cloud C)

Money Tracker includes both local **Stdio** and remote **HTTP/SSE** transports for the Model Context Protocol.

### Running Remote MCP Server
```bash
npm run mcp:remote
```

### Endpoints
- **Health Check**: `GET /health`
- **SSE Stream**: `GET /sse`
- **Message POST**: `POST /messages?sessionId=<id>`

### Environment Variables
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Auto | Cloud port (or `MCP_PORT`) | `8080` |
| `HOST` | No | Host binding (defaults to `0.0.0.0`) | `0.0.0.0` |
| `DATABASE_PATH` | Yes | Path to shared/mounted SQLite database | `/var/data/money-tracker.db` |
| `MCP_API_KEY` | Optional | Bearer token / header authentication | `sec_mcp_9a8b7c` |

### Client Configuration (Connecting Remote MCP)
In your AI assistant's `mcp_config.json`:

```json
{
  "mcpServers": {
    "money-tracker-remote": {
      "serverUrl": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer sec_mcp_9a8b7c"
      }
    }
  }
}
```

---

## 5. Deployment Verification Checklist

- [x] **No hardcoded `localhost`**: Frontend uses `VITE_API_URL` environment variable.
- [x] **Configurable CORS**: Backend allows `FRONTEND_URL` with credentials and `Content-Disposition`.
- [x] **Cloud Host & Port**: Server binds to `0.0.0.0` and respects platform `PORT`.
- [x] **Health Check Endpoints**: Standard `/health` endpoints on both Backend and Remote MCP.
- [x] **Remote MCP Transport**: Full SSE and HTTP transport with optional API key auth.
- [x] **Database Path**: Parameterized via `DATABASE_PATH` for persistent disk volume mounts.
- [x] **Clean Builds**: Production frontend builds with zero errors.
