import frappe

ROLES = ["Sijil Manager", "Sijil User"]

DEFAULT_FOLDERS = [
	"Ownership Documents",
	"Ownership Documents/Title Deeds",
	"Ownership Documents/Surveys",
	"Master Plans",
	"Master Plans/Preliminary Plans",
	"Master Plans/Approved Plans",
	"Government Approvals",
	"Government Approvals/Municipality",
	"Government Approvals/Secretary - Mayor Signature",
	"Correspondence",
	"Correspondence/Incoming",
	"Correspondence/Outgoing",
	"Permits",
	"Consultant Documents",
]

DEFAULT_CASE_TYPES = [
	("Master Plan Approval", "Approval of the land master plan"),
	("Municipality Approval", "Approvals issued by the municipality"),
	("Organizational Sketch Approval", "Approval of the organizational sketch"),
	("Building Permit", "Building permit issuance"),
	("Land Subdivision", "Subdivision of the land"),
	("Utility Connections", "Electricity, water and other utility connections"),
	("Consultant Coordination", "Coordination with consultants"),
	("Government Correspondence", "Official correspondence with government bodies"),
]


def before_install():
	ensure_roles()


def after_install():
	ensure_roles()
	ensure_defaults()


def after_migrate():
	ensure_roles()
	ensure_defaults()


def ensure_roles():
	for role in ROLES:
		if not frappe.db.exists("Role", role):
			frappe.get_doc(
				{"doctype": "Role", "role_name": role, "desk_access": 1, "is_custom": 0}
			).insert(ignore_permissions=True)


def ensure_defaults():
	"""Idempotent: only fills what is missing, never overwrites user choices."""
	for type_name, description in DEFAULT_CASE_TYPES:
		if not frappe.db.exists("Sijil Case Type", type_name):
			frappe.get_doc(
				{"doctype": "Sijil Case Type", "type_name": type_name, "description": description}
			).insert(ignore_permissions=True)

	settings = frappe.get_doc("Sijil Settings")
	changed = False
	if not settings.default_company:
		company = frappe.defaults.get_global_default("company") or frappe.db.get_value("Company", {}, "name")
		if company:
			settings.default_company = company
			changed = True
	if not frappe.defaults.get_global_default("sijil_defaults_seeded"):
		# Seed once; afterwards the user's own folder template is never touched.
		if not settings.folder_templates:
			for path in DEFAULT_FOLDERS:
				settings.append("folder_templates", {"folder_path": path})
		changed = True
		frappe.defaults.set_global_default("sijil_defaults_seeded", "1")
	if changed:
		settings.flags.ignore_permissions = True
		settings.save()
	frappe.db.commit()


def make_demo_data():
	"""bench --site <site> execute sijil.install.make_demo_data

	Creates the acceptance scenario from the specification (Konooz Jeddah /
	Master Plan Approval with four weekly follow-ups).  Safe to run once.
	"""
	from frappe.utils import add_days, nowdate

	from sijil.services import cases as case_service

	if frappe.db.exists("Sijil Land", {"land_name": "Konooz Jeddah"}):
		print("Demo data already exists")
		return
	user = frappe.session.user
	org = frappe.get_doc(
		{"doctype": "Sijil External Organization", "organization_name": "Engineering Consultancy (Demo)",
		 "organization_type": "Consultant"}
	).insert(ignore_permissions=True)
	land = frappe.get_doc(
		{"doctype": "Sijil Land", "land_name": "Konooz Jeddah", "city": "Jeddah", "status": "Active",
		 "responsibles": [{"user": user, "responsibility": "Development Engineer"}]}
	).insert(ignore_permissions=True)
	case = frappe.get_doc(
		{"doctype": "Sijil Case", "title": "Master Plan Approval", "land": land.name,
		 "case_type": "Master Plan Approval", "owner_user": user, "status": "In Progress",
		 "external_organization": org.name, "start_date": add_days(nowdate(), -21),
		 "current_situation": "The master plan was handed to the consultant."}
	).insert(ignore_permissions=True)
	steps = [
		(-14, "Technical review completed", "The consultant confirmed the master plan completed its technical review and was submitted for approval.", "Milestone"),
		(-7, "Awaiting signature", "The approval reached the Secretary/Mayor's office and is awaiting signature.", "Contact"),
		(-1, "Secretary/Mayor signature obtained", "The consultant obtained the signature. The next step is the formal approval based on the signature.", "Milestone"),
	]
	for days, title, text, kind in steps:
		case_service.add_event(
			{"case": case.name, "title": title, "description": text, "event_type": kind,
			 "event_date": add_days(nowdate(), days), "communication_method": "Phone",
			 "situation_update": title, "external_organization": org.name}
		)
	frappe.get_doc(
		{"doctype": "Sijil Follow Up", "title": "Follow up on obtaining the formal approval",
		 "case": case.name, "assigned_to": user, "due_date": add_days(nowdate(), 6)}
	).insert(ignore_permissions=True)
	frappe.db.commit()
	print("Demo data created:", land.name, case.name)
