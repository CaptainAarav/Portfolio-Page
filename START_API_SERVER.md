# Starting the API Server

## Problem
Port 3001 is not listening, which means the API server is not running. This causes:
- Page loads to timeout (waiting for `/api/status`)
- Other sites to fail if they depend on this API

## Solution: Start the API Server with PM2

### Step 1: Check if PM2 is installed
```bash
pm2 --version
```

If not installed:
```bash
npm install -g pm2
```

### Step 2: Check if status-api is already running
```bash
pm2 list
```

Look for `status-api` in the list. If it shows "stopped" or "errored", proceed to restart it.

### Step 3: Start the API Server

**Option A: Using ecosystem.config.js (Recommended)**
```bash
cd ~/Portfoliio/api
pm2 start ecosystem.config.js
pm2 save  # Save PM2 process list
```

**Option B: Direct start**
```bash
cd ~/Portfoliio/api
pm2 start server.js --name status-api --env production
pm2 save
```

### Step 4: Verify it's running
```bash
# Check PM2 status
pm2 list

# Check if port 3001 is listening
sudo netstat -tuln | grep 3001

# Test the API endpoint
curl http://localhost:3001/api/status
```

### Step 5: Check logs if there are errors
```bash
pm2 logs status-api --lines 50
```

Look for:
- Database initialization errors
- Port already in use errors
- Missing dependencies

## Common Issues

### Issue: "Cannot find module './database'"
**Cause**: The `database.js` file was missing (it has been recreated)

**Fix**: The `database.js` file has been created. Make sure it exists:
```bash
ls -la ~/Portfoliio/api/database.js
```

If it doesn't exist, copy it from your local machine or recreate it.

### Issue: Port 3001 already in use
```bash
# Find what's using port 3001
sudo lsof -i :3001
# or
sudo netstat -tulpn | grep 3001

# Kill the process if needed
sudo kill -9 <PID>
```

### Issue: PM2 process keeps crashing
Check logs:
```bash
pm2 logs status-api --err
```

Common causes:
- Missing database.js file
- Database file permissions
- Missing npm dependencies

## Auto-start on Boot

To ensure the API server starts automatically on reboot:
```bash
pm2 startup
# Follow the instructions it prints
pm2 save
```

## Verify Everything Works

1. **Check API is responding:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/status
   ```

2. **Check through nginx (if configured):**
   ```bash
   curl http://localhost/api/status
   # or
   curl https://captainaarav.dev/api/status
   ```

3. **Check browser:**
   - Access `captainaarav.dev`
   - Open DevTools → Network tab
   - Look for `/api/status` request
   - Should return 200 OK with JSON data

## Next Steps After Starting

Once the API server is running:
1. Rebuild the portfolio container (if needed): `cd ~/Portfoliio && docker-compose up -d --build`
2. Test the site: `curl https://captainaarav.dev/api/status`
3. Check browser - page should load without timing out
