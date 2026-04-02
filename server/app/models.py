from datetime import datetime
import sqlite3
from flask import current_app
from contextlib import contextmanager


def get_db():
    conn = sqlite3.connect(
        current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    )
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db_context():
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist"""
    with get_db_context() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            building_name TEXT,
            last_status TEXT,
            last_timestamp DATETIME,
            last_message TEXT,
            boot_count INTEGER,
            last_ip TEXT
            )
        """)
        conn.commit()


def update_device(
    device_id: str, status: str, message: str, boot_count: int = None, ip: str = None
):
    with get_db_context() as conn:
        now = datetime.utcnow().isoformat()
        building_name = (
            device_id.replace("esp32-", "")
            .replace("-status", "")
            .replace("-", " ")
            .title()
        )
        conn.execute(
            """
            INSERT INTO devices (device_id, building_name, last_status, last_timestamp, last_message, boot_count, last_ip)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(device_id) DO UPDATE SET
                last_status = excluded.last_status,
                last_timestamp = excluded.last_timestamp,
                last_message = excluded.last_message,
                boot_count = excluded.boot_count,
                last_ip = excluded.last_ip
        """,
            (device_id, building_name, status, now, message, boot_count, ip),
        )
        conn.commit()


def get_all_devices() -> list[dict]:
    with get_db_context() as conn:
        rows = conn.execute("SELECT * FROM devices ORDER BY building_name").fetchall()
        return [dict(row) for row in rows]
