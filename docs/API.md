# LightMap API Documentation

This document covers all API endpoints provided by the LightMap server.

## Base URL

```
http://localhost:5000
```

## Endpoints

### 1. Dashboard Home

**GET /**

Returns the main dashboard HTML page.

| Response | Code |
|----------|------|
| HTML page | 200 |

---

### 2. Get Device Status

**GET /status**

Returns a JSON array of all registered devices with their current status.

#### Response

```json
[
  {
    "device_id": "esp32-001",
    "building_name": "Auditorium",
    "last_status": "ON",
    "last_timestamp": "2026-04-02T14:30:00.000000Z",
    "last_message": "online | boot:5 | IP:192.168.1.100",
    "boot_count": 5,
    "last_ip": "192.168.1.100"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `device_id` | string | Unique device identifier (e.g., `esp32-001`) |
| `building_name` | string | Human-readable building name |
| `last_status` | string | `ON` or `OFF` |
| `last_timestamp` | string | ISO 8601 timestamp (UTC, Z suffix) |
| `last_message` | string | Raw MQTT payload |
| `boot_count` | integer | Number of deep sleep cycles |
| `last_ip` | string | Device IP address |

| Response | Code |
|----------|------|
| JSON array | 200 |
| Error | 500 |

---

### 3. Server-Sent Events Stream

**GET /events**

Opens a persistent connection for real-time status updates. Uses SSE (Server-Sent Events).

#### Response Format

```
Content-Type: text/event-stream
```

#### Event Types

##### init

Sent on initial connection with full device list.

```json
event: init
data: [{"device_id": "...", "last_status": "ON", ...}]
```

##### status_update

Sent when a device status changes (MQTT message received or timeout).

```json
event: status_update
data: {"device_id": "esp32-001"}
```

**Note:** Upon receiving this event, clients should call `/status` to get the updated device list.

##### ping

Sent every 30 seconds to keep the connection alive.

```json
event: ping
data: {}
```

#### Example JavaScript Client

```javascript
const eventSource = new EventSource('/events');

eventSource.addEventListener('init', (event) => {
    const devices = JSON.parse(event.data);
    console.log('Devices:', devices);
});

eventSource.addEventListener('status_update', async (event) => {
    const data = JSON.parse(event.data);
    console.log('Device changed:', data.device_id);
    
    // Fetch updated list
    const response = await fetch('/status');
    const devices = await response.json();
    updateUI(devices);
});

eventSource.addEventListener('ping', () => {
    console.log('Connection alive');
});

eventSource.onerror = () => {
    console.log('Connection lost, reconnecting...');
};
```

| Response | Code |
|----------|------|
| SSE stream | 200 |

---

## Error Responses

All endpoints may return:

| Response | Code | Body |
|----------|------|------|
| Internal Error | 500 | `{"error": "message"}` |

---

## Rate Limits

None currently implemented. For production, consider adding rate limiting.
