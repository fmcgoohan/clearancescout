#!/usr/bin/env bash
set -eo pipefail

echo "== ClearanceScout Constitution v1.1.0 Static Spec Check Gate =="

ERRORS=0

# 1. Check for raw emojis in markup/tsx/ts files using perl
echo "Checking for raw emojis in src/..."
EMOJI_MATCHES=$(perl -ne 'print "$ARGV:$.: $_" if /[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/' $(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.html" \) ! -path "*/tests/*") || true)
if [ -n "$EMOJI_MATCHES" ]; then
  echo "❌ FAIL: Raw emoji characters found in src/:"
  echo "$EMOJI_MATCHES"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: Zero raw emoji characters in src/"
fi

# 2. Check for hex colors outside token block in src/index.css
echo "Checking for raw hex colors outside index.css token definitions..."
HEX_IN_TSX=$(grep -rnE '#[0-9a-fA-F]{3,8}' src/ --include='*.tsx' --include='*.ts' | grep -v 'formatters.ts' || true)
if [ -n "$HEX_IN_TSX" ]; then
  echo "⚠️ Note: Inline styling hex references present in TSX components:"
  echo "$HEX_IN_TSX" | head -n 5
fi

# 3. Check for infinite animations (max 1 infinite animation allowed per Constitution Article 5)
echo "Checking infinite CSS animations..."
INFINITE_COUNT=$(grep -rn 'infinite' src/index.css | wc -l | tr -d ' ' || true)
if [ "$INFINITE_COUNT" -gt 1 ]; then
  echo "❌ FAIL: More than 1 infinite animation found in src/index.css ($INFINITE_COUNT found)"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: Infinite animations within limits ($INFINITE_COUNT found)"
fi

# 4. Check for prefers-reduced-motion media query
echo "Checking prefers-reduced-motion..."
if ! grep -q 'prefers-reduced-motion' src/index.css; then
  echo "❌ FAIL: Missing @media (prefers-reduced-motion) in src/index.css"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: prefers-reduced-motion media query present"
fi

# 5. Check for focus-visible styles
echo "Checking :focus-visible rules..."
if ! grep -q ':focus-visible' src/index.css; then
  echo "❌ FAIL: Missing :focus-visible rules in src/index.css"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: :focus-visible rules present"
fi

# 6. Check for unsafe characters (middot, em-dash, <=) in markup
echo "Checking for raw middot, em-dash, and <= in src/..."
RAW_CHARS=$(perl -ne 'print "$ARGV:$.: $_" if /[·—]|<=/' $(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.html" \) ! -path "*/tests/*") || true)
if [ -n "$RAW_CHARS" ]; then
  echo "❌ FAIL: Raw middot, em-dash, or <= character found in src/ (use HTML entities):"
  echo "$RAW_CHARS"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ PASS: All special typographic characters use HTML entities"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Static Spec Check FAILED with $ERRORS error(s)."
  exit 1
else
  echo "✅ All Static Spec Checks PASSED cleanly!"
  exit 0
fi
