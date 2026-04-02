import threading
import queue


class EventBroadcaster:
    def __init__(self):
        self._queue = queue.Queue()
        self._client_queues = []
        self._lock = threading.Lock()

    def broadcast(self, event_type: str, data: dict):
        message = {"type": event_type, "data": data}
        with self._lock:
            for client_queue in self._client_queues[:]:
                try:
                    client_queue.put_nowait(message)
                except queue.Full:
                    pass

    def register(self) -> queue.Queue:
        client_queue = queue.Queue(maxsize=10)
        with self._lock:
            self._client_queues.append(client_queue)
        return client_queue

    def unregister(self, client_queue: queue.Queue):
        with self._lock:
            if client_queue in self._client_queues:
                self._client_queues.remove(client_queue)
