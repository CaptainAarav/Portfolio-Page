# Server Status Checker Setup Guide

This guide explains how to set up the centralized Docker status checker that monitors all your Discord bots and websites running in Docker containers.

## Overview

The server status checker runs on your server and:
- Monitors all Docker containers (Discord bots and websites)
- Checks container status, health, CPU, and RAM usage
- Optionally performs HTTP health checks for websites
- Reports status to the status API every 60 seconds

## Prerequisites

- Node.js installed on your server
- Docker installed and running
- Access to Docker socket (`/var/run/docker.sock`) or Docker CLI
- All services running in Docker containers

## Installation

### Step 1: Copy Files to Server

Copy these files to your server's `api` directory:
- `server-status-checker.js`
- `services-config.json`

### Step 2: Install Optional Dependency (Recommended)

The script works with or without `dockerode`, but `dockerode` provides better performance:

```bash
cd ~/Portfoliio/api
npm install dockerode
```

**Note**: If you don't install `dockerode`, the script will use Docker CLI commands instead.

### Step 3: Configure Services

Edit `services-config.json` to match your Docker container names:

```json
{
  "services": [
    {
      "containerName": "your-container-name",
      "serviceId": "unique-service-id",
      "serviceName": "Display Name",
      "serviceType": "discord-bot",
      "healthCheckUrl": null
    }
  ]
}
```

**Fields:**
- `containerName`: Exact Docker container name (use `docker ps` to find it)
- `serviceId`: Unique identifier (must match what's expected in your portfolio)
- `serviceName`: Display name shown on portfolio
- `serviceType`: Either `"discord-bot"` or `"website"`
- `healthCheckUrl`: Optional HTTP endpoint for websites (e.g., `"https://example.com/health"`)

### Step 4: Set Permissions

Make the script executable:

```bash
chmod +x server-status-checker.js
```

### Step 5: Configure Docker Access

#### Option A: Docker Socket Access (Recommended)

If running as the same user that runs Docker:

```bash
# Check if you can access Docker socket
docker ps
```

If you get permission errors, add your user to the docker group:

```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

#### Option B: Run with sudo (Not Recommended)

You can run with sudo, but it's better to fix permissions:

```bash
sudo node server-status-checker.js
```

## Running the Status Checker

### Option 1: PM2 (Recommended)

Run alongside your status-api:

```bash
cd ~/Portfoliio/api
pm2 start server-status-checker.js --name status-checker
pm2 save
```

View logs:
```bash
pm2 logs status-checker
```

### Option 2: Systemd Service

Create `/etc/systemd/system/status-checker.service`:

```ini
[Unit]
Description=Docker Status Checker
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/Portfoliio/api
ExecStart=/usr/bin/node /home/your-username/Portfoliio/api/server-status-checker.js
Restart=always
RestartSec=10
Environment="STATUS_API_URL=https://captainaarav.dev/api/status/report"
Environment="CHECK_INTERVAL=60"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable status-checker
sudo systemctl start status-checker
sudo systemctl status status-checker
```

### Option 3: Direct Execution

For testing:

```bash
cd ~/Portfoliio/api
node server-status-checker.js
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STATUS_API_URL` | `https://captainaarav.dev/api/status/report` | Status API endpoint |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket path |
| `SERVICES_CONFIG` | `./services-config.json` | Path to services config file |
| `CHECK_INTERVAL` | `60` | Seconds between checks |
| `ENABLE_HTTP_CHECKS` | `true` | Enable HTTP health checks for websites |

### Example PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'status-api',
      script: 'server.js',
      cwd: '/home/aarav/Portfoliio/api',
    },
    {
      name: 'status-checker',
      script: 'server-status-checker.js',
      cwd: '/home/aarav/Portfoliio/api',
      env: {
        STATUS_API_URL: 'https://captainaarav.dev/api/status/report',
        CHECK_INTERVAL: '60',
        ENABLE_HTTP_CHECKS: 'true',
      },
    },
  ],
};
```

Run with:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Finding Container Names

To find your Docker container names:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

Or:
```bash
docker ps
```

Look at the `NAMES` column - that's what you need for `containerName` in the config.

## Service Configuration Examples

### Discord Bot

```json
{
  "containerName": "manager-turtle-bot",
  "serviceId": "manager-turtle-bot",
  "serviceName": "Manager Turtle",
  "serviceType": "discord-bot",
  "healthCheckUrl": null
}
```

### Website with Health Check

```json
{
  "containerName": "fattysmp-website",
  "serviceId": "fattysmp-com",
  "serviceName": "fattysmp.com",
  "serviceType": "website",
  "healthCheckUrl": "https://fattysmp.com/health"
}
```

### Website without Health Check

```json
{
  "containerName": "my-website",
  "serviceId": "my-website-com",
  "serviceName": "my-website.com",
  "serviceType": "website",
  "healthCheckUrl": null
}
```

## Troubleshooting

### "Cannot access Docker"

**Error**: `Error: Cannot access Docker`

**Solutions**:
1. Check Docker is running: `sudo systemctl status docker`
2. Check Docker socket permissions: `ls -l /var/run/docker.sock`
3. Add user to docker group: `sudo usermod -aG docker $USER` (then log out/in)
4. Verify Docker CLI works: `docker ps`

### "Container not found"

**Error**: `Container not found`

**Solutions**:
1. Check container name in config matches exactly: `docker ps`
2. Container might be stopped: `docker ps -a`
3. Check for typos in `containerName` field

### "Services config file not found"

**Error**: `Services config file not found`

**Solutions**:
1. Ensure `services-config.json` exists in the same directory
2. Check path in `SERVICES_CONFIG` environment variable
3. Verify file permissions: `ls -l services-config.json`

### Status not appearing on portfolio

**Check**:
1. Verify status checker is running: `pm2 list` or `systemctl status status-checker`
2. Check logs for errors: `pm2 logs status-checker`
3. Verify API endpoint is correct: `curl https://captainaarav.dev/api/status`
4. Check service IDs match expected values

