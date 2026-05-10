# REQUIRED: Read Memory Bank on Start

Every session must read the memory bank files before proceeding:

```
.agents/memory/MEMORY.md        # Index - start here
.agents/memory/activeContext.md # Current work focus
.agents/memory/progress.md      # Milestone status + version history
```

Memory bank files override anything in other rule files if they conflict. Always check memory bank first for:
- Current milestone and what's in progress
- Per-package versions
- Recent decisions and open questions
- Known issues
