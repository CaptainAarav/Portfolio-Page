# Nginx Debugging Guide

## Issue: Sites not loading / API calls timing out

Since multiple sites are affected, this is likely a **host-level nginx reverse proxy** issue, not the container nginx.

## What Changed

1. **Removed API proxy from container nginx** - The host nginx should handle all `/api/*` routing
2. **Frontend now uses relative URLs** (`/api/status`) - Works with any domain
3. **Added detailed logging** - Check browser console and network tab

## Host Nginx Configuration Check

Your host nginx (the one handling `captainaarav.dev`) needs to:

1. **Route `/api/*` to your API server** (port 3001):
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_read_timeout 10s;
       proxy_connect_timeout 5s;
   }
   ```

2. **Route `/` to your portfolio container** (port 8081):
   ```nginx
   location / {
       proxy_pass http://localhost:8081;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

## Diagnostic Steps

### 1. Check Host Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### 2. Check Host Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### 3. Check Host Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

### 4. Test API Endpoint Directly
```bash
# From the host machine
curl http://localhost:3001/api/status

# Should return JSON with services array
```

### 5. Test Through Host Nginx
```bash
# From the host machine
curl http://localhost/api/status
# or
curl https://captainaarav.dev/api/status
```

### 6. Check if API Server is Running
```bash
# Check if port 3001 is listening
sudo netstat -tuln | grep 3001
# or
sudo ss -tuln | grep 3001
```

### 7. Check Container Status
```bash
docker ps
docker logs aarav-portfolio
```

## Common Issues

### Issue: Nginx timeout/502 errors
- **Cause**: API server not running or not accessible
- **Fix**: Start API server on port 3001

### Issue: 504 Gateway Timeout
- **Cause**: Nginx proxy_read_timeout too low, or API server taking too long
- **Fix**: Increase `proxy_read_timeout` in host nginx config

### Issue: Connection refused
- **Cause**: API server not listening on expected port
- **Fix**: Check API server is running and on correct port

### Issue: Other sites also not working
- **Cause**: Host nginx configuration error or nginx not running
- **Fix**: Check host nginx status and configuration

## Browser Debugging

1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for `/api/status` request:
   - **Pending/Failed**: Host nginx not routing correctly
   - **Timeout**: API server not responding or nginx timeout too low
   - **502/503/504**: Backend connection issues
   - **CORS errors**: Missing CORS headers in API server

## Quick Fixes

### If API server is down:
```bash
cd /path/to/api
npm start
# or
pm2 start api/server.js
# or
systemctl start status-api
```

### If host nginx needs restart:
```bash
sudo nginx -t  # Test first!
sudo systemctl restart nginx
```

### If container needs rebuild:
```bash
cd /path/to/portfolio
docker-compose up -d --build
```

## Expected Behavior

- **Production (captainaarav.dev)**: Host nginx routes `/api/*` → API server (3001), `/` → Container (8081)
- **Local (192.168.0.132:8081)**: Direct access to container, API calls go to host nginx (if accessible) or fail gracefully

## Next Steps

1. Check host nginx configuration for `captainaarav.dev`
2. Verify API server is running on port 3001
3. Check host nginx error logs
4. Test API endpoint directly
5. Rebuild container if needed
6. Check browser console/network tab for errors
