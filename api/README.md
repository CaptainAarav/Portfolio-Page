# Status API

Backend API for monitoring server, website, and Discord bot statuses.

## Setup

1. **Install dependencies:**

   ```bash
   cd api
   npm install
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

   The API will run on port 3001 by default (or the port specified in `PORT` environment variable).

## API Endpoints

### POST `/api/status/report`

Services POST their status here every 60 seconds.

**Request Body:**

```json
{
  "serviceId": "minecraft-server-1",
  "serviceName": "Minecraft Server",
  "serviceType": "game-server",
  "status": "online",
  "responseTime": 45,
  "uptime": 99.8,
  "details": {
    "players": 12,
    "maxPlayers": 50
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Status recorded",
  "timestamp": "2026-02-05T16:30:00Z"
}
```

### GET `/api/status`

Frontend polls this endpoint every 60 seconds to get all service statuses.

**Response:**

```json
{
  "services": [
    {
      "serviceId": "minecraft-server-1",
      "serviceName": "Minecraft Server",
      "serviceType": "game-server",
      "status": "online",
      "responseTime": 45,
      "uptime": 99.8,
      "lastSeen": "2026-02-05T16:30:00Z",
      "details": {
        "players": 12,
        "maxPlayers": 50
      }
    }
  ],
  "lastUpdated": "2026-02-05T16:30:00Z"
}
```

## Service Types

- `game-server` - Game servers (Minecraft, BeamMP, etc.)
- `discord-bot` - Discord bots
- `website` - Websites

## Status Logic

- Services POST status every 60 seconds
- If a service hasn't reported in >60 seconds, it's marked as "offline"
- Frontend polls every 60 seconds to display current status

## Database

SQLite database (`status.db`) stores all service statuses. The database is automatically created on first run.

## Deployment

### Option 1: Run as separate process

```bash
cd api
npm start
```

### Option 2: Use PM2 for process management

```bash
npm install -g pm2
pm2 start api/server.js --name status-api
pm2 save
pm2 startup
```

### Option 3: Run as systemd service

Create `/etc/systemd/system/status-api.service`:

```ini
[Unit]
Description=Status API Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Portfoliio/api
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable status-api
sudo systemctl start status-api
```

## Nginx Configuration

To proxy API requests through nginx, add to your nginx config:

```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Environment Variables

- `PORT` - Port to run the API on (default: 3001)

## Service Integration

See `status-client-template.js` for examples of how to integrate status reporting into your services.
