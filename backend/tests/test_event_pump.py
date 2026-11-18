"""The pump that carries events to the browser and cleans up when the browser disappears."""

import asyncio
import threading

import pytest

from app.services.event_pump import pump


def source(count: int, closed: threading.Event, delay: float = 0.0):
    """A generator like stream_reply: it has a `finally` that must run when it is closed."""
    import time

    try:
        for n in range(count):
            time.sleep(delay)
            yield n
    finally:
        closed.set()


def collect(events, **options):
    async def run():
        return [item async for item in pump(events, **options)]

    return asyncio.run(run())


def test_all_events_arrive_in_order():
    closed = threading.Event()
    assert collect(source(10, closed)) == list(range(10))
    assert closed.wait(1)


def test_an_error_in_the_source_is_raised_for_the_reader():
    def broken():
        yield 1
        raise RuntimeError("boom")

    async def run():
        return [item async for item in pump(broken())]

    with pytest.raises(RuntimeError, match="boom"):
        asyncio.run(run())


def test_closing_the_reader_early_closes_the_source():
    closed = threading.Event()

    async def run():
        stream = pump(source(1000, closed, delay=0.01))
        assert await stream.__anext__() == 0
        await stream.aclose()

    asyncio.run(run())
    assert closed.wait(2), "the source was not closed"


def test_a_reader_that_just_disappears_gets_the_source_closed_after_the_idle_limit():
    """This is the real Stop button: the web server stops reading and tells nobody."""
    closed = threading.Event()
    state = {}

    async def run():
        stream = pump(source(1000, closed), idle_limit=0.5)
        state["first"] = await stream.__anext__()
        # ...and then nothing: no more reading, no close.

    asyncio.run(run())
    assert state["first"] == 0
    assert closed.wait(5), "an abandoned source was never closed"
