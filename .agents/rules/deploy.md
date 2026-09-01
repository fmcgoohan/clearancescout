# Deploy and test loop

Iterate against localhost:8088 (`npm run dev`). Only deploy to Cloud Run once
tests pass locally. A build+deploy cycle costs ~2.5 minutes and a Cloud Build
charge; do not use it as an inner loop.

Never poll for build completion. Run the build and deploy as one blocking
foreground call and read its exit code. Do not wait on `ps | grep "gcloud run
deploy"`: during `gcloud builds submit && gcloud run deploy` that process does
not exist yet, so the loop exits immediately. The wait predicate must remain
valid for the entire wait window.

If you need status afterward:

  gcloud builds list --project clearance-scout-2026 --limit 3

Verify a deploy landed by comparing the live revision's image digest to the
registry digest, not by re-running tests.

Always run tests from the repo root. Trust exit codes; do not judge pass/fail
from stdout prose.

Never use the Schedule tool with an early-termination condition to wait on a
deploy or test. If a Schedule call returns a conflicting-condition error, treat
it as terminal: do not retry, stop, and report.
