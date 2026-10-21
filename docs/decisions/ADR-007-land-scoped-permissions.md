# ADR-007 — Land-scoped record permissions via Frappe hooks

**Status:** Accepted (inherited) · 2026-10-21

## Context
Some employees should see only their lands; confidential documents must be limited further. The frontend must
not be the security boundary.

## Decision
Role permissions on DocTypes, plus `permission_query_conditions` and `has_permission` hooks
(`sijil/permissions.py`) for Land, Case, Case Event, Follow Up, Task, Folder, Document, Document Version and
Document Link. "Restrict to assigned lands" is a Settings switch; confidentiality is per document. Private
file access inherits from the Document Version check. Rules: [architecture/security.md](../architecture/security.md).

## Alternatives
- Frappe User Permissions on Sijil Land — less control over "assigned to me on another land" and over
  confidentiality.
- Filtering inside API endpoints — easy to miss one; Desk and reports would bypass it.

## Consequences
- \+ One place for record rules, applied to lists, documents, reports, search and files.
- − Raw SQL conditions must be escaped and kept in sync with the schema; they must be tested as real users.
