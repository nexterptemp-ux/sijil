// In-memory data for `npm run dev:mock` and tests. Field names match the DocTypes exactly;
// see docs/architecture/domain-model.md. Dates are relative to the real current date.
// Content is Arabic, as real users will enter it; a few English entries keep mixed text tested.

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

/** Names used by the seed — tests refer to these instead of repeating the strings. */
export const DEMO = {
	me: "سارة الحربي",
	ahmed: "م. أحمد حسن",
	konooz: "كنوز جدة",
	riyadh: "أرض الرياض الاستثمارية",
	masterPlan: "اعتماد المخطط",
	utilities: "توصيل الخدمات",
	situation: "تم الحصول على توقيع الأمين، وجارٍ استخراج الموافقة النهائية بناءً على التوقيع.",
	technicalReview: "انتهاء المراجعة الفنية للمخطط",
	wrongEntry: "المعاملة لدى مكتب الأمين",
	signature: "الحصول على توقيع الأمين",
	overdueFollowup: "متابعة موعد زيارة الشركة السعودية للكهرباء للموقع",
	upcomingFollowup: "تأكيد وثيقة نطاق عمل الاستشاري",
	overdueTask: "مراجعة تقديم الاستشاري للمخطط",
	govApprovals: "الاعتمادات الحكومية",
	signatureFolder: "توقيع الأمين",
	signedLetter: "خطاب توقيع الأمين",
	prelimPlan: "المخطط المبدئي",
};

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
	"مستندات الملكية",
	"مستندات الملكية/الصكوك",
	"مستندات الملكية/الرفع المساحي",
	"المخططات",
	"المخططات/المخططات المبدئية",
	"المخططات/المخططات المعتمدة",
	"الاعتمادات الحكومية",
	"الاعتمادات الحكومية/الأمانة",
	"الاعتمادات الحكومية/توقيع الأمين",
	"المراسلات",
	"المراسلات/الوارد",
	"المراسلات/الصادر",
	"الرخص",
	"مستندات الاستشاري",
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

const ORG = {
	consultant: "المكتب الهندسي الاستشاري",
	municipality: "أمانة محافظة جدة",
	electricity: "الشركة السعودية للكهرباء",
	ufuq: "مكتب الأفق للاستشارات",
	water: "شركة المياه الوطنية",
};

