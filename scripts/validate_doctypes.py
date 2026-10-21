#!/usr/bin/env python3
"""Developer tool: structural sanity checks for the app's DocType JSON files.

    python3 scripts/validate_doctypes.py [path/to/frappe/checkout path/to/erpnext/checkout ...]

Without arguments, links to Frappe/ERPNext doctypes are checked against a built-in list.
Passing checkouts of frappe and erpnext makes the check exhaustive.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "sijil"
VALID_TYPES = set(
	"""Autocomplete,Attach,Attach Image,Barcode,Button,Check,Code,Color,Column Break,Currency,Data,Date,Datetime,
Dynamic Link,Duration,Float,Fold,Geolocation,Heading,HTML,HTML Editor,Icon,Image,Int,JSON,Link,Long Text,Markdown Editor,
Password,Percent,Phone,Read Only,Rating,Section Break,Select,Signature,Small Text,Tab Break,Table,Table MultiSelect,Text,
Text Editor,Time""".replace("\n", "").split(",")
)
BUILTIN_EXTERNAL = {
	"User", "Company", "Project", "Task", "Supplier", "Customer", "Contact", "ToDo", "Event", "DocType", "Role",
	"File", "Notification Log", "Employee", "Email Queue",
}
RESERVED = {"doctype", "meta", "flags", "parent_doc", "name", "owner", "creation", "modified", "modified_by", "docstatus", "idx"}


def external_doctypes(paths):
	names = set(BUILTIN_EXTERNAL)
	for p in paths:
		for f in Path(p).rglob("doctype/*/*.json"):
			if f.stem == f.parent.name:
				try:
					names.add(json.loads(f.read_text())["name"])
				except Exception:
					pass
	return names


def main():
	own = {}
	for f in ROOT.rglob("doctype/*/*.json"):
		if f.stem == f.parent.name:
			d = json.loads(f.read_text(encoding="utf-8"))
			own[d["name"]] = (f, d)
	known = set(own) | external_doctypes(sys.argv[1:])
	errors = []

	for name, (path, d) in sorted(own.items()):
		def err(msg):
			errors.append(f"{name}: {msg}")

		fields = d.get("fields", [])
		fieldnames = [f["fieldname"] for f in fields]
		if len(set(fieldnames)) != len(fieldnames):
			err("duplicate fieldnames " + str({x for x in fieldnames if fieldnames.count(x) > 1}))
		if d.get("field_order") != fieldnames:
			err("field_order does not match fields")
		by = {f["fieldname"]: f for f in fields}
		for f in fields:
			fn, ft = f["fieldname"], f["fieldtype"]
			if ft not in VALID_TYPES:
				err(f"{fn}: unknown fieldtype {ft}")
			if fn in RESERVED:
				err(f"{fn}: reserved fieldname")
			if not re.fullmatch(r"[a-z][a-z0-9_]*", fn):
				err(f"{fn}: illegal fieldname")
			opts = f.get("options") or ""
			if ft in ("Link", "Table", "Table MultiSelect") and opts not in known:
				err(f"{fn}: {ft} to unknown doctype {opts!r}")
			if ft == "Dynamic Link":
				t = by.get(opts)
				if not t or not (t["fieldtype"] == "Select" or (t["fieldtype"] == "Link" and t.get("options") == "DocType")):
					err(f"{fn}: Dynamic Link options {opts!r} must name a Select / Link-to-DocType field")
			if ft == "Select":
				choices = opts.split("\n")
				if f.get("default") not in (None, "") and f["default"] not in choices and f["default"] not in ("Today",):
					err(f"{fn}: default {f['default']!r} not in options")
				if f.get("reqd") and not [c for c in choices if c]:
					err(f"{fn}: required Select without options")
			if f.get("fetch_from"):
				src = f["fetch_from"].split(".")[0]
				if src not in by or by[src]["fieldtype"] != "Link":
					err(f"{fn}: fetch_from {f['fetch_from']!r} needs a Link field {src!r}")
			if f.get("depends_on") and f["depends_on"].startswith("eval:") is False and f["depends_on"] not in by:
				err(f"{fn}: depends_on field {f['depends_on']!r} missing")
		for key in ("title_field", "sort_field"):
			v = d.get(key)
			if v and v not in by and v not in ("modified", "creation", "name"):
				err(f"{key} {v!r} is not a field")
		for s in (d.get("search_fields") or "").split(","):
			if s and s.strip() not in by:
				err(f"search_fields: {s!r} is not a field")
		auto = d.get("autoname") or ""
		if auto.startswith("field:") and auto[6:] not in by:
			err(f"autoname {auto!r} names a missing field")
		if not d.get("istable") and not d.get("permissions"):
			err("no permissions")
		if d.get("istable") and d.get("permissions"):
			err("child table must not define permissions")
		if d.get("issingle") and auto:
			err("single doctype should not have autoname")
		pyfile = path.with_suffix(".py")
		if not pyfile.exists():
			err("controller missing")
		else:
			cls = name.replace(" ", "")
			if f"class {cls}(" not in pyfile.read_text():
				err(f"controller class {cls} not found in {pyfile.name}")
	print(f"{len(own)} doctypes checked")
	for e in errors:
		print("ERROR", e)
	return 1 if errors else 0


if __name__ == "__main__":
	sys.exit(main())
