# Prototype review — `design/reference/SIJIL_professional_demo.html`

The file is preserved **unchanged**. It is a single 65 KB HTML file: inline CSS, inline JS, Arabic only,
`dir="rtl"`, Cairo from Google Fonts. Its `<title>` still says "مدار" — the product name is **Sijil (سجل)**.

## Screens and navigation
Sidebar (brand, "workspace" nav, user card) + top bar with breadcrumbs. Pages switched by a global `page`
variable:

| Page | Content |
|---|---|
| Home | Stat tiles (lands, cases, active cases, upcoming follow-ups), cases table |
| Lands | Land cards → land page: description, cases table, land-related tasks |
| All cases | Cases table: case, land, current situation, owner, status, next follow-up |
| Case | Current situation card, development history (default tab), side column with follow-ups, tasks, files |
| Follow-ups centre | Follow-ups list with "record result" flow |
| Tasks | Task list, task modal (create/edit) |
| Documents | Folder tree + breadcrumbs, documents in folder, new folder / new document modals |

Modals: new folder, new document (metadata only), new event, follow-up result, task. Toast feedback.

## Mock data
`initial = { lands, cases, events, documents, folders, followups, tasks }` with string IDs (`l1`, `c1`, …),
Arabic display values as data (status `'جارٍ المتابعة'`, owner `'م. أحمد'`), events holding `docIds`. Saved to
`localStorage`.

## Strengths (kept in the product)
- Case page hierarchy: current situation on top, history as the main stream, side column for follow-ups,
  tasks and files.
- Follow-up completion as one flow (record result → optionally schedule the next).
- "Needs attention" ordering on the dashboard; RTL-first layout; library tree with breadcrumbs.
- Calm visual language: light surfaces, one primary blue, subtle borders/shadows, 16 px radius.

## Deficiencies (and how the product addresses them)
| Prototype | Product |
|---|---|
| Data in `localStorage`, no sharing, permissions, audit or paging | Frappe DocTypes, record-level permissions, server-side paging |
| Events editable/deletable | Append-only events + correction events |
| Documents are names only ("simulation: no real PDF content") | Document + immutable Version (private File) + Link pinned to a version |
| Arabic strings hard-coded, statuses stored as Arabic text | English identifiers, translations (`ar.csv`), `Intl` dates |
| People are free-text names | Frappe Users |
| No ERPNext linkage | Projects, Tasks, ToDo, Calendar, notifications, parties ([erpnext-integration](../architecture/erpnext-integration.md)) |
| Physical CSS (`border-left`, fixed widths) | Logical properties, responsive down to 420 px |
| Global mutable state + string-template rendering | React components + TanStack Query (ADR-003) |
| Follow-up status stored as text | Derived Upcoming / Due Today / Overdue |

## Still missing from the prototype (product must design it)
Event correction UI, document versions and "newer version" hints, linking an existing document, confidential
documents, restricted-mode visibility, reports/PDF, settings and integrations screens, global search,
English/LTR.
