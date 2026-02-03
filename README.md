# Aarav Sahni - Portfolio

Aviation/Tech themed portfolio website built with React.

## Docker Deployment (Raspberry Pi)

This portfolio is designed to run 24/7 in a Docker container on a Raspberry Pi.

### Prerequisites

- Docker and Docker Compose installed on your Raspberry Pi
- Port 8080 available (or modify in docker-compose.yml)

### Quick Start

1. **Build and start the container:**

   ```bash
   docker-compose up -d --build
   ```

2. **Access the portfolio:**
   - Local: http://localhost:8080
   - Network: http://your-raspberry-pi-ip:8080

### Management Commands

- **View logs:**

  ```bash
  docker-compose logs -f
  ```

- **Stop the container:**

  ```bash
  docker-compose down
  ```

- **Restart the container:**

  ```bash
  docker-compose restart
  ```

- **Rebuild after code changes:**

  ```bash
  docker-compose up -d --build
  ```

- **View container status:**
  ```bash
  docker-compose ps
  ```

### Auto-start on Boot

The container is configured with `restart: unless-stopped`, so it will automatically start when your Raspberry Pi boots up.

### Port Configuration

By default, the portfolio runs on port 8080. To change this, edit the `docker-compose.yml` file:

```yaml
ports:
  - "YOUR_PORT:80" # Change YOUR_PORT to desired port
```

### Reverse Proxy Setup (Optional)

If you want to use a reverse proxy (like Nginx or Traefik) on your Raspberry Pi:

1. Run the container on a different port (e.g., 8081)
2. Configure your reverse proxy to forward requests to `localhost:8081`

## Development

### Local Development

```bash
npm install
npm start
```

### Build for Production

```bash
npm run build
```

## Technologies

- React 18
- HTML5/CSS3
- JavaScript
- Docker
- Nginx
