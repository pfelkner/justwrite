# Ralph Agent Instructions

## Your Task

1. Read `scripts/ralph/prd.json`
2. Read `scripts/ralph/progress.txt`
   (check Codebase Patterns first)
3. Check you're on the correct branch
4. Pick highest priority story
   where `passes: false`
5. Implement that ONE story
6. Create unit tests for the behavior you implemented.
7. Run typecheck and tests
8. Update AGENTS.md files with learnings
9. Commit: `feat: [ID] - [Title]`
10. Update prd.json: `passes: true`
11. Append learnings to progress.txt
12. Estimate tokens as char_count / 4, multiply by 1.5x for buffer
13. At tokens > 128,000: Halt usage to prevent overflow

## Progress Format

APPEND to progress.txt:

## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---

## Codebase Patterns

Add reusable patterns to the TOP
of progress.txt:

## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React: useRef<Timeout | null>(null)

## Stop Condition
- If cumulative tokens > 128,000: Halt, update AGENTS.md with monitoring insights, and note context limit.

- If ALL stories pass, reply:
<promise>COMPLETE</promise>

Otherwise end normally.