export function seed(): MockDb {
	const db: MockDb = {
		users: [
			{ name: ME, full_name: DEMO.me, user_image: null },
			{ name: "ahmed@sijil.test", full_name: DEMO.ahmed, user_image: null },
			{ name: "mohammed@sijil.test", full_name: "م. محمد صالح", user_image: null },
			{ name: "khalid@sijil.test", full_name: "م. خالد العمري", user_image: null },
			{ name: "noura@sijil.test", full_name: "نورة القحطاني", user_image: null },
			{ name: "faisal@sijil.test", full_name: "فيصل الزهراني", user_image: null },
		],
		settings: {
			stale_case_days: 14,
			default_reminder_days: 1,
			restrict_to_assigned_lands: 0,
			default_company: "شركة سجل للتطوير العقاري",
		},
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
			{ name: ORG.consultant, organization_name: ORG.consultant, organization_type: "Consultant" },
			{ name: ORG.municipality, organization_name: ORG.municipality, organization_type: "Municipality" },
			{ name: ORG.electricity, organization_name: ORG.electricity, organization_type: "Utility Provider" },
			{ name: ORG.ufuq, organization_name: ORG.ufuq, organization_type: "Consultant" },
			{ name: ORG.water, organization_name: ORG.water, organization_type: "Utility Provider" },
		],
		counters: {},
		manager: true,
	};
	const d = (n: number) => isoDate(n);

	const landSpecs: [string, string, string, string, string][] = [
		[
			DEMO.konooz,
			"KNZ-01",
			"جدة",
			"Active",
			"أرض سكنية تجارية شمال جدة بمساحة 120 ألف م²، في مرحلة اعتماد المخطط.",
		],
		["أبراج عمر", "ABO-02", "مكة المكرمة", "Active", "مشروع أبراج فندقية قرب المنطقة المركزية."],
		["تطوير شمال جدة", "NJD-03", "جدة", "Active", "مخطط سكني من 14 قطعة قيد تنسيق الخدمات."],
		["أرض الروضة", "RWD-04", "جدة", "On Hold", "أرض بانتظار قرار لجنة الملاك بشأن التطوير."],
		["واحة مكة السكنية", "MKR-05", "مكة المكرمة", "Active", "مشروع سكني متكامل في المرحلة التنظيمية."],
		[DEMO.riyadh, "RIL-06", "الرياض", "Active", "أرض استثمارية بانتظار تأكيد استخدامات الأراضي."],
		[
			"Taif Development Project",
			"TDP-07",
			"الطائف",
			"Completed",
			"Completed residential development (English record kept for mixed-language display).",
		],
	];
	const folders: Record<string, Record<string, Row>> = {};
	for (const [land_name, land_code, city, status, description] of landSpecs) {
		const land: Row = {
			name: nextName(db, "LAND", 5),
			land_name,
			land_code,
			city,
			status,
			company: "شركة سجل للتطوير العقاري",
			project: land_code === "KNZ-01" ? "PROJ-0001" : null,
			location: `${city}، المملكة العربية السعودية`,
			description,
			notes: "",
			responsibles: [
				{ user: "ahmed@sijil.test", responsibility: "مهندس التطوير" },
				{ user: "noura@sijil.test", responsibility: "العلاقات الحكومية" },
			],
			organizations: [{ organization: ORG.consultant, role: "استشاري التخطيط" }],
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
			external_organization: ORG.consultant,
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

	const master = mkCase(konooz, DEMO.masterPlan, {
		case_type: "Master Plan Approval",
		reference_no: "MP-1448-114",
		priority: "High",
		start_date: d(-35),
		target_date: d(45),
		external_contact: "م. فهد الغامدي",
		description: "اعتماد المخطط العام لأرض كنوز جدة عبر المكتب الهندسي الاستشاري، وصولًا إلى الموافقة الرسمية.",
	});
	const sketch = mkCase(konooz, "اعتماد الكروكي التنظيمي", {
		case_type: "Organizational Sketch Approval",
		status: "Completed",
		owner_user: "mohammed@sijil.test",
		external_organization: ORG.municipality,
		reference_no: "KR-2231",
	});
	mkCase(konooz, "إصدار رخصة البناء", {
		case_type: "Building Permit",
		status: "Not Started",
		owner_user: "khalid@sijil.test",
		external_organization: ORG.municipality,
		current_situation: "بانتظار اكتمال اعتماد المخطط قبل التقديم على الرخصة.",
		relations: [{ related_case: "CASE-00001", relation_type: "Depends On" }],
	});
	const utility = mkCase(konooz, DEMO.utilities, {
		case_type: "Utility Connections",
		status: "Awaiting Action",
		external_organization: ORG.electricity,
		current_situation: "تم تقديم دراسة الأحمال الكهربائية، وبانتظار زيارة الشركة للموقع.",
		last_update_date: d(-20),
	});
	const abrajPlan = mkCase(abraj, "موافقة الأمانة على المخططات", {
		case_type: "Municipality Approval",
		owner_user: "mohammed@sijil.test",
		external_organization: ORG.municipality,
		current_situation: "أُعيدت المخططات بملاحظتين، والاستشاري يعمل على التعديل.",
		last_update_date: d(-5),
		priority: "High",
	});
	mkCase(north, "فرز الأرض", {
		case_type: "Land Subdivision",
		status: "On Hold",
		current_situation: "موقوفة حتى اعتماد لجنة الملاك لمخطط الفرز.",
		last_update_date: d(-40),
	});
	mkCase(rawdah, "التنسيق مع الاستشاري", {
		case_type: "Consultant Coordination",
		owner_user: "noura@sijil.test",
		current_situation: "عُقد اجتماع البداية، والاستشاري يُعد وثيقة نطاق العمل.",
		last_update_date: d(-3),
	});
	const makkahCase = mkCase(makkah, "اعتماد المخطط التنظيمي", {
		case_type: "Master Plan Approval",
		external_organization: ORG.ufuq,
		current_situation: "تم تقديم المخطط للمراجعة الفنية، وبانتظار ملاحظات الجهة.",
		last_update_date: d(-8),
	});
	const riyadhCase = mkCase(riyadh, "المراسلات الحكومية", {
		case_type: "Government Correspondence",
		priority: "Urgent",
		owner_user: ME,
		current_situation: "أُرسل خطاب رسمي لطلب تأكيد استخدامات الأرض.",
		last_update_date: d(-16),
	});
	for (let i = 1; i <= 14; i++) {
		mkCase(north, `تنسيق توصيل الخدمات – القطعة ${i}`, {
			case_type: "Utility Connections",
			status: i % 4 === 0 ? "Completed" : "In Progress",
			priority: i % 5 === 0 ? "High" : "Medium",
			owner_user: i % 2 ? "mohammed@sijil.test" : "noura@sijil.test",
			external_organization: i % 3 ? ORG.electricity : ORG.water,
			current_situation: `جارٍ التنسيق لأعمال توصيل الكهرباء والمياه للقطعة رقم ${i}.`,
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

	mkEvent(master, -28, "بدء معاملة اعتماد المخطط", {
		description: "تم تسليم المستندات الأولية للمكتب الاستشاري وتكليفه بمتابعة إجراءات الاعتماد.",
		recorded_by: "mohammed@sijil.test",
		communication_method: "Meeting",
	});
	mkEvent(master, -21, DEMO.technicalReview, {
		event_type: "Milestone",
		is_milestone: 1,
		description:
			"<p>أفاد المكتب الاستشاري بأن المخطط <b>أنهى مرحلة المراجعة الفنية</b>، وتمت إحالته إلى مرحلة الاعتماد.</p>",
		situation_update: "انتهت المراجعة الفنية، وأُحيل المخطط للاعتماد.",
	});
	const wrong = mkEvent(master, -14, DEMO.wrongEntry, {
		description: "أفاد المكتب بأن المعاملة لدى مكتب الأمين.",
		entry_status: "Superseded",
	});
	const fixed = mkEvent(master, -14, "المعاملة لدى مكتب الأمين بانتظار التوقيع", {
		description:
			"أفاد المكتب بأن المعاملة وصلت إلى مكتب الأمين وهي بانتظار التوقيع. تم الاتفاق على متابعة الموقف خلال أسبوع.",
		situation_update: "المعاملة لدى مكتب الأمين بانتظار التوقيع.",
		corrects: wrong.name,
		correction_reason: "العنوان لم يذكر أن المعاملة بانتظار التوقيع.",
		recorded_on: `${d(-13)} 09:05:00`,
		creation: `${d(-13)} 09:05:00`,
	});
	wrong.superseded_by = fixed.name;
	const signed = mkEvent(master, -7, DEMO.signature, {
		event_type: "Milestone",
		is_milestone: 1,
		description:
			"أكد المكتب الاستشاري الحصول على توقيع الأمين. الخطوة التالية: استخراج الموافقة الرسمية بناءً على التوقيع.",
		outcome: "استلام خطاب التوقيع (PDF).",
		situation_update: DEMO.situation,
	});
	const fu1: Row = {
		name: nextName(db, "FUP", 5),
		title: "متابعة استخراج الموافقة الرسمية",
		description: "التواصل مع الاستشاري بشأن الموافقة الرسمية المبنية على التوقيع.",
		case: master.name,
		land: master.land,
		originating_event: signed.name,
		assigned_to: "ahmed@sijil.test",
		due_date: d(0),
		priority: "High",
		status: "Completed",
		reminder_days_before: 1,
		completion_date: d(0),
		outcome: "لم تصدر الموافقة بعد، ويتوقع الاستشاري صدورها الأسبوع القادم.",
		result_event: null,
		next_followup: null,
		owner: ME,
		modified: `${d(0)} 08:00:00`,
	};
	db.followups.push(fu1);
	const noProgress = mkEvent(master, 0, "نتيجة المتابعة: متابعة استخراج الموافقة الرسمية", {
		event_type: "Contact",
		description: "لم تصدر الموافقة بعد، ويتوقع الاستشاري صدورها الأسبوع القادم.",
		outcome: "لم تصدر الموافقة بعد، ويتوقع الاستشاري صدورها الأسبوع القادم.",
		source_followup: fu1.name,
		recorded_on: `${d(0)} 08:00:00`,
		creation: `${d(0)} 08:00:00`,
	});
	fu1.result_event = noProgress.name;
	master.current_situation = DEMO.situation;
	master.situation_updated_on = `${d(-7)} 11:20:00`;
	master.last_update_date = d(0);
	mkEvent(sketch, -18, "استلام الكروكي المعتمد", {
		event_type: "Approval",
		is_milestone: 1,
		recorded_by: "mohammed@sijil.test",
	});
	sketch.last_update_date = d(-18);
	sketch.current_situation = "تم استلام الكروكي التنظيمي المعتمد من الأمانة.";
	mkEvent(abrajPlan, -5, "إعادة المخططات بملاحظات", {
		event_type: "Correspondence",
		communication_method: "Official Letter",
		recorded_by: "mohammed@sijil.test",
		description: "وردت ملاحظتان من الأمانة: تعديل الارتدادات وإضافة مواقف للزوار.",
	});
	mkEvent(utility, -20, "تقديم دراسة الأحمال", {
		event_type: "Submission",
		communication_method: "Government Portal",
	});
	mkEvent(makkahCase, -8, "تقديم المخطط للمراجعة الفنية", {
		event_type: "Submission",
		communication_method: "Government Portal",
	});
	mkEvent(riyadhCase, -16, "إرسال خطاب طلب تأكيد الاستخدامات", {
		event_type: "Correspondence",
		communication_method: "Official Letter",
		recorded_by: ME,
	});

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
	const next = mkFollowup(master, konooz, 7, "متابعة استخراج الموافقة الرسمية", {
		priority: "High",
		originating_event: noProgress.name,
	});
	fu1.next_followup = next.name;
	mkFollowup(utility, konooz, -3, DEMO.overdueFollowup, { priority: "High" });
	mkFollowup(abrajPlan, abraj, 0, "مراجعة المخططات المعدّلة مع الاستشاري", { assigned_to: ME });
	mkFollowup(null, rawdah, 2, DEMO.upcomingFollowup, { assigned_to: "noura@sijil.test" });
	mkFollowup(riyadhCase, riyadh, -1, "الاتصال بإدارة التخطيط بشأن الخطاب", { assigned_to: ME, priority: "Urgent" });
	mkFollowup(makkahCase, makkah, 4, "متابعة ملاحظات المراجعة الفنية");

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
	mkTask("إعداد عرض تقديمي عن حالة المعاملات للإدارة", {
		due_date: d(3),
		priority: "High",
		description: "ملخص لكل أرض: المعاملات المفتوحة، المتأخرات، والخطوات القادمة.",
	});
	mkTask(DEMO.overdueTask, {
		land: konooz.name,
		case: master.name,
		assigned_to: "ahmed@sijil.test",
		due_date: d(-2),
		status: "In Progress",
		updates: [{ update_on: `${d(-3)} 10:00:00`, user: "ahmed@sijil.test", note: "بدأت مراجعة اللوحات المعمارية." }],
	});
	mkTask("إعداد الخطاب الرسمي للأمانة", { land: abraj.name, due_date: d(5), assigned_to: "mohammed@sijil.test" });
	mkTask("تنسيق اجتماع البداية", {
		land: rawdah.name,
		status: "Completed",
		completed_on: d(-4),
		assigned_to: "noura@sijil.test",
	});
	mkTask("استكمال بيانات الملكية الناقصة", { land: riyadh.name, due_date: d(1), priority: "Urgent" });

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
		for (let v = 1; v <= versions; v++)
			addVersion(db, row, `${title.replace(/\s+/g, "-")}-v${v}.pdf`, 240_000 + v * 1000);
		return row;
	};
	const deed = mkDoc(konooz, "مستندات الملكية/الصكوك", "صك ملكية كنوز جدة", {
		document_type: "Title Deed",
		is_confidential: 1,
		reference_no: "3100-4412",
	});
	const prelim = mkDoc(konooz, "المخططات/المخططات المبدئية", DEMO.prelimPlan, { document_type: "Master Plan" }, 2);
	const letter = mkDoc(konooz, "الاعتمادات الحكومية/توقيع الأمين", DEMO.signedLetter, {
		document_type: "Government Approval",
		reference_no: "SEC-55/1448",
		document_date: d(-7),
	});
	mkDoc(abraj, "المراسلات/الوارد", "خطاب ملاحظات الأمانة", { document_type: "Official Letter" });
	// Key documents (صك الملكية، الكروكي، المخطط المعتمد) — complete on some lands, partial on others.
	mkDoc(konooz, "الاعتمادات الحكومية/الأمانة", "الكروكي التنظيمي المعتمد", {
		document_type: "Organizational Sketch",
		reference_no: "KR-2231",
	});
	for (const [land, deed, sketch, plan] of [
		[abraj, true, true, true],
		[north, true, true, false],
		[makkah, true, false, false],
		[riyadh, true, false, false],
		[db.lands[6]!, true, true, true],
	] as [Row, boolean, boolean, boolean][]) {
		if (deed) mkDoc(land, "مستندات الملكية/الصكوك", `صك ملكية ${land.land_name}`, { document_type: "Title Deed" });
		if (sketch) mkDoc(land, "الاعتمادات الحكومية/الأمانة", `كروكي ${land.land_name}`, { document_type: "Organizational Sketch" });
		if (plan)
			mkDoc(land, "المخططات/المخططات المعتمدة", `المخطط المعتمد – ${land.land_name}`, {
				document_type: "Approved Master Plan",
			});
	}
	mkDoc(konooz, "مستندات الاستشاري", "عقد تكليف المكتب الاستشاري", { document_type: "Contract" });
	mkDoc(konooz, "مستندات الملكية/الرفع المساحي", "الرفع المساحي للأرض", { document_type: "Survey" });

	link(db, letter, "Sijil Case Event", signed.name);
	link(db, letter, "Sijil Case", master.name);
	// Pinned to version 1 although version 2 exists:
	link(
		db,
		prelim,
		"Sijil Case Event",
		db.events[1]!.name,
		db.versions.find((v) => v.document === prelim.name && v.version_no === 1)?.name,
	);
	link(db, deed, "Sijil Land", konooz.name);
	// Derived like the backend does: earliest open follow-up per case.
	for (const c of db.cases) {
		const due = db.followups
			.filter((f) => f.case === c.name && f.status === "Open")
			.map((f) => f.due_date)
			.sort();
		c.next_followup_date = due[0] ?? null;
	}
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

export function link(
	db: MockDb,
	doc: Row,
	linked_doctype: string,
	linked_name: string,
	version?: string | null,
	follow_latest = 0,
	note: string | null = null,
): Row {
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
