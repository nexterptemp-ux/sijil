# Document storage strategy

Decision: [ADR-006](../decisions/ADR-006-document-identity-versions-links.md). Code:
`sijil/services/documents.py`, `sijil/services/folders.py`, the Document/Version/Link/Folder controllers.

## Three concepts
| Concept | DocType | Mutable? |
|---|---|---|
| Logical identity (title, type, reference, date, confidentiality, folder) | Sijil Document | Metadata yes; land no |
| Stored bytes | Sijil Document Version → private File | Never |
| Use of a document by a record | Sijil Document Link | Created/removed only |

## Upload
`upload_document` (multipart) → `create_document`: inserts the Document, stores the bytes as a private File,
inserts Version 1 (version controller numbers it under a row lock, re-attaches the File to the version,
forces it private, marks it current), and optionally links it to `link_doctype/link_name`.
`upload_version` adds version N+1 the same way. One upload = one File, ever.

## Linking
`link_document(document, linked_doctype, linked_name, document_version?, follow_latest?)`:
- target ∈ Land, Case, Case Event, Task, Follow Up; same land as the document;
- needs read on the document; write on the target (read is enough for a Case Event, which is immutable);
- pins `document_version` = given version or current version; `follow_latest=1` always resolves to the
  current version;
- one link per document/target pair.

Reading links (`describe_link`) returns the pinned version and `has_newer_version`, so a historical event keeps
showing exactly the approved file it referenced.

## Folders
Per land, tree via `parent_folder` and a materialized `folder_path` (`/FLD-…/FLD-…/`) for subtree queries.
Created from the Settings folder template when a land is created; the root folder carries the land name.
Folders organize only — they own no business meaning, and moving a document between folders changes nothing
else.

## Deletion and archiving
A linked document cannot be deleted (archive it: `archived = 1` hides it from the picker). Versions cannot be
deleted individually. Unlinking from an event is manager-only. Deleting an unlinked document deletes its
versions (and their Files).

## Not in scope yet
Full-text search inside files, previews/thumbnails, OCR, per-document access lists, retention policies,
external storage (S3). The model allows adding each without changing links.
