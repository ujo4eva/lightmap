# LightMap Hardware Setup Guide

This guide covers the ESP32 hardware setup for the LightMap power monitoring system.

## Supported Hardware

### Recommended Boards

- **ESP32-S3** - Recommended for low power
- **ESP32-WROOM-32** - Common, widely available
- **ESP32-S2** - Alternative option

### Pin Layout (ESP32-WROOM-32)

```
                    +------------------+
                    |                  |
               EN  | 1           22   |  SCK (GPIO22)
               3V3 | 2           21   |  SDA (GPIO21)
               GND | 3           17   |  TX0 (GPIO17)
               GND | 4           16   |  RX0 (GPIO16)
               GND | 5           15   |  GPIO15 (TDO)
    GPIO0    KEY  | 6           2    |  GPIO2  (LED)
    GPIO4    D2   | 7           4    |  GPIO4  (ADC)
    GPIO5    D1   | 8           0    |  GPIO0  (ADC)
               3V3| 9           3.3V |
               GND| 10              |
               Vin| 11         GND   |
               GND| 12              |
                    +------------------+
```

### Status LED (Onboard)

The ESP32 has an onboard LED connected to GPIO2 (blue LED).

| State | LED Behavior |
|-------|--------------|
| WiFi connecting | Off |
| WiFi connected | On |
| MQTT published | On (after success) |
| Deep sleep | Off |

## Power Requirements

### Recommended Power Supply

- **USB power**: 5V/500mA minimum
- **Battery**: LiPo 3.7V with USB charging module

### Deep Sleep Current

| State | Current |
|-------|---------|
| Deep sleep | ~10-20µA |
| WiFi connect | ~70-200mA |
| MQTT publish | ~80-150mA |

**Note:** The device spends most time in deep sleep, extending battery life significantly.

## Flashing the Firmware

### Prerequisites

1. **Arduino IDE** or **PlatformIO**
2. **ESP32 board support** installed

### Arduino IDE Setup

1. Add ESP32 board URL:
   ```
   File → Preferences → Additional Board Manager URLs:
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

2. Install board:
   ```
   Tools → Board → Board Manager → esp32 → Install
   ```

3. Install library:
   ```
   Sketch → Include Library → Manage Libraries → PubSubClient → Install
   ```

### Flashing Steps

1. Edit `nodeMCU-32S-auditorium.ino` with your WiFi credentials:

   ```cpp
   const char* ssid = "Your WiFi Network Name";
   const char* password = "Your WiFi Password";
   ```

2. Set device ID (must match server config):

   ```cpp
   const char* mqtt_clientId = "esp32-001";
   const char* topic_status = "campus/power/esp32-001/status";
   const char* topic_offline = "campus/power/esp32-001/offline";
   ```

3. Connect ESP32 via USB and flash:

   ```
   Tools → Board → ESP32 Dev Module
   Tools → Port → COMx (your port)
   Upload
   ```

### Serial Monitor

Open Serial Monitor (115200 baud) to see debug output:

```
=== ESP32 Power Heartbeat Boot ===
Boot count: 1
Connecting to WiFi.....
WiFi connected. IP: 192.168.1.100
MQTT connect attempt 1 → success!
Published: online | boot:1 | IP:192.168.1.100
Going to deep sleep for 5 minutes...
```

## Adding New Devices

### 1. Server Configuration

Add to `server/app/config.py`:

```python
BUILDING_NAMES = {
    "esp32-001": "Auditorium",
    "esp32-002": "Library",
    "esp32-003": "Your New Building",  # Add here
}
```

### 2. Firmware Configuration

Edit the `.ino` file:

```cpp
const char* mqtt_clientId = "esp32-003";
const char* topic_status = "campus/power/esp32-003/status";
const char* topic_offline = "campus/power/esp32-003/offline";
```

### 3. Flash the Device

Upload the modified firmware to the new ESP32.

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common hardware issues.
