"""Document-library folder helpers."""

import frappe


def create_folder(land, name, parent=None, is_root=0):
	doc = frappe.get_doc(
		{
			"doctype": "Sijil Folder",
			"folder_name": name,
			"land": land,
			"parent_folder": parent,
			"is_root": is_root,
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()
	return doc


def create_land_folders(land):
	"""Create the root folder of a land plus the folders from Sijil Settings."""
	root = create_folder(land.name, land.land_name, None, is_root=1)
	frappe.db.set_value("Sijil Land", land.name, "root_folder", root.name, update_modified=False)
	land.root_folder = root.name

	settings = frappe.get_cached_doc("Sijil Settings")
	for row in settings.get("folder_templates") or []:
		parent = root.name
		for part in [p.strip() for p in (row.folder_path or "").split("/") if p.strip()]:
			existing = frappe.db.get_value(
				"Sijil Folder", {"land": land.name, "parent_folder": parent, "folder_name": part}, "name"
			)
			parent = existing or create_folder(land.name, part, parent).name
	return root


def breadcrumbs(folder_name):
	"""Root-to-folder chain as [{name, folder_name}]."""
	chain, seen = [], set()
	current = folder_name
	while current and current not in seen:
		seen.add(current)
		row = frappe.db.get_value("Sijil Folder", current, ["name", "folder_name", "parent_folder"], as_dict=True)
		if not row:
			break
		chain.append({"name": row.name, "folder_name": row.folder_name})
		current = row.parent_folder
	return list(reversed(chain))


def ensure_path(land, path):
	"""Return the folder name for a 'A/B/C' path below the land's root, creating it as needed."""
	parent = frappe.db.get_value("Sijil Land", land, "root_folder")
	for part in [p.strip() for p in (path or "").split("/") if p.strip()]:
		existing = frappe.db.get_value(
			"Sijil Folder", {"land": land, "parent_folder": parent, "folder_name": part}, "name"
		)
		parent = existing or create_folder(land, part, parent).name
	return parent
