import json
from flask import Blueprint, render_template, Response, jsonify, current_app
from .models import get_all_devices

bp = Blueprint("main", __name__)


@bp.route("/")
def dashboard():
    return render_template("dashboard.html")


@bp.route("/status")
def get_status():
    devices = get_all_devices()
    return jsonify(devices)


@bp.route("/events")
def events():
    app = current_app._get_current_object()
    initial_data = get_all_devices()

    def generate(initial):
        client_queue = app.broadcaster.register()
        try:
            yield f"event: init\ndata: {json.dumps(initial)}\n\n"

            while True:
                try:
                    message = client_queue.get(timeout=30)
                    yield f"event: {message['type']}\ndata: {json.dumps(message['data'])}\n\n"
                except Exception:
                    yield f"event: ping\ndata: {{}}\n\n"
        except GeneratorExit:
            app.broadcaster.unregister(client_queue)

    return Response(generate(initial_data), mimetype="text/event-stream")
