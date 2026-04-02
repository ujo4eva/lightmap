# LightMap - Campus Power Monitor

IoT system for monitoring power status of campus buildings using ESP32 devices.

## Quick Start

### 1. Flash ESP32 Firmware
```bash
# Edit wifi credentials in firmware/nodeMCU-32S-auditorium/nodeMCU-32S-auditorium.ino
# Upload using Arduino IDE or PlatformIO
```

### 2. Start the Server
```bash
cd server
uv run python run.py
```

### 3. View Dashboard
Open `http://localhost:5000` in your browser.

## Architecture

```
ESP32 Devices → MQTT Broker → Flask Server → SQLite DB → Dashboard (SSE)
```

- **ESP32**: Deep sleeps for 5 minutes, wakes to send heartbeat via MQTT
- **MQTT Broker**: broker.emqx.io (public broker)
- **Server**: Flask app with real-time SSE updates
- **Dashboard**: Bootstrap-based UI with auto-refresh

## Adding New Devices

1. Add device ID to `server/app/config.py`:
```python
BUILDING_NAMES = {
    "esp32-001": "Auditorium",
    "esp32-002": "Your Building",
}
```

2. Flash the firmware with matching device ID in the Arduino sketch.

## Features

- Real-time status updates via Server-Sent Events
- Automatic offline detection (LWT + timeout checker)
- Local timezone display
- Manual refresh + auto-refresh toggle
- Mobile-responsive design

## Project Structure

```
lightmap/
├── firmware/           # ESP32 Arduino sketches
│   └── nodeMCU-32S-auditorium/
└── server/             # Flask backend
    ├── app/
    │   ├── __init__.py
    │   ├── broadcaster.py    # SSE event broadcasting
    │   ├── mqtt_handler.py # MQTT subscriber
    │   ├── timeout_checker.py
    │   └── ...
    └── templates/
        └── dashboard.html
```
