import { call, delegate, esc, icon, state } from "../core.js";
import { heading, loading, toast } from "../ui.js";

const META = {
	project: { title: __("ERPNext Projects"), desc: __("Every land can be linked to an ERPNext Project (or have one created). Project, Task and Case counts also appear on the Project's dashboard."), link: "/app/project", linkLabel: __("Open Projects") },
	auto_project: { title: __("Create Projects Automatically"), desc: __("Create an ERPNext Project automatically whenever a new land is added."), link: null },
	task: { title: __("ERPNext Tasks"), desc: __("Tasks of lands that have a Project are mirrored to ERPNext Tasks. Status, title and dates stay in sync in both directions."), link: "/app/task", linkLabel: __("Open Tasks") },
	todo: { title: __("ToDo Assignments"), desc: __("Follow-ups and tasks appear in the assignee's ToDo list and are closed automatically when completed."), link: "/app/todo", linkLabel: __("Open ToDo") },
	calendar: { title: __("Calendar"), desc: __("Open follow-ups appear in each assignee's Frappe calendar on their due date."), link: "/app/event/view/calendar", linkLabel: __("Open Calendar") },
	notifications: { title: __("System Notifications"), desc: __("A daily job notifies assignees (desk bell) of follow-ups and tasks that are due soon, due today or overdue."), link: "/app/notification-log", linkLabel: __("Open Notifications") },
	email: { title: __("Email Reminders"), desc: __("Also send the daily reminders by email through the site's outgoing email account."), link: "/app/email-queue", linkLabel: __("Email Queue") },
	parties: { title: __("Suppliers, Customers and Contacts"), desc: __("External organizations (consultants, municipalities, utilities) can be linked to ERPNext Suppliers, Customers and Contacts."), link: "/app/sijil-external-organization", linkLabel: __("External Organizations") },
	files: { title: __("Files and Permissions"), desc: __("Documents are stored as private ERPNext Files attached to their versions; downloads respect SIJIL permissions."), link: "/app/file", linkLabel: __("Open Files") },
	employees: { title: __("Employees"), desc: __("Responsible people are ERPNext Users; their Employee records (when HR is installed) provide names and context."), link: "/app/employee", linkLabel: __("Open Employees") },
	company: { title: __("Company"), desc: __("Lands default to the company configured in SIJIL Settings."), link: "/app/company", linkLabel: __("Open Companies") },
};

const STAT_LABELS = {
	linked_lands: __("Linked lands"), total_lands: __("Total lands"), synced_tasks: __("Synced tasks"), total_tasks: __("Total tasks"),
	open_todos: __("Open ToDos"), events: __("Calendar events"), unread: __("Unread notifications"), organizations: __("Organizations"),
	with_supplier: __("Linked to Supplier"), with_customer: __("Linked to Customer"), with_contact: __("Linked to Contact"),
	versions: __("File versions"), documents: __("Documents"), hrms: __("HRMS installed"), default_company: __("Default company"),
};

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Integrations") }]);
		const manager = state.boot.user.is_manager;
		const draw = (items) => {
			el.innerHTML = `${heading({
				eyebrow: __("ERPNext"),
				title: __("Integrations"),
				sub: __("How SIJIL works together with the rest of ERPNext. Managers can switch each integration on or off."),
				actions: manager ? `<a class="sj-btn" href="/app/sijil-settings">${icon("edit")} ${esc(__("Sijil Settings"))}</a><button type="button" class="sj-btn" data-action="sync-tasks">${esc(__("Sync Existing Tasks"))}</button>` : "",
			})}
			<div class="sj-grid cols2">${items.map((it) => {
				const m = META[it.key];
				const stats = Object.entries(it.stats || {}).filter(([, v]) => v !== "" && v !== undefined);
				return `<section class="sj-panel"><div class="sj-integration"><span class="sj-fileicon">${icon(it.icon)}</span>
					<div style="flex:1;min-width:0"><div class="sj-between"><h3>${esc(m.title)}</h3>
						${it.flag && manager ? `<label class="sj-switch"><input type="checkbox" data-flag="${it.flag}" ${it.enabled ? "checked" : ""} aria-label="${esc(m.title)}"><i></i></label>` : `<span class="sj-pill ${it.enabled ? "green" : "grey"}">${esc(it.enabled ? __("Available") : __("Not available"))}</span>`}</div>
						<p>${esc(m.desc)}</p>
						<div class="sj-row" style="gap:6px;margin-bottom:8px">${stats.map(([k, v]) => `<span class="sj-pill blue">${esc(STAT_LABELS[k] || k)}: ${esc(v)}</span>`).join("")}</div>
						${m.link ? `<a class="sj-link" href="${m.link}" target="_blank" rel="noopener">${esc(m.linkLabel)} ↗</a>` : ""}</div></div></section>`;
			}).join("")}</div>`;
		};
		el.innerHTML = loading();
		draw(await call("integrations.get_integrations"));
		el.addEventListener("change", async (e) => {
			const f = e.target.closest("[data-flag]");
			if (!f) return;
			draw(await call("integrations.set_integration", { flag: f.dataset.flag, value: f.checked ? 1 : 0 }));
			toast(__("Integration updated"));
		});
		delegate(el, {
			"sync-tasks": async () => {
				const r = await call("integrations.link_pending_tasks");
				toast(__("{0} tasks synced", [r.synced]));
				draw(await call("integrations.get_integrations"));
			},
		});
	},
};
