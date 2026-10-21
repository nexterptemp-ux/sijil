# ADR-006 — Document identity vs immutable versions vs pinned links

**Status:** Accepted (inherited) · 2026-10-21

## Context
One PDF (e.g. a signed approval) supports a land, a case and a specific event. Plans get revised; a historical
event must keep pointing at the version that was approved then. Files must be private.

## Decision
- **Sijil Document** — logical identity and metadata; belongs to one land and one folder.
- **Sijil Document Version** — immutable, numbered; owns a private Frappe File.
- **Sijil Document Link** — document ↔ land/case/event/task/follow-up, pinning a version by default or
  following the latest. Same land only; one link per pair.

Details: [architecture/documents.md](../architecture/documents.md).

## Alternatives
- Plain Frappe attachments — duplicates files per record, no versions, no pinning.
- External DMS — a separate system from the user's point of view; rejected by the requirements.

## Consequences
- \+ No duplicate files; exact historical evidence; permission-checked downloads.
- − More entities and joins; the UI must explain versions and "newer version available".
