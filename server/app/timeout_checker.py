import time
import threading
import logging
from datetime import datetime, timedelta, timezone
from .models import get_db_context

logger = logging.getLogger(__name__)


def start_timeout_checker(app):
    def checker():
        timeout = app.config["STATUS_TIMEOUT_SECONDS"]

        while True:
            time.sleep(60)
            try:
                with app.app_context():
                    with get_db_context() as conn:
                        cutoff = (
                            (datetime.now(timezone.utc) - timedelta(seconds=timeout))
                            .isoformat()
                            .replace("+00:00", "Z")
                        )

                        conn.execute(
                            """
                            UPDATE devices
                            SET last_status = 'OFF'
                            WHERE last_status = 'ON' AND last_timestamp < ?
                            """,
                            (cutoff,),
                        )
                        conn.commit()

                        cursor = conn.execute(
                            "SELECT device_id FROM devices WHERE last_status = 'OFF'"
                        )
                        offline_devices = [
                            row["device_id"] for row in cursor.fetchall()
                        ]

                    if offline_devices:
                        for device_id in offline_devices:
                            app.broadcaster.broadcast(
                                "status_update", {"device_id": device_id}
                            )
                        logger.info(
                            f"Timeout checker: marked {len(offline_devices)} devices as OFF"
                        )
            except Exception as e:
                logger.error(f"Timeout checker error: {e}")

    t = threading.Thread(target=checker, daemon=True)
    t.start()
