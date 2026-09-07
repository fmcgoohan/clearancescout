# Deploy and test loop

Iterate against localhost:8088 (`npm run dev`). Only deploy to Cloud Run once
tests pass locally. A build+deploy cycle costs ~2.5 minutes and a Cloud Build
charge; do not use it as an inner loop.

Treat Cloud Build, Cloud Run deploy, CI, and long-running tests as asynchronous.
Do not idle or repeatedly poll them if independent work is available. Continue
with the next unblocked task in `tasks.md`. Check the background operation at
reasonable intervals and return to its dependent verification when complete.

Do not wait on `ps | grep "gcloud run deploy"`: during `gcloud builds submit &&
gcloud run deploy` that process does not exist yet, so the loop exits
immediately. The wait predicate must remain valid for the entire wait window.
When a status check is needed, use authoritative APIs, for example:

  gcloud builds list --project clearance-scout-2026 --limit 3

Verify a deploy landed by comparing the live revision's image digest to the
registry digest, not by re-running tests.

Always run tests from the repo root. Trust exit codes; do not judge pass/fail
from stdout prose.

Never use the Schedule tool with an early-termination condition to wait on a
deploy or test. If a Schedule call returns a conflicting-condition error, treat
it as terminal: do not retry, stop, and report.
