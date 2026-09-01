#!/usr/bin/env python3
"""Block Schedule calls that use an early-termination condition.

Those calls deadlock: the pending schedule holds the condition, so the next
Schedule is rejected with a conflicting-condition error and the wait never
happens.
"""
import json
import pathlib
import sys

DENY_MSG = (
    "Blocked: scheduling with an early-termination condition deadlocks against "
    "its own prior schedule task. Instead, wait inside a single run_command "
    "call using a blocking loop: "
    "for i in $(seq 1 30); do <status command> && break; sleep 20; done"
)

LOG = pathlib.Path("/tmp/agy-hook-log.jsonl")


def walk_keys(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield str(key)
            yield from walk_keys(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from walk_keys(item)


def has_early_termination(args):
    for key in walk_keys(args):
        lowered = key.lower().replace("_", "")
        if "termination" in lowered or "earlytermination" in lowered:
            return True
    return False


try:
    payload = json.load(sys.stdin)
except Exception:
    print(json.dumps({"decision": "allow"}))
    sys.exit(0)

try:
    LOG.open("a").write(json.dumps(payload) + "\n")
except Exception:
    pass

tool_call = payload.get("toolCall") or {}
name = str(tool_call.get("name") or "")
args = tool_call.get("args") or {}

is_schedule = "schedule" in name.lower()
if is_schedule and has_early_termination(args):
    print(json.dumps({"decision": "deny", "reason": DENY_MSG}))
else:
    print(json.dumps({"decision": "allow"}))
