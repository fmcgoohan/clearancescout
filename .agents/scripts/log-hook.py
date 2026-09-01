#!/usr/bin/env python3
import json
import pathlib
import sys

raw = sys.stdin.read()
pathlib.Path("/tmp/agy-hook-log.jsonl").open("a").write(raw.strip() + "\n")
print(json.dumps({"decision": "allow"}))
