# LightMap Deployment Guide

This guide covers deploying LightMap to production environments.

## Architecture Overview

```
[ESP32 Devices] → [MQTT Broker] → [LightMap Server] → [Users]
                                  ↓
                            [SQLite DB]
```

## Prerequisites

- Python 3.12+
- SQLite
- Network access to MQTT broker (port 1883)

## Development Mode

Run the server in debug mode (development only):

```bash
cd server
uv run python run.py
```

Server runs on `http://0.0.0.0:5000`

## Production Deployment

### Option 1: Standalone Server

#### 1. Run with Gunicorn

Gunicorn is already included in dependencies:

```bash
cd server
uv run gunicorn -w 4 -b 127.0.0.1:5000 "app:create_app()"
```

- `-w 4`: 4 worker processes
- `-b`: Bind address

#### 3. Run Behind Reverse Proxy (Nginx)

Nginx configuration:

```nginx
server {
    listen 80;
    server_name lightmap.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # SSE support
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Option 2: Docker Container

A Dockerfile is provided at the project root.

#### 1. Build

```bash
docker build -t lightmap .
```

#### 2. Run

```bash
# Basic run (database is ephemeral)
docker run -d -p 5000:5000 lightmap

# With persistent database volume
docker run -d -p 5000:5000 -v $(pwd)/server/instance:/app/server/instance lightmap
```

#### 3. Environment Variables

```bash
docker run -d -p 5000:5000 \
  -e MQTT_BROKER=broker.emqx.io \
  -e SECRET_KEY=your-secret-key \
  lightmap
```

### Option 3: Systemd Service

Create `/etc/systemd/system/lightmap.service`:

```ini
[Unit]
Description=LightMap Power Monitor
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/lightmap/server
ExecStart=/opt/lightmap/server/.venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 "app:create_app()"
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable lightmap
sudo systemctl start lightmap
```

## Environment Configuration

### Server Config

Edit `server/app/config.py`:

```python
class Config:
    # Use environment variables for production
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")
    MQTT_BROKER = os.environ.get("MQTT_BROKER", "broker.emqx.io")
    MQTT_PORT = int(os.environ.get("MQTT_PORT", 1883))
    MQTT_CLIENT_ID = "lightmap-server"
    MQTT_TOPIC = "campus/power/#"
    STATUS_TIMEOUT_SECONDS = 10 * 60
```

### Set Environment Variables

```bash
export SECRET_KEY="your-secure-random-key"
export MQTT_BROKER="your-mqtt-broker.com"
export MQTT_PORT=1883
```

## Database Backup

SQLite database is at `server/instance/power_monitor.db`:

```bash
# Manual backup
cp server/instance/power_monitor.db backups/power_monitor-$(date +%Y%m%d).db

# Automated backup (cron)
0 2 * * * cp /opt/lightmap/server/instance/power_monitor.db /backup/lightmap-$(date +\%Y\%m\%d).db
```

## Security Checklist

- [ ] Change `SECRET_KEY` to a random value
- [ ] Use HTTPS behind reverse proxy
- [ ] Configure firewall (allow port 80/443 only)
- [ ] Run server as non-root user
- [ ] Keep dependencies updated

## Monitoring

### Check Server Status

```bash
# Check if running
systemctl status lightmap

# View logs
journalctl -u lightmap -f
```

### Health Check Endpoint

The server includes a built-in health check endpoint:

```bash
curl http://localhost:5000/health
```

Response:
```json
{"status": "ok"}
```

---

## Updating

Pull latest code and restart:

```bash
cd /opt/lightmap
git pull
systemctl restart lightmap
```
