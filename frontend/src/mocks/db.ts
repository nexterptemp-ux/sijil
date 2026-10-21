// In-memory data for `npm run dev:mock` and tests. Field names match the DocTypes exactly;
// see docs/architecture/domain-model.md. Dates are relative to the real current date.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;

export function isoDate(offsetDays = 0, from = new Date()): string {
	const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${mm}-${dd}`;
}

export function nowStamp(): string {
	const d = new Date();
	return `${isoDate(0, d)} ${d.toTimeString().slice(0, 8)}`;
}

export const ME = "manager@sijil.test";

export interface MockDb {
	users: Row[];
	settings: Row;
	lands: Row[];
	cases: Row[];
	events: Row[];
	followups: Row[];
	tasks: Row[];
	folders: Row[];
	documents: Row[];
	versions: Row[];
	links: Row[];
	organizations: Row[];
	counters: Record<string, number>;
	/** Current user's role in the mock; tests can switch it. */
	manager: boolean;
}

const FOLDER_TEMPLATE = [
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
];

export function nextName(db: MockDb, prefix: string, digits: number): string {
	db.counters[prefix] = (db.counters[prefix] ?? 0) + 1;
	return `${prefix}-${String(db.counters[prefix]).padStart(digits, "0")}`;
}

export function createLandFolders(db: MockDb, land: Row) {
	const root: Row = {
		name: nextName(db, "FLD", 7),
		folder_name: land.land_name,
		land: land.name,
		parent_folder: null,
		is_root: 1,
	};
	root.folder_path = `/${root.name}/`;
	db.folders.push(root);
	land.root_folder = root.name;
	const byPath: Record<string, Row> = { "": root };
	for (const path of FOLDER_TEMPLATE) {
		const parts = path.split("/");
		const parent = byPath[parts.slice(0, -1).join("/")] ?? root;
		const folder: Row = {
			name: nextName(db, "FLD", 7),
			folder_name: parts[parts.length - 1],
			land: land.name,
			parent_folder: parent.name,
			is_root: 0,
		};
		folder.folder_path = `${parent.folder_path}${folder.name}/`;
		db.folders.push(folder);
		byPath[path] = folder;
	}
	return byPath;
}

export function seed(): MockDb {
	const db: MockDb = {
		users: [
			{ name: ME, full_name: "Sara Al-Harbi", user_image: null },
			{ name: "ahmed@sijil.test", full_name: "Eng. Ahmed Hassan", user_image: null },
			{ name: "mohammed@sijil.test", full_name: "Eng. Mohammed Saleh", user_image: null },
			{ name: "khalid@sijil.test", full_name: "Eng. Khalid Omar", user_image: null },
			{ name: "noura@sijil.test", full_name: "Noura Al-Qahtani", user_image: null },
		],
		settings: { stale_case_days: 14, default_reminder_days: 1, restrict_to_assigned_lands: 0, default_company: "Sijil Development Co." },
		lands: [],
		cases: [],
		events: [],
		followups: [],
		tasks: [],
		folders: [],
		documents: [],
		versions: [],
		links: [],
		organizations: [
			{ name: "Engineering Consultancy", organization_name: "Engineering Consultancy", organization_type: "Consultant" },
			{ name: "Jeddah Municipality", organization_name: "Jeddah Municipality", organization_type: "Municipality" },
			{ name: "Saudi Electricity", organization_name: "Saudi Electricity", organization_type: "Utility Provider" },
			{ name: "مكتب الأفق للاستشارات", organization_name: "مكتب الأفق للاستشارات", organization_type: "Consultant" },
		],
		counters: {},
		manager: true,
	};
	const d = (n: number) => isoDate(n);

	const landSpecs: [string, string, string, string][] = [
		["Konooz Jeddah", "KNZ-01", "Jeddah", "Active"],
		["Abraj Omar", "ABO-02", "Makkah", "Active"],
		["North Jeddah Development", "NJD-03", "Jeddah", "Active"],
		["Al Rawdah Land", "RWD-04", "Jeddah", "On Hold"],
		["واحة مكة السكنية", "MKR-05", "Makkah", "Active"],
		["Riyadh Investment Land", "RIL-06", "Riyadh", "Active"],
		["Taif Development Project", "TDP-07", "Taif", "Completed"],
	];
	const folders: Record<string, Record<string, Row>> = {};
	for (const [land_name, land_code, city, status] of landSpecs) {
		const land: Row = {
			name: nextName(db, "LAND", 5),
			land_name,
			land_code,
			city,
			status,
			company: "Sijil Development Co.",
			project: land_code === "KNZ-01" ? "PROJ-0001" : null,
			location: `${city}, Saudi Arabia`,
			description: `Land development file for ${land_name}.`,
			notes: "",
			responsibles: [{ user: "ahmed@sijil.test", responsibility: "Development Engineer" }],
			organizations: [{ organization: "Engineering Consultancy", role: "Planning consultant" }],
			owner: ME,
			modified: `${d(-2)} 10:00:00`,
		};
		db.lands.push(land);
		folders[land.name] = createLandFolders(db, land);
	}
	const [konooz, abraj, north, rawdah, makkah, riyadh] = db.lands as [Row, Row, Row, Row, Row, Row, Row];

	const mkCase = (land: Row, title: string, extra: Row = {}): Row => {
		const row: Row = {
			name: nextName(db, "CASE", 5),
			title,
			reference_no: "",
			land: land.name,
			case_type: extra.case_type ?? null,
			status: "In Progress",
			priority: "Medium",
			owner_user: "ahmed@sijil.test",
			project: land.project,
			current_situation: "",
			situation_updated_on: null,
			external_organization: "Engineering Consultancy",
			external_contact: null,
			start_date: d(-60),
			target_date: null,
			last_update_date: null,
			next_followup_date: null,
			description: "",
			relations: [],
			owner: ME,
			modified: `${d(-1)} 09:00:00`,
			...extra,
		};
		db.cases.push(row);
		return row;
	};

	const master = mkCase(konooz, "Master Plan Approval", {
		case_type: "Master Plan Approval",
		reference_no: "MP-2026-114",
		priority: "High",
		start_date: d(-35),
		target_date: d(45),
		description: "Approval of the Konooz Jeddah master plan through the engineering consultancy.",
	});
	const sketch = mkCase(konooz, "Organizational Sketch Approval", {
		case_type: "Organizational Sketch Approval",
		status: "Completed",
		owner_user: "mohammed@sijil.test",
		external_organization: "Jeddah Municipality",
	});
	mkCase(konooz, "Building Permit", {
		case_type: "Building Permit",
		status: "Not Started",
		owner_user: "khalid@sijil.test",
		external_organization: "Jeddah Municipality",
		current_situation: "Waiting for the master plan approval before applying.",
		relations: [{ related_case: "CASE-00001", relation_type: "Depends On" }],
	});
	const utility = mkCase(konooz, "Utility Connections", {
		case_type: "Utility Connections",
		status: "Awaiting Action",
		external_organization: "Saudi Electricity",
		current_situation: "Electricity load study submitted; awaiting the provider's site visit.",
		last_update_date: d(-20),
	});
	const abrajPlan = mkCase(abraj, "Municipality Approval", {
		case_type: "Municipality Approval",
		owner_user: "mohammed@sijil.test",
		external_organization: "Jeddah Municipality",
		current_situation: "Drawings returned with two comments; consultant is revising.",
		last_update_date: d(-5),
	});
	mkCase(north, "Land Subdivision", {
		case_type: "Land Subdivision",
		status: "On Hold",
		current_situation: "On hold until the owners' committee approves the subdivision layout.",
		last_update_date: d(-40),
	});
	mkCase(rawdah, "Consultant Coordination", {
		case_type: "Consultant Coordination",
		owner_user: "noura@sijil.test",
		current_situation: "Kick-off meeting held; consultant preparing the scope.",
		last_update_date: d(-3),
	});
	mkCase(makkah, "اعتماد المخطط التنظيمي", {
		case_type: "Master Plan Approval",
		external_organization: "مكتب الأفق للاستشارات",
		current_situation: "تم تقديم المخطط للمراجعة الفنية، وبانتظار ملاحظات الجهة.",
		last_update_date: d(-8),
	});
	mkCase(riyadh, "Government Correspondence", {
		case_type: "Government Correspondence",
		priority: "Urgent",
		owner_user: ME,
		current_situation: "Official letter sent requesting the zoning confirmation.",
		last_update_date: d(-16),
	});
	for (let i = 1; i <= 14; i++) {
		mkCase(north, `Plot ${i} utility coordination`, {
			case_type: "Utility Connections",
			status: i % 4 === 0 ? "Completed" : "In Progress",
			priority: i % 5 === 0 ? "High" : "Medium",
			owner_user: i % 2 ? "mohammed@sijil.test" : "noura@sijil.test",
			current_situation: `Coordinating connection works for plot ${i}.`,
			last_update_date: d(-i * 2),
		});
	}

	const mkEvent = (c: Row, days: number, title: string, extra: Row = {}): Row => {
		const row: Row = {
			name: nextName(db, "EVT", 7),
			case: c.name,
			land: c.land,
			event_date: d(days),
			event_time: null,
			event_type: "Update",
			communication_method: "Phone",
			is_milestone: 0,
			title,
			description: "",
			external_organization: c.external_organization,
			outcome: null,
			situation_update: null,
			status_after: null,
			recorded_by: c.owner_user,
			recorded_on: `${d(days)} 11:20:00`,
			source_followup: null,
			entry_status: "Active",
			corrects: null,
			superseded_by: null,
			correction_reason: null,
			creation: `${d(days)} 11:20:00`,
			...extra,
		};
		db.events.push(row);
		return row;
	};

	mkEvent(master, -28, "Case opened with the consultant", {
		description: "Initial documents handed to the engineering consultancy, which was assigned to follow the approval.",
		recorded_by: "mohammed@sijil.test",
		communication_method: "Meeting",
	});
	mkEvent(master, -21, "Technical review completed", {
		event_type: "Milestone",
		is_milestone: 1,
		description:
			"<p>The consultant confirmed the master plan <b>completed its technical review</b> and was submitted for approval.</p>",
		situation_update: "Technical review completed; submitted for approval.",
	});
	const wrong = mkEvent(master, -14, "At the Mayor's office", {
		description: "The consultant said the file is at the Mayor's office.",
		entry_status: "Superseded",
	});
	const fixed = mkEvent(master, -14, "At the Secretary/Mayor's office, awaiting signature", {
		description: "The consultant explained the approval reached the Secretary/Mayor's office and is awaiting signature.",
		situation_update: "At the Secretary/Mayor's office awaiting signature.",
		corrects: wrong.name,
		correction_reason: "The title missed that the file is awaiting signature.",
		recorded_on: `${d(-13)} 09:05:00`,
		creation: `${d(-13)} 09:05:00`,
	});
	wrong.superseded_by = fixed.name;
	const signed = mkEvent(master, -7, "Secretary/Mayor signature obtained", {
		event_type: "Milestone",
		is_milestone: 1,
		description: "The consultant confirmed the signature was obtained. Next step: issue the formal approval based on it.",
		outcome: "Signed approval letter received (PDF).",
		situation_update: "The Secretary/Mayor's signature has been obtained; formal approval is pending.",
	});
	const fu1: Row = {
		name: nextName(db, "FUP", 5),
		title: "Follow up on obtaining the formal approval",
		description: "Call the consultant about the formal approval based on the signature.",
		case: master.name,
		land: master.land,
		originating_event: signed.name,
		assigned_to: "ahmed@sijil.test",
		due_date: d(0),
		priority: "High",
		status: "Completed",
		reminder_days_before: 1,
		completion_date: d(0),
		outcome: "Approval not issued yet; consultant expects it next week.",
		result_event: null,
		next_followup: null,
		owner: ME,
		modified: `${d(0)} 08:00:00`,
	};
	db.followups.push(fu1);
	const noProgress = mkEvent(master, 0, "Follow-up result: Follow up on obtaining the formal approval", {
		event_type: "Contact",
		description: "Approval not issued yet; consultant expects it next week.",
		outcome: "Approval not issued yet; consultant expects it next week.",
		source_followup: fu1.name,
		recorded_on: `${d(0)} 08:00:00`,
		creation: `${d(0)} 08:00:00`,
	});
	fu1.result_event = noProgress.name;
	master.current_situation = "The Secretary/Mayor's signature has been obtained; formal approval is pending.";
	master.situation_updated_on = `${d(-7)} 11:20:00`;
	master.last_update_date = d(0);
	mkEvent(sketch, -18, "Approved sketch received", { event_type: "Approval", is_milestone: 1, recorded_by: "mohammed@sijil.test" });
	sketch.last_update_date = d(-18);
	sketch.current_situation = "The approved organizational sketch was received.";
	mkEvent(abrajPlan, -5, "Drawings returned with comments", {
		event_type: "Correspondence",
		communication_method: "Official Letter",
		recorded_by: "mohammed@sijil.test",
	});
	mkEvent(utility, -20, "Load study submitted", { event_type: "Submission", communication_method: "Government Portal" });

	const mkFollowup = (c: Row | null, land: Row, days: number, title: string, extra: Row = {}): Row => {
		const row: Row = {
			name: nextName(db, "FUP", 5),
			title,
			description: "",
			case: c?.name ?? null,
			land: land.name,
			originating_event: null,
			assigned_to: c?.owner_user ?? "ahmed@sijil.test",
			due_date: d(days),
			priority: "Medium",
			status: "Open",
			reminder_days_before: 1,
			completion_date: null,
			outcome: null,
			result_event: null,
			next_followup: null,
			owner: ME,
			modified: `${d(-1)} 08:00:00`,
			...extra,
		};
		db.followups.push(row);
		return row;
	};
	const next = mkFollowup(master, konooz, 7, "Follow up on obtaining the formal approval", {
		priority: "High",
		originating_event: noProgress.name,
	});
	fu1.next_followup = next.name;
	mkFollowup(utility, konooz, -3, "Ask Saudi Electricity for the site visit date", { priority: "High" });
	mkFollowup(abrajPlan, abraj, 0, "Check the revised drawings with the consultant", { assigned_to: ME });
	mkFollowup(null, rawdah, 2, "Confirm the consultant's scope document", { assigned_to: "noura@sijil.test" });
	mkFollowup(db.cases[8] ?? null, riyadh, -1, "Call the zoning department about the letter", {
		assigned_to: ME,
		priority: "Urgent",
	});
	mkFollowup(db.cases[7] ?? null, makkah, 4, "متابعة ملاحظات المراجعة الفنية");

	const mkTask = (title: string, extra: Row = {}): Row => {
		const row: Row = {
			name: nextName(db, "STK", 5),
			title,
			description: "",
			land: null,
			case: null,
			case_event: null,
			status: "Open",
			priority: "Medium",
			assigned_to: ME,
			start_date: null,
			due_date: null,
			completed_on: null,
			completion_notes: null,
			updates: [],
			project: null,
			erpnext_task: null,
			owner: ME,
			modified: `${d(-1)} 12:00:00`,
			...extra,
		};
		db.tasks.push(row);
		return row;
	};
	mkTask("Prepare a status presentation for management", { due_date: d(3), priority: "High" });
	mkTask("Review consultant submission for the master plan", {
		land: konooz.name,
		case: master.name,
		assigned_to: "ahmed@sijil.test",
		due_date: d(-2),
		status: "In Progress",
		updates: [{ update_on: `${d(-3)} 10:00:00`, user: "ahmed@sijil.test", note: "Started reviewing the drawings." }],
	});
	mkTask("Prepare the official letter to the municipality", { land: abraj.name, due_date: d(5), assigned_to: "mohammed@sijil.test" });
	mkTask("Coordinate the kick-off meeting", { land: rawdah.name, status: "Completed", completed_on: d(-4), assigned_to: "noura@sijil.test" });
	mkTask("Submit the missing ownership information", { land: riyadh.name, due_date: d(1), priority: "Urgent" });

	const mkDoc = (land: Row, folderPath: string, title: string, extra: Row = {}, versions = 1): Row => {
		const row: Row = {
			name: nextName(db, "DOC", 7),
			title,
			land: land.name,
			folder: folders[land.name]?.[folderPath]?.name ?? land.root_folder,
			document_type: extra.document_type ?? "Other",
			reference_no: null,
			document_date: d(-10),
			description: "",
			is_confidential: 0,
			archived: 0,
			current_version: null,
			version_count: 0,
			owner: ME,
			creation: `${d(-10)} 10:00:00`,
			modified: `${d(-10)} 10:00:00`,
			...extra,
		};
		db.documents.push(row);
		for (let v = 1; v <= versions; v++) addVersion(db, row, `${title.replace(/\s+/g, "-")}-v${v}.pdf`, 240_000 + v * 1000);
		return row;
	};
	const deed = mkDoc(konooz, "Ownership Documents/Title Deeds", "Konooz Jeddah title deed", {
		document_type: "Title Deed",
		is_confidential: 1,
	});
	const prelim = mkDoc(konooz, "Master Plans/Preliminary Plans", "Preliminary master plan", { document_type: "Master Plan" }, 2);
	const letter = mkDoc(konooz, "Government Approvals/Secretary - Mayor Signature", "Signed approval letter", {
		document_type: "Government Approval",
		reference_no: "SEC-55/1448",
		document_date: d(-7),
	});
	mkDoc(abraj, "Correspondence/Incoming", "Municipality comments letter", { document_type: "Official Letter" });
	mkDoc(konooz, "Consultant Documents", "Consultant engagement contract", { document_type: "Contract" });

	link(db, letter, "Sijil Case Event", signed.name);
	link(db, letter, "Sijil Case", master.name);
	// Pinned to version 1 although version 2 exists:
	link(db, prelim, "Sijil Case Event", db.events[1]!.name, db.versions.find((v) => v.document === prelim.name && v.version_no === 1)?.name);
	link(db, deed, "Sijil Land", konooz.name);
	return db;
}

export function addVersion(db: MockDb, doc: Row, fileName: string, size: number, notes: string | null = null): Row {
	const previous = db.versions.find((v) => v.name === doc.current_version);
	if (previous) previous.is_current = 0;
	const version: Row = {
		name: nextName(db, "DVER", 7),
		document: doc.name,
		version_no: (doc.version_count ?? 0) + 1,
		file: `/private/files/${fileName}`,
		file_name: fileName,
		file_size: size,
		is_current: 1,
		notes,
		uploaded_by: ME,
		creation: nowStamp(),
	};
	db.versions.push(version);
	doc.current_version = version.name;
	doc.version_count = version.version_no;
	doc.modified = nowStamp();
	return version;
}

export function link(db: MockDb, doc: Row, linked_doctype: string, linked_name: string, version?: string | null, follow_latest = 0, note: string | null = null): Row {
	const row: Row = {
		name: Math.random().toString(36).slice(2, 12),
		document: doc.name,
		document_version: follow_latest ? doc.current_version : (version ?? doc.current_version),
		follow_latest,
		linked_doctype,
		linked_name,
		land: doc.land,
		note,
		linked_by: ME,
		creation: nowStamp(),
	};
	db.links.push(row);
	return row;
}
