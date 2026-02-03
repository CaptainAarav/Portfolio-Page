# Deployment Guide for Raspberry Pi

## Quick Deployment Steps

1. **Transfer files to Raspberry Pi:**

   ```bash
   # From your development machine
   scp -r . pi@your-raspberry-pi-ip:/home/pi/portfolio
   ```

2. **SSH into your Raspberry Pi:**

   ```bash
   ssh pi@your-raspberry-pi-ip
   ```

3. **Navigate to the project directory:**

   ```bash
   cd ~/portfolio
   ```

4. **Build and start the container:**

   ```bash
   docker-compose up -d --build
   ```

5. **Check if it's running:**

   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

6. **Access your portfolio:**
   - From Raspberry Pi: http://localhost:8080
   - From network: http://your-raspberry-pi-ip:8080

## Platform-Specific Notes

### Raspberry Pi 4/5 (64-bit)

The default Dockerfile should work without modifications. These models use ARM64 architecture.

### Older Raspberry Pi Models (32-bit)

If you're using an older Pi (Pi 3 or earlier), you may need to modify the Dockerfile:

```dockerfile
# Use ARMv7 compatible images
FROM --platform=linux/arm/v7 node:18-alpine AS builder
# ... rest of Dockerfile

FROM --platform=linux/arm/v7 nginx:alpine
# ... rest of Dockerfile
```

Or uncomment the platform line in docker-compose.yml:

```yaml
platform: linux/arm/v7
```

## Updating the Portfolio

When you make changes to your portfolio:

1. **Transfer updated files to Raspberry Pi**
2. **Rebuild the container:**
   ```bash
   docker-compose up -d --build
   ```

## Troubleshooting

### Container won't start

- Check logs: `docker-compose logs`
- Verify port 8080 is available: `netstat -tuln | grep 8080`
- Check Docker is running: `sudo systemctl status docker`

### Out of memory errors

- Raspberry Pi may need more swap space
- Try building with: `docker-compose build --no-cache`

### Slow builds

- This is normal on Raspberry Pi - builds can take 5-10 minutes
- Consider building on a faster machine and transferring the image

## Reverse Proxy Setup (Nginx on Host)

If you want to serve the portfolio on port 80/443 with SSL:

1. Install Nginx on Raspberry Pi:

   ```bash
   sudo apt update && sudo apt install nginx
   ```

2. Create Nginx config (`/etc/nginx/sites-available/portfolio`):

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Monitoring

Check container health:

```bash
docker-compose ps
docker stats aarav-portfolio
```

View logs:

```bash
docker-compose logs -f --tail=100
```
