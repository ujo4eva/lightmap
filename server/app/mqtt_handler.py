import paho.mqtt.client as mqtt
from .models import update_device, init_db
from .config import BUILDING_NAMES
import logging
import time

logger = logging.getLogger(__name__)
_mqtt_app = None


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    if reason_code != 0:
        logger.warning(
            f"⚠️ Disconnected from MQTT broker (code {reason_code}), attempting reconnect..."
        )
    else:
        logger.info("Disconnected from MQTT broker")


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")
        topic = msg.topic

        logger.info(f"📨 Received on {topic}: {payload}")

        topic_parts = topic.split("/")
        if len(topic_parts) >= 3:
            last_part = topic_parts[-1]
            if last_part in ("status", "online", "offline"):
                device_id = topic_parts[-2]
            else:
                device_id = last_part
        else:
            device_id = topic

        is_offline_topic = topic.endswith("/offline")
        is_offline_payload = "offline" in payload.lower()

        if is_offline_topic or is_offline_payload:
            status = "OFF"
        else:
            status = "ON"

        boot_count = None
        ip = None
        if "|" in payload:
            parts = payload.split("|")
            for part in parts:
                part = part.strip()
                if part.startswith("boot:"):
                    try:
                        boot_count = int(part.split(":")[1])
                    except:
                        pass
                elif part.startswith("IP:"):
                    ip = part.split(":")[1].strip()

        building_name = BUILDING_NAMES.get(device_id, None)

        with _mqtt_app.app_context():
            update_device(
                device_id=device_id,
                status=status,
                message=payload,
                boot_count=boot_count,
                ip=ip,
                building_name=building_name,
            )
            _mqtt_app.broadcaster.broadcast("status_update", {"device_id": device_id})

        status_str = "⚡ ON" if status == "ON" else "❌ OFF"
        logger.info(f"✅ Updated device {device_id} → {status_str}")

    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")


def start_mqtt_client(app):
    """Run in background thread with reconnection logic"""
    global _mqtt_app
    _mqtt_app = app

    with app.app_context():
        init_db()
        mqtt_broker = app.config["MQTT_BROKER"]
        mqtt_port = app.config["MQTT_PORT"]
        mqtt_client_id = app.config["MQTT_CLIENT_ID"]
        mqtt_topic = app.config["MQTT_TOPIC"]

    reconnect_delay = 5
    max_reconnect_delay = 60

    def on_connect_wrapper(client, userdata, connect_flags, reason_code, properties):
        if reason_code == 0:
            logger.info("✅ Connected to MQTT broker")
            client.subscribe(mqtt_topic)
            logger.info(f"Subscribed to {mqtt_topic}")
        else:
            logger.error(f"❌ MQTT connection failed with code {reason_code}")

    while True:
        try:
            client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=mqtt_client_id,
            )
            client.on_connect = on_connect_wrapper
            client.on_disconnect = on_disconnect
            client.on_message = on_message

            client.connect(mqtt_broker, mqtt_port, 60)
            logger.info(f"Connecting to MQTT broker at {mqtt_broker}:{mqtt_port}")
            reconnect_delay = 5
            client.loop_forever()
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")
            logger.info(f"Reconnecting in {reconnect_delay} seconds...")
            time.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)
