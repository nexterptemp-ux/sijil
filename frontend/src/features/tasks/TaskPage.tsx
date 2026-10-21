import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Pencil, PlayCircle, RotateCcw, XCircle } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { KeyValue, PageHeader, Person, RichText } from "@/components/common";
import { LoadingRows, QueryView } from "@/components/states";
import { PriorityBadge, StateBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import { LinkedDocuments } from "@/features/documents/LinkedDocuments";
import { t } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { TaskStatus } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { taskKeys, tasksApi, type TaskDetail } from "./api";
import { TaskFormDialog } from "./TaskFormDialog";

export function TaskPage() {
	const { name = "" } = useParams();
	const query = useQuery({ queryKey: taskKeys.detail(name), queryFn: () => tasksApi.get(name) });
	return (
		<QueryView query={query} loading={<LoadingRows rows={5} />}>
			{(task) => <TaskView task={task} />}
		</QueryView>
	);
}

function TaskView({ task }: { task: TaskDetail }) {
	const { boot } = useBoot();
	const [editing, setEditing] = React.useState(false);
	const [closing, setClosing] = React.useState<TaskStatus | null>(null);
	const [note, setNote] = React.useState("");
	const status = useApiMutation(
		({ s, notes }: { s: TaskStatus; notes?: string }) => tasksApi.setStatus(task.name, s, notes),
		{
			invalidate: DOMAIN,
			success: (r) => t("Task is now {0}", t(r.status)),
			onSuccess: () => setClosing(null),
		},
	);
	const addNote = useApiMutation(() => tasksApi.addUpdate(task.name, note.trim()), {
		invalidate: [taskKeys.detail(task.name)],
		onSuccess: () => setNote(""),
	});
	const open = task.status === "Open" || task.status === "In Progress";
	const overdue = open && task.due_date && task.due_date < boot.today;

	return (
		<>
			<PageHeader
				back={{ to: "/tasks", label: t("Tasks") }}
				title={task.title}
				subtitle={
					<span className="flex flex-wrap items-center gap-2">
						<StateBadge state={overdue ? "Overdue" : task.status} />
						<PriorityBadge priority={task.priority} />
						{task.case && (
							<Link to={`/cases/${task.case}`} className="hover:text-primary" dir="auto">
								{task.case_title}
							</Link>
						)}
						{task.land && (
							<Link to={`/lands/${task.land}`} className="hover:text-primary" dir="auto">
								{task.land_name}
							</Link>
						)}
					</span>
				}
				actions={
					task.can_write && (
						<>
							{task.status === "Open" && (
								<Button
									variant="outline"
									disabled={status.isPending}
									onClick={() => status.mutate({ s: "In Progress" })}
								>
									<PlayCircle />
									{t("Start")}
								</Button>
							)}
							{open && (
								<Button onClick={() => setClosing("Completed")}>
									<CheckCircle2 />
									{t("Mark complete")}
								</Button>
							)}
							{!open && (
								<Button
									variant="outline"
									disabled={status.isPending}
									onClick={() => status.mutate({ s: "Open" })}
								>
									<RotateCcw />
									{t("Reopen")}
								</Button>
							)}
							<Button variant="outline" onClick={() => setEditing(true)}>
								<Pencil />
								{t("Edit")}
							</Button>
							{open && (
								<Button variant="ghost" onClick={() => setClosing("Cancelled")}>
									<XCircle />
									{t("Cancel task")}
								</Button>
							)}
						</>
					)
				}
			/>
			<div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
				<div className="space-y-6 lg:col-span-2">
					{task.description && (
						<Card>
							<CardBody>
								<RichText html={task.description} />
							</CardBody>
						</Card>
					)}
					<Card>
						<CardHeader title={t("Progress updates")} />
						<CardBody className="space-y-4">
							{task.can_write && (
								<form
									className="space-y-2"
									onSubmit={(e) => {
										e.preventDefault();
										if (note.trim()) addNote.mutate(undefined);
									}}
								>
									<Textarea
										rows={2}
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder={t("Write a progress note...")}
										aria-label={t("Progress note")}
									/>
									<div className="flex justify-end">
										<Button type="submit" size="sm" disabled={!note.trim() || addNote.isPending}>
											{t("Add note")}
										</Button>
									</div>
								</form>
							)}
							{task.updates.length === 0 ? (
								<p className="text-sm text-muted-foreground">{t("No updates yet.")}</p>
							) : (
								<ol className="space-y-3">
									{[...task.updates].reverse().map((u, i) => (
										<li key={`${u.update_on}-${i}`} className="rounded-md bg-muted/60 p-3 text-sm">
											<p className="whitespace-pre-line" dir="auto">
												{u.note}
											</p>
											<div className="mt-1 text-xs text-muted-foreground">
												<bdi>{u.user_name || u.user}</bdi> ·{" "}
												<bdi>{formatDateTime(u.update_on)}</bdi>
											</div>
										</li>
									))}
								</ol>
							)}
						</CardBody>
					</Card>
					{task.land && (
						<LinkedDocuments
							land={task.land}
							doctype="Sijil Task"
							name={task.name}
							documents={task.documents}
							canWrite={task.can_write}
						/>
					)}
				</div>
				<aside>
					<Card>
						<CardHeader title={t("Details")} />
						<CardBody>
							<dl className="divide-y divide-border">
								<KeyValue label={t("Assigned To")}>
									<Person name={task.assigned_to_name} fallback={task.assigned_to} />
								</KeyValue>
								<KeyValue label={t("Start Date")}>{formatDate(task.start_date)}</KeyValue>
								<KeyValue label={t("Due Date")}>{formatDate(task.due_date)}</KeyValue>
								{task.completed_on && (
									<KeyValue label={t("Completed On")}>{formatDate(task.completed_on)}</KeyValue>
								)}
								{task.erpnext_task && (
									<KeyValue label={t("ERPNext Task")}>
										<a
											href={`/app/task/${encodeURIComponent(task.erpnext_task)}`}
											className="text-primary hover:underline"
										>
											{task.erpnext_task}
										</a>
									</KeyValue>
								)}
							</dl>
							{task.completion_notes && (
								<div className="mt-3 rounded-md bg-success-soft p-3 text-sm" dir="auto">
									<div className="mb-1 text-xs font-semibold text-success">
										{t("Completion notes")}
									</div>
									{task.completion_notes}
								</div>
							)}
						</CardBody>
					</Card>
				</aside>
			</div>
			<TaskFormDialog open={editing} onOpenChange={setEditing} task={task} />
			<ConfirmDialog
				open={closing !== null}
				onOpenChange={(o) => !o && setClosing(null)}
				title={closing === "Completed" ? t("Mark task complete") : t("Cancel task")}
				confirmLabel={closing === "Completed" ? t("Mark complete") : t("Cancel task")}
				destructive={closing === "Cancelled"}
				reason={{ label: closing === "Completed" ? t("Completion notes") : t("Reason") }}
				pending={status.isPending}
				onConfirm={(notes) => closing && status.mutate({ s: closing, notes: notes || undefined })}
			/>
		</>
	);
}
