import { CalendarClock, CheckCircle2, MoreHorizontal, Pencil, XCircle } from "lucide-react";
import * as React from "react";
import { useBoot } from "@/app/boot";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field, UserSelect } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/menu";
import { t } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { FollowUp } from "@/lib/api/types";
import { followupsApi } from "./api";
import { CompleteFollowUpDialog } from "./CompleteFollowUpDialog";
import { FollowUpFormDialog } from "./FollowUpFormDialog";

type Open = "complete" | "reschedule" | "edit" | "cancel" | null;

/** Complete (primary) plus reschedule / edit / cancel for an open follow-up. */
export function FollowUpActions({ followup, compact }: { followup: FollowUp; compact?: boolean }) {
	const [open, setOpen] = React.useState<Open>(null);
	const close = (o: boolean) => !o && setOpen(null);
	const cancel = useApiMutation((reason: string) => followupsApi.cancel(followup.name, reason || undefined), {
		invalidate: DOMAIN,
		success: t("Follow-up cancelled"),
		onSuccess: () => setOpen(null),
	});
	if (followup.status !== "Open") return null;
	return (
		<>
			<Button size="sm" onClick={() => setOpen("complete")}>
				<CheckCircle2 />
				{compact ? t("Record result") : t("Complete")}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon" className="size-8" aria-label={t("More actions")}>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onSelect={() => setOpen("reschedule")}>
						<CalendarClock />
						{t("Reschedule")}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setOpen("edit")}>
						<Pencil />
						{t("Edit")}
					</DropdownMenuItem>
					<DropdownMenuItem destructive onSelect={() => setOpen("cancel")}>
						<XCircle />
						{t("Cancel follow-up")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<CompleteFollowUpDialog open={open === "complete"} onOpenChange={close} followup={followup} />
			<RescheduleDialog open={open === "reschedule"} onOpenChange={close} followup={followup} />
			<FollowUpFormDialog open={open === "edit"} onOpenChange={close} followup={followup} />
			<ConfirmDialog
				open={open === "cancel"}
				onOpenChange={close}
				title={t("Cancel follow-up")}
				message={t("The follow-up is closed without a result. This cannot be undone.")}
				confirmLabel={t("Cancel follow-up")}
				destructive
				reason={{ label: t("Reason") }}
				pending={cancel.isPending}
				onConfirm={(reason) => cancel.mutate(reason)}
			/>
		</>
	);
}

function RescheduleDialog({ open, onOpenChange, followup }: { open: boolean; onOpenChange: (o: boolean) => void; followup: FollowUp }) {
	const { boot } = useBoot();
	const [date, setDate] = React.useState(followup.due_date);
	const [assignee, setAssignee] = React.useState<string | null>(followup.assigned_to);
	React.useEffect(() => {
		if (open) {
			setDate(followup.due_date);
			setAssignee(followup.assigned_to);
		}
	}, [open, followup]);
	const save = useApiMutation(() => followupsApi.reschedule(followup.name, date, assignee !== followup.assigned_to ? assignee : null), {
		invalidate: DOMAIN,
		success: t("Follow-up rescheduled"),
		onSuccess: () => onOpenChange(false),
	});
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader title={t("Reschedule follow-up")} description={followup.title} />
				<DialogBody>
					<Field label={t("New due date")} required htmlFor="rs_date">
						<Input id="rs_date" type="date" min={boot.today} value={date} onChange={(e) => setDate(e.target.value)} />
					</Field>
					<Field label={t("Assigned To")} htmlFor="rs_user">
						<UserSelect id="rs_user" value={assignee} onChange={setAssignee} clearable={false} />
					</Field>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("Cancel")}
					</Button>
					<Button disabled={!date || save.isPending} onClick={() => save.mutate(undefined)}>
						{t("Save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
