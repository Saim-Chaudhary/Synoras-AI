"""Carries events from a blocking generator to the web server, and notices when nobody listens.

Why this exists (decisions A24): when the browser disconnects (the user pressed Stop), the web
server stops reading our events but does NOT reliably tell our code. Nothing is cancelled and no
`finally` runs, so the reply that was half written would never be saved.

So the generator runs in its own thread and hands events over through a small queue:

    thread:  generator -> queue (4 places) -> ...
    server:  ... -> async reader -> browser

If the reader stops (disconnect), the queue fills up and the thread waits. After `idle_limit`
seconds of waiting it gives up and closes the generator. Closing runs the generator's own
clean-up (`finally`), and that is where the half written reply is saved.
The same thing happens at once if the reader is closed normally.
"""

import queue
import threading
import time
from collections.abc import AsyncIterator, Iterator
from typing import TypeVar

import anyio

T = TypeVar("T")

IDLE_LIMIT_SECONDS = 3.0
_QUEUE_SIZE = 4
_END = object()


async def pump(events: Iterator[T], idle_limit: float = IDLE_LIMIT_SECONDS) -> AsyncIterator[T]:
    """Yield every event of `events`. See the module text for what happens on a disconnect."""
    out: queue.Queue = queue.Queue(maxsize=_QUEUE_SIZE)
    abandoned = threading.Event()

    def put(item: object) -> bool:
        """Put an item in the queue. False means: nobody is reading, stop."""
        waiting_since = time.monotonic()
        while not abandoned.is_set():
            try:
                out.put(item, timeout=0.2)
                return True
            except queue.Full:
                if time.monotonic() - waiting_since > idle_limit:
                    abandoned.set()
        return False

    def run() -> None:
        try:
            for event in events:
                if not put(event):
                    return
            put(_END)
        except BaseException as error:  # handed to the reader, which raises it there
            put(error)
        finally:
            close = getattr(events, "close", None)
            if close is not None:
                close()  # runs the generator's own clean-up (saves a half written reply)

    threading.Thread(target=run, name="event-pump", daemon=True).start()
    try:
        while True:
            try:
                item = out.get_nowait()
            except queue.Empty:
                await anyio.sleep(0.02)
                continue
            if item is _END:
                return
            if isinstance(item, BaseException):
                raise item
            yield item
    finally:
        abandoned.set()
