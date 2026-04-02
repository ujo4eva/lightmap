import os
from datetime import timedelta


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
