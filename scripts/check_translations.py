#!/usr/bin/env python3
"""Developer tool: find every translatable string of the SIJIL app and compare with
sijil/translations/ar.csv.

    python3 scripts/check_translations.py            # report missing / unused
    python3 scripts/check_translations.py --list     # print all extracted strings

Sources scanned
  * Python / Jinja:   _("...")
  * JavaScript:       __("...")
  * DocType / Report / Workspace / Number Card / Chart JSON: names, labels,
    descriptions and Select options
  * React (frontend/src, excluding mocks/tests): t("...") and `label: "..."` in nav.ts
  * DYNAMIC below:    strings that are translated at runtime through a variable
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "sijil"
FRONTEND = Path(__file__).resolve().parent.parent / "frontend" / "src"
CSV = ROOT / "translations" / "ar.csv"

DYNAMIC = [
	# derived states and statuses translated through __(value)/_(value)
	"Upcoming", "Due Today", "Overdue", "Open", "Completed", "Cancelled", "Current", "Superseded", "Confidential",
	"Archived", "Milestone", "Active", "Available", "Not available",
	# land deletion blockers: _(label)
	"cases", "tasks", "follow-ups", "documents", "folders",
	# throw_immutable(what)
	"Case events",
	# default case types (translated by name)
	"Master Plan Approval", "Municipality Approval", "Organizational Sketch Approval", "Building Permit",
	"Land Subdivision", "Utility Connections", "Consultant Coordination", "Government Correspondence",
	# roles shown in the app
	"Manager", "User",
]

PY_RE = re.compile(r"""\b_\(\s*(?P<q>["'])(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)""", re.S)
JS_RE = re.compile(r"""\b__\(\s*(?P<q>["'`])(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)""", re.S)
TS_RE = re.compile(r"""(?<![\w.])t\(\s*(?P<q>["'`])(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)""", re.S)
NAV_RE = re.compile(r"""\blabel:\s*(?P<q>["'])(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)""")


def unescape(s):
	return s.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")


def scan_code():
	found = {}
	for path in ROOT.rglob("*"):
		if "node_modules" in path.parts or path.suffix not in {".py", ".js", ".html"}:
			continue
		text = path.read_text(encoding="utf-8")
		for rx in (PY_RE, JS_RE):
			for m in rx.finditer(text):
				found.setdefault(unescape(m.group("s")), set()).add(str(path.relative_to(ROOT)))
	return found


def scan_frontend():
	found = {}
	if not FRONTEND.exists():
		return found
	for path in FRONTEND.rglob("*"):
		rel = path.relative_to(FRONTEND)
		if path.suffix not in {".ts", ".tsx"} or rel.parts[0] in ("mocks", "test") or ".test." in path.name:
			continue
		text = path.read_text(encoding="utf-8")
		regexes = (TS_RE, NAV_RE) if path.name == "nav.ts" else (TS_RE,)
		for rx in regexes:
			for m in rx.finditer(text):
				found.setdefault(unescape(m.group("s")), set()).add("frontend/" + rel.as_posix())
	return found


def scan_json():
	found = {}

	def add(s, where):
		if s and isinstance(s, str) and not s.startswith("[") and not re.fullmatch(r"[\d\W]*", s):
			found.setdefault(s, set()).add(where)

	for path in ROOT.rglob("*.json"):
		try:
			d = json.loads(path.read_text(encoding="utf-8"))
		except Exception:
			continue
		if not isinstance(d, dict):
			continue
		rel = str(path.relative_to(ROOT))
		doctype = d.get("doctype")
		if doctype == "DocType":
			add(d["name"], rel)
			add(d.get("description"), rel)
			for f in d.get("fields", []):
				if f["fieldtype"] in ("Column Break",) and not f.get("label"):
					continue
				add(f.get("label"), rel)
				add(f.get("description"), rel)
				if f["fieldtype"] == "Select":
					for o in (f.get("options") or "").split("\n"):
						add(o, rel)
		elif doctype in ("Report", "Number Card", "Dashboard Chart"):
			add(d.get("name"), rel)
			add(d.get("label"), rel)
		elif doctype == "Workspace":
			add(d.get("label"), rel)
			add(d.get("title"), rel)
			for key in ("links", "shortcuts", "number_cards", "charts"):
				for row in d.get(key, []):
					add(row.get("label"), rel)
		elif doctype == "Page":
			add(d.get("title"), rel)
	add("Sijil", "modules.txt")
	return found


def load_csv():
	rows = {}
	if CSV.exists():
		with CSV.open(encoding="utf-8", newline="") as fh:
			for row in csv.reader(fh):
				if len(row) >= 2:
					rows[row[0]] = row[1]
	return rows


def main():
	found = scan_code()
	for k, v in list(scan_json().items()) + list(scan_frontend().items()):
		found.setdefault(k, set()).update(v)
	for s in DYNAMIC:
		found.setdefault(s, set()).add("(dynamic)")
	if "--list" in sys.argv:
		for s in sorted(found):
			print(repr(s))
		return 0
	have = load_csv()
	missing = sorted(s for s in found if s not in have or not have[s].strip())
	unused = sorted(s for s in have if s not in found)
	print(f"{len(found)} translatable strings, {len(have)} entries in ar.csv")
	if missing:
		print(f"\nMISSING ({len(missing)}):")
		for s in missing:
			print("  ", repr(s), "<-", ", ".join(sorted(found[s]))[:70])
	if unused and "--unused" in sys.argv:
		print(f"\nUNUSED ({len(unused)}):")
		for s in unused:
			print("  ", repr(s))
	return 1 if missing else 0


if __name__ == "__main__":
	sys.exit(main())
