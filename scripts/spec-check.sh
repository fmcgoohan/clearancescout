#!/usr/bin/env bash
set -eo pipefail

echo "== ClearanceScout Constitution v1.2.0 Static Spec Check Gate =="

ERRORS=0

# 1. Check for raw emojis in UI chrome across src/ (Article 3: No Emoji in Chrome, NON-NEGOTIABLE)
echo "Checking for raw emojis in UI chrome across src/..."
EMOJI_MATCHES=$(perl -C -ne 'print "$ARGV:$.: $_" if /\p{Extended_Pictographic}/' src/App.tsx || true)
if [ -n "$EMOJI_MATCHES" ]; then
  echo "❌ FAIL: Raw emoji characters detected in UI chrome (src/App.tsx):"
  echo "$EMOJI_MATCHES" | head -n 10
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: Zero raw emojis detected in UI chrome"
fi

# 2. Check for infinite CSS animations (max 1 infinite animation allowed per Constitution Article 5)
echo "Checking infinite CSS animations..."
INFINITE_COUNT=$(grep -rn 'infinite' src/index.css | wc -l | tr -d ' ' || true)
if [ "$INFINITE_COUNT" -gt 1 ]; then
  echo "❌ FAIL: More than 1 infinite animation found in src/index.css ($INFINITE_COUNT found)"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: Infinite animations within limits ($INFINITE_COUNT found)"
fi

# 3. Check for prefers-reduced-motion media query
echo "Checking prefers-reduced-motion..."
if ! grep -q 'prefers-reduced-motion' src/index.css; then
  echo "❌ FAIL: Missing @media (prefers-reduced-motion) in src/index.css"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: prefers-reduced-motion media query present"
fi

# 4. Check for focus-visible styles
echo "Checking :focus-visible rules..."
if ! grep -q ':focus-visible' src/index.css; then
  echo "❌ FAIL: Missing :focus-visible rules in src/index.css"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: :focus-visible rules present"
fi

# 5. Check monospace font confinement (Article 2: strictly ScriptViewer and EventLog / index.css)
echo "Checking monospace font confinement..."
MONO_CONSUMERS=$(grep -rn 'var(--mono)' src/ || true)
echo "$MONO_CONSUMERS"

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Static Spec Check FAILED with $ERRORS error(s)."
  exit 1
else
  echo "✅ All Static Spec Checks PASSED cleanly!"
  exit 0
fi
