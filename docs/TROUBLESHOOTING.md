# LightMap Troubleshooting Guide

Solutions to common issues with the LightMap system.

## ESP32 Issues

### Device Not Connecting to WiFi

**Symptoms:** Serial output shows "Connecting to WiFi..." but never connects.

**Solutions:**
1. Check WiFi credentials in `.ino` file are correct
2. Ensure WiFi network is 2.4GHz (not 5GHz)
3. Check WiFi signal strength at device location
4. Try increasing timeout in code:
   ```cpp
   while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) // 20s instead of 12s
   ```

---

### Device Not Publishing to MQTT

**Symptoms:** WiFi connects but "MQTT connect attempt" fails repeatedly.

**Solutions:**
1. Check MQTT broker is accessible:
   ```bash
   telnet broker.emqx.io 1883
   ```
2. Ensure no firewall blocking port 1883
3. Try different broker (some public brokers have issues)
4. Check client ID is unique (no other device using same ID)

---

### Deep Sleep Not Working

**Symptoms:** Device wakes immediately instead of sleeping for 5 minutes.

**Solutions:**
1. Ensure `esp_deep_sleep_start()` is called (check code)
2. USB power may prevent deep sleep - use battery or external power
3. Check for serial output after sleep (may indicate wake source)

---

### LED Behavior Unexpected

**Symptoms:** LED states don't match documentation.

**Solutions:**
1. LED is active-low on most ESP32 boards (ON = LOW signal)
2. Check your board's LED polarity
3. Some boards have different LED GPIO (not GPIO2)

---

## Server Issues

### Server Won't Start

**Symptoms:** `python run.py` fails with errors.

**Common Causes & Solutions:**

1. **Port in use:**
   ```bash
   lsof -i :5000  # Find process
   kill <PID>     # Kill it
   ```

2. **Database error:**
   ```bash
   rm server/instance/power_monitor.db  # Delete old DB
   # Restart - will recreate
   ```

3. **Missing dependencies:**
   ```bash
   cd server
   uv sync
   ```

---

### MQTT Not Connecting

**Symptoms:** Server logs show "MQTT connection error".

**Solutions:**
1. Check broker is reachable:
   ```bash
   telnet broker.emqx.io 1883
   ```
2. Check broker hostname in `config.py`
3. Try different public broker:
   ```python
   MQTT_BROKER = "test.mosquitto.org"
   ```

---

### SSE Not Working

**Symptoms:** Dashboard shows "Connecting..." but never updates.

**Solutions:**
1. Check browser supports SSE (most modern browsers do)
2. Ensure `/events` endpoint is accessible
3. Check browser console for errors
4. Try different browser to rule out extension issues
5. Check server logs for "SSE error" messages

---

### Dashboard Shows "No devices connected"

**Symptoms:** Dashboard loads but shows empty state.

**Solutions:**
1. Wait for ESP32 to wake and publish (every 5 minutes)
2. Check `/status` API directly:
   ```bash
   curl http://localhost:5000/status
   ```
3. Check database has data:
   ```bash
   sqlite3 server/instance/power_monitor.db "SELECT * FROM devices;"
   ```
4. Check MQTT messages are being received (server logs)

---

### Timestamps Wrong

**Symptoms:** Last seen time is off by hours.

**Solution:**
1. Database stores UTC time with `Z` suffix
2. JavaScript should handle this automatically
3. Check dashboard.js `formatLocalTime()` function

---

## MQTT Topics

### Message Format

Expected payload format:
```
online | boot:N | IP:192.168.1.100
```

**Status Detection:**
- `ON`: Payload contains "online" (case insensitive)
- `OFF`: Payload contains "offline" or topic ends with `/offline`

---

### Topic Structure

| Topic | Purpose |
|-------|---------|
| `campus/power/<device-id>/status` | Device heartbeat |
| `campus/power/<device-id>/offline` | LWT (Last Will) |

---

## Network Debugging

### Check MQTT Connection

```bash
# Subscribe to all topics
mosquitto_sub -t "campus/power/#" -v -h broker.emqx.io

# Or use MQTT Explorer (GUI tool)
```

### Check Server Logs

```bash
# Development mode
cd server
uv run python run.py

# Production
journalctl -u lightmap -f
```

---

## Getting Help

If issues persist:

1. Check server logs for specific error messages
2. Verify all components are running (MQTT broker, server, ESP32)
3. Test each component independently
4. Check GitHub issues or create new one with:
   - Exact error message
   - Steps to reproduce
   - Output of `curl http://localhost:5000/status`