### HTTP health checks failing

**For websites**:
1. Verify health check URL is accessible: `curl https://your-site.com/health`
2. Check if website container is running: `docker ps`
3. Verify network connectivity from server to website
4. Check website logs for errors

## Monitoring

### View Status Checker Logs

**PM2**:
```bash
pm2 logs status-checker --lines 50
```

**Systemd**:
```bash
sudo journalctl -u status-checker -f
```

### Test Status Checker

Run manually to see output:

```bash
cd ~/Portfoliio/api
node server-status-checker.js
```

You should see:
- Docker access verification
- Services being checked
- Status reports being sent
- Success/failure counts

### Verify Status API

Check if services appear in API:

```bash
curl https://captainaarav.dev/api/status | python3 -m json.tool
```

## Performance

The status checker:
- Checks all containers in parallel
- Uses minimal resources
- Runs every 60 seconds by default
- Can be adjusted with `CHECK_INTERVAL` environment variable

## Benefits Over Individual Reporters

- **Single script**: One process monitors all services
- **No container modifications**: No need to add scripts to each container
- **Docker-native**: Uses Docker API for accurate status
- **Resource monitoring**: Gets CPU/RAM usage automatically
- **Simpler deployment**: Just configure and run
- **Centralized logging**: All status checks in one place

## Updating Service List

When you add new services:

1. Add new container to `services-config.json`
2. Restart status checker:
   ```bash
   pm2 restart status-checker
   # or
   sudo systemctl restart status-checker
   ```

No need to restart individual containers!

## Service IDs Reference

Use these service IDs to match your portfolio:

**Discord Bots**:
- Manager Turtle: `manager-turtle-bot`
- Jet2 Manager: `jet2-manager-bot`
- Fatty Bot: `fatty-bot`

**Websites**:
- fattysmp.com: `fattysmp-com`
- fattyhosting.com: `fattyhosting-com`
- aaravsnetflix.com: `aaravsnetflix-com`
- captainaarav.dev: `captainaarav-dev`
