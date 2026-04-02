import os
from datetime import timedelta


BUILDING_NAMES = {
    "esp32-001": "Auditorium",
    "esp32-002": "Library",
    "esp32-003": "Science Block",
    "esp32-004": "Admin Building",
    "esp32-005": "Sports Complex",
}


class Config:
    SECRET_KEY = os.urandom(24)
    SQLALCHEMY_DATABASE_URI = "sqlite:///instance/power_monitor.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # MQTT Configuration
    MQTT_BROKER = "broker.emqx.io"
    MQTT_PORT = 1883
    MQTT_CLIENT_ID = "lightmap-server"
    MQTT_TOPIC = "campus/power/#"

    # Status timeout (how long without heartbeat before marking OFF)
    STATUS_TIMEOUT_SECONDS = 10 * 60
