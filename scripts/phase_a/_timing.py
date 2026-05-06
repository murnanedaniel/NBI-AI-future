"""Shared timing helpers for pilot-v5 pipeline.

Each stage appends one record {stage, pid, start, end, elapsed_ms, extra}
to pilot-v5/timing.jsonl. At end-of-run, 99_timing_report.py rolls these up
into pilot-v5/timing.json.
"""

from __future__ import annotations

import json
import os
import pathlib
import time
from contextlib import contextmanager

TIMING_JSONL = pathlib.Path(
    "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/pilot-v5/timing.jsonl"
)


def _append(rec: dict) -> None:
    TIMING_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with open(TIMING_JSONL, "a") as f:
        f.write(json.dumps(rec) + "\n")


@contextmanager
def stage(name: str, pid: str | None = None, extra: dict | None = None):
    t0 = time.time()
    rec: dict = {
        "stage": name,
        "pid": pid,
        "start_ts": t0,
        "pid_pid": os.getpid(),
    }
    if extra:
        rec["extra"] = extra
    err = None
    try:
        yield rec
    except BaseException as e:
        err = repr(e)
        raise
    finally:
        t1 = time.time()
        rec["end_ts"] = t1
        rec["elapsed_ms"] = int((t1 - t0) * 1000)
        if err is not None:
            rec["error"] = err
        _append(rec)


def mark(name: str, pid: str | None, elapsed_ms: int, extra: dict | None = None) -> None:
    rec: dict = {
        "stage": name,
        "pid": pid,
        "elapsed_ms": elapsed_ms,
    }
    if extra:
        rec["extra"] = extra
    _append(rec)
