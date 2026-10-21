# ADR-008 — Claude Code context architecture

**Status:** Accepted · 2026-10-21

## Context
Sijil will be built over many Claude Code sessions. Agents should recover context quickly without crawling the
repo or trusting stale summaries.

## Decision
- **`CLAUDE.md`** (root, always loaded, short): what Sijil is, invariants, sources of truth, which doc to read
  per task, workflow and verification rules.
- **`.claude/rules/*.md`** with `paths:` front matter: backend, frontend, API/security and testing
  conventions, loaded only when matching files are involved.
- **`.claude/skills/`**: `implement-slice` and `review-slice` for the two recurring procedures.
- **`docs/README.md`** is the index; each topic has **one** canonical doc. `STATUS.md` = verified facts,
  `ROADMAP.md` = planned scope and authorization, ADRs = decisions.
- **Auto memory** (Claude Code native, machine-local under `~/.claude/projects/<project>/memory/`) holds only
  owner preferences, corrections and recurring pitfalls. Anything other developers or machines need goes into
  version-controlled docs.
- No extra code-navigation or memory server (e.g. Serena) until repository size justifies one.

## Consequences
- \+ Small always-on context; deeper docs loaded on demand.
- − Docs must be updated in the same change as the code, or they mislead (enforced by CLAUDE.md and the
  skills).
