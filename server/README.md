# LightMap Server

Flask backend for the LightMap IoT power monitoring system.

## Setup

```bash
# Install dependencies
uv sync

# Run the server
uv run python run.py
```

## Configuration

Configuration can be set via environment variables or by editing `app/config.py`:

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MQTT_BROKER` | broker.emqx.io | MQTT broker hostname |
| `MQTT_PORT` | 1883 | MQTT broker port |
| `MQTT_CLIENT_ID` | lightmap-server | MQTT client ID |
| `MQTT_TOPIC` | campus/power/# | MQTT topic subscription |
| `STATUS_TIMEOUT_SECONDS` | 600 | Seconds before marking device offline |
| `SECRET_KEY` | auto-generated | Flask secret key |
| `DATABASE_URL` | sqlite://... | Database connection string |

### config.py

```python
# MQTT Settings
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "campus/power/#"

# Device Names
BUILDING_NAMES = {
    "esp32-001": "Auditorium",
    "esp32-002": "Library",
}

# Offline timeout (seconds)
STATUS_TIMEOUT_SECONDS = 600  # 10 minutes
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard web page |
| `/health` | GET | Health check (for containers/orchestration) |
| `/status` | GET | JSON list of all devices |
| `/events` | GET | SSE stream for real-time updates |

## MQTT Topics

Devices publish to:
- `campus/power/<device-id>/status` - Online status (retained)
- `campus/power/<device-id>/offline` - LWT topic (retained)

Example payload:
```
online | boot:1 | IP:192.168.1.100
```

## Database

SQLite database at `instance/power_monitor.db`:

```sql
CREATE TABLE devices (
    device_id TEXT PRIMARY KEY,
    building_name TEXT,
    last_status TEXT,
    last_timestamp DATETIME,
    last_message TEXT,
    boot_count INTEGER,
    last_ip TEXT
);
```
