#!/bin/bash
set -e


MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Ralph (Stateless Mode)"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "═══ Iteration $i ═══"

  # 1. THE CONTEXT WIPE
  # We delete the .claude directory to ensure a completely fresh context window.
  # The agent starts with zero memory and must read the files as instructed in prompt.md.
  if [ -d ".claude" ]; then
    rm -rf .claude
  fi

  # 2. RUN CLAUDE
  # We pipe ONLY the instructions. The agent will read prd.json/progress.txt itself.
  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" \
      | claude --dangerously-skip-permissions 2>&1 \ the 
      | tee /dev/tty) || true

  # 3. CHECK FOR COMPLETION
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo "✅ Ralph finished successfully!"
    exit 0
  fi

  # Optional: Safety break if output is completely empty
  if [ -z "$OUTPUT" ]; then
      echo "⚠️  Empty output received. Stopping."
      exit 1
  fi

  sleep 2
done

echo "⚠️ Max iterations reached"
exit 1
