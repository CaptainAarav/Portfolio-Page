# Server Status Setup Guide

This guide explains how to set up the Server Status monitoring system for your portfolio.

## Architecture Overview

- **Backend API**: Node.js/Express server with SQLite database (runs on port 3001)
- **Frontend**: React component that polls the API every 60 seconds
- **Services**: Each service POSTs its status every 60 seconds to the API

## Step 1: Set Up Backend API

1. **Install dependencies:**

   ```bash
   cd api
   npm install
   ```

2. **Start the API server:**

   ```bash
   npm start
   ```

   The API will run on `http://localhost:3001`

3. **Test the API:**
   ```bash
   curl http://localhost:3001/health
   ```

## Step 2: Configure Frontend

The frontend component is already integrated. Update the API URL if needed:

1. **Option A: Environment variable (recommended)**
   Create `.env` file in project root:

   ```
   REACT_APP_STATUS_API_URL=http://localhost:3001/api/status
   ```

2. **Option B: Update component directly**
   Edit `src/components/ServerStatus.jsx`:
   ```javascript
   const API_URL = "http://your-server-ip:3001/api/status";
   ```

## Step 3: Configure Nginx (Optional)

If you want to access the API through your domain (e.g., `captainaarav.dev/api/status`):

Add to your nginx config:

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

Then update frontend API_URL to: `https://captainaarav.dev/api/status`

## Step 4: Integrate Services

Each service needs to POST its status every 60 seconds. See `api/status-client-template.js` for examples.

### Service IDs

Your services are configured with these IDs:

- `aarav-and-ollie` - Aarav and Ollie (minecraft server)
- `fatty-smp` - Fatty SMP (minecraft server)
- `aqua-smp` - Aqua SMP (minecraft server)
- `luxairport-smp` - Luxairport SMP (minecraft server)
- `the-stewpid-alliance-of-idiotic-people` - the stewpid alliance of idiotic people (minecraft servers)
- `walton-smp` - Walton SMP (minecraft server)
- `lukas-server` - Lukas Server (beammp server)
- `manager-turtle` - Manager Turtle (discord bot)
- `jet2-manager` - Jet2 Manager (discord bot)
- `fatty-bot` - Fatty Bot (discord bot)
- `fattysmp-com` - fattysmp.com (website)
- `fattyhosting-com` - fattyhosting.com (website)
- `aaravsnetflix-com` - aaravsnetflix.com (jellyfin website)
- `captainaarav-dev` - captainaarav.dev (portfolio website)

### Example: AMP Server Integration

Create a script that runs every 60 seconds (via cron or scheduled task):

```javascript
const fetch = require("node-fetch");

const API_URL = "http://your-server-ip:3001/api/status/report";

async function reportStatus() {
  try {
    // Query AMP API for server status
    const ampResponse = await fetch(
      "http://localhost:8080/API/Core/GetStatus",
      {
        headers: { Accept: "application/json" },
      }
    );
    const ampData = await ampResponse.json();

    // POST to status API
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: "fatty-smp", // Use your service ID
        serviceName: "Fatty SMP",
        serviceType: "game-server",
        status: ampData.Status === "Online" ? "online" : "offline",
        responseTime: 45,
        details: {
          players: ampData.Players || 0,
          maxPlayers: ampData.MaxPlayers || 0,
          version: ampData.Version,
        },
      }),
    });
  } catch (error) {
    console.error("Error reporting status:", error);
  }
}

// Run every 60 seconds
setInterval(reportStatus, 60000);
reportStatus(); // Run immediately
```

### Example: Discord Bot Integration

Add to your Discord bot code:

```javascript
// Report status every 60 seconds
setInterval(async () => {
  try {
    await fetch("http://your-server-ip:3001/api/status/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: "manager-turtle",
        serviceName: "Manager Turtle",
        serviceType: "discord-bot",
        status: client.isReady() ? "online" : "offline",
        details: {
          guilds: client.guilds.cache.size,
          users: client.users.cache.size,
        },
      }),
    });
  } catch (error) {
    console.error("Error reporting status:", error);
  }
}, 60000);
```

### Example: Website Integration

Add to your website (server-side or client-side):

```javascript
// Client-side (runs in browser)
setInterval(async () => {
  try {
    await fetch("http://your-server-ip:3001/api/status/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: "fattysmp-com",
        serviceName: "fattysmp.com",
        serviceType: "website",
        status: "online",
        responseTime: performance.now(),
      }),
    });
  } catch (error) {
    console.error("Error reporting status:", error);
  }
}, 60000);
```

## Step 5: Verify Setup

1. **Check API is running:**

   ```bash
   curl http://localhost:3001/api/status
   ```

2. **Check frontend:**

   - Visit your portfolio website
   - Navigate to "Server Status" section
   - Services should appear as they start reporting

3. **Test a service:**
   - Manually POST a status:
   ```bash
   curl -X POST http://localhost:3001/api/status/report \
     -H "Content-Type: application/json" \
     -d '{
       "serviceId": "test-service",
       "serviceName": "Test Service",
       "serviceType": "game-server",
       "status": "online"
     }'
   ```
   - Check it appears in the frontend

## Troubleshooting

### API not accessible

- Check if API is running: `curl http://localhost:3001/health`
- Check firewall settings
- Verify port 3001 is not blocked

### Services not appearing

- Check service is POSTing to correct endpoint
- Check serviceId matches expected format
- Check API logs for errors
- Verify CORS is enabled (should be by default)

### Frontend not updating

- Check browser console for errors
- Verify API_URL is correct
- Check network tab for API requests

## Production Deployment

1. **Run API with PM2:**

   ```bash
   pm2 start api/server.js --name status-api
   pm2 save
   ```

2. **Set up auto-start:**

   ```bash
   pm2 startup
   ```

3. **Monitor logs:**
   ```bash
   pm2 logs status-api
   ```

## Security Considerations

Currently, the API has no authentication. For production, consider:

- Adding API key authentication
- IP whitelisting
- Rate limiting
- HTTPS only
