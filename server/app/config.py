import os


BUILDING_NAMES = {
    "esp32-001": "Auditorium",
    "esp32-002": "Library",
    "esp32-003": "Science Block",
    "esp32-004": "Admin Building",
    "esp32-005": "Sports Complex",
}


def _get_default_db_path():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    instance_dir = os.path.join(base_dir, "instance")
    os.makedirs(instance_dir, exist_ok=True)
    return f"sqlite:///{os.path.join(instance_dir, 'power_monitor.db')}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or os.urandom(24)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or _get_default_db_path()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # MQTT Configuration (defaults work for development, override in production)
    MQTT_BROKER = os.environ.get("MQTT_BROKER", "broker.emqx.io")
    MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
    MQTT_CLIENT_ID = os.environ.get("MQTT_CLIENT_ID", "lightmap-server")
    MQTT_TOPIC = os.environ.get("MQTT_TOPIC", "campus/power/#")

    # Status timeout (how long without heartbeat before marking OFF)
    STATUS_TIMEOUT_SECONDS = int(
        os.environ.get("STATUS_TIMEOUT_SECONDS", "600")
    )  # 10 minutes
