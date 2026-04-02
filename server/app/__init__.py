import threading
import logging
import os
from flask import Flask
from .config import Config
from .mqtt_handler import start_mqtt_client
from .routes import bp as main_bp
from .broadcaster import EventBroadcaster
from .timeout_checker import start_timeout_checker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "..", "templates"),
    )
    app.config.from_object(Config)

    app.broadcaster = EventBroadcaster()

    app.register_blueprint(main_bp)

    mqtt_thread = threading.Thread(target=start_mqtt_client, args=(app,), daemon=True)
    mqtt_thread.start()
    logger.info("MQTT subscriber started in background thread")

    start_timeout_checker(app)

    logger.info("LightMap server ready")
    return app
