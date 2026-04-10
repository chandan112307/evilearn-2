"""Centralized logging configuration for the EviLearn backend.

Provides structured logging with custom log levels and a strict format:
    [TIMESTAMP] [LEVEL] [MODULE/NODE] message

Custom levels beyond standard Python logging:
    LLM   (25) — All LLM interactions (prompts, responses, parsed outputs, fallbacks)
    STATE (23) — State mutations (input/output values in graph nodes)
    FLOW  (22) — Execution flow markers (node entry/exit, iteration tracking)
    PERF  (21) — Performance metrics (latency, execution time)
"""

import logging
import time
from datetime import datetime, timezone
from functools import wraps
from typing import Any

# ---------------------------------------------------------------------------
# Custom log levels
# ---------------------------------------------------------------------------

LLM_LEVEL = 25
STATE_LEVEL = 23
FLOW_LEVEL = 22
PERF_LEVEL = 21

logging.addLevelName(LLM_LEVEL, "LLM")
logging.addLevelName(STATE_LEVEL, "STATE")
logging.addLevelName(FLOW_LEVEL, "FLOW")
logging.addLevelName(PERF_LEVEL, "PERF")


# ---------------------------------------------------------------------------
# Custom Logger class with convenience methods
# ---------------------------------------------------------------------------

class EviLearnLogger(logging.Logger):
    """Extended logger with custom level methods."""

    def llm(self, msg: str, *args: Any, **kwargs: Any) -> None:
        if self.isEnabledFor(LLM_LEVEL):
            self._log(LLM_LEVEL, msg, args, **kwargs)

    def state(self, msg: str, *args: Any, **kwargs: Any) -> None:
        if self.isEnabledFor(STATE_LEVEL):
            self._log(STATE_LEVEL, msg, args, **kwargs)

    def flow(self, msg: str, *args: Any, **kwargs: Any) -> None:
        if self.isEnabledFor(FLOW_LEVEL):
            self._log(FLOW_LEVEL, msg, args, **kwargs)

    def perf(self, msg: str, *args: Any, **kwargs: Any) -> None:
        if self.isEnabledFor(PERF_LEVEL):
            self._log(PERF_LEVEL, msg, args, **kwargs)


logging.setLoggerClass(EviLearnLogger)


# ---------------------------------------------------------------------------
# Formatter — strict [TIMESTAMP] [LEVEL] [MODULE/NODE] message
# ---------------------------------------------------------------------------

class EviLearnFormatter(logging.Formatter):
    """Produces: [2026-04-10T03:55:03Z] [INFO] [module_name] message"""

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
        level = record.levelname
        module = record.name
        msg = record.getMessage()
        return f"[{ts}] [{level}] [{module}] {msg}"


# ---------------------------------------------------------------------------
# Module-level helper to get a configured logger
# ---------------------------------------------------------------------------

_handler_installed = False


def get_logger(name: str) -> EviLearnLogger:
    """Return a named logger with the EviLearn format.

    Args:
        name: Logger name, typically the module or node name.

    Returns:
        Configured EviLearnLogger instance.
    """
    global _handler_installed

    logger = logging.getLogger(name)

    if not _handler_installed:
        # Configure the root logger once
        root = logging.getLogger()
        root.setLevel(PERF_LEVEL)  # Capture all custom levels

        handler = logging.StreamHandler()
        handler.setFormatter(EviLearnFormatter())
        root.addHandler(handler)
        _handler_installed = True

    return logger  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Performance timing decorator
# ---------------------------------------------------------------------------

def log_execution_time(logger_name: str):
    """Decorator that logs function execution time at PERF level.

    Args:
        logger_name: Logger name for the timing message.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            log = get_logger(logger_name)
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                elapsed_ms = (time.perf_counter() - start) * 1000
                log.perf(f"{func.__name__} completed in {elapsed_ms:.1f}ms")
                return result
            except Exception:
                elapsed_ms = (time.perf_counter() - start) * 1000
                log.perf(f"{func.__name__} failed after {elapsed_ms:.1f}ms")
                raise
        return wrapper
    return decorator
