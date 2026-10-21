import frappe
from frappe import _
from frappe.utils import formatdate

from sijil.api.common import parse
from sijil.services import reports as report_service

RTL_LANGS = ("ar", "he", "fa", "ur")


def _check_access():
	from sijil.permissions import has_app_permission

	if not has_app_permission():
		frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist()
def available():
	_check_access()
	return [{"key": key, "name": name} for key, (name, _fn) in report_service.REPORTS.items()]


@frappe.whitelist()
def run(report, filters=None):
	_check_access()
	if report not in report_service.REPORTS:
		frappe.throw(_("Unknown report {0}").format(report))
	name, fn = report_service.REPORTS[report]
	columns, rows = fn(parse(filters, {}))
	return {"key": report, "name": name, "columns": columns, "rows": [dict(r) for r in rows]}


def _context(extra):
	lang = frappe.local.lang or "en"
	rtl = lang.split("-")[0] in RTL_LANGS
	return {
		"dir": "rtl" if rtl else "ltr",
		"lang": lang,
		"fd": lambda v: formatdate(v) if v else "—",
		**extra,
	}


def _render(kind, ref):
	if kind == "case":
		ctx = report_service.case_history_context(ref)
		template = "sijil/templates/reports/case_history.html"
		title = _("Case History Report") + " - " + (ctx["case"].title or ref)
	else:
		ctx = report_service.land_history_context(ref)
		template = "sijil/templates/reports/land_history.html"
		title = _("Land / Project History Report") + " - " + (ctx["land"].land_name or ref)
	return title, frappe.render_template(template, _context({"ctx": ctx, "title": title}))


@frappe.whitelist()
def case_history(case):
	title, html = _render("case", case)
	return {"title": title, "html": html}


@frappe.whitelist()
def land_history(land):
	title, html = _render("land", land)
	return {"title": title, "html": html}


def _pdf(kind, ref):
	from frappe.utils.pdf import get_pdf

	title, html = _render(kind, ref)
	frappe.local.response.filename = f"{ref}-history.pdf"
	frappe.local.response.filecontent = get_pdf(html, {"orientation": "Portrait", "margin-top": "12mm", "margin-bottom": "14mm"})
	frappe.local.response.type = "pdf"


@frappe.whitelist()
def case_history_pdf(case):
	_pdf("case", case)


@frappe.whitelist()
def land_history_pdf(land):
	_pdf("land", land)
