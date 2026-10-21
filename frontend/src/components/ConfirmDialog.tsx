import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field } from "@/components/fields";
import { Textarea } from "@/components/ui/input";
import { t } from "@/i18n";

/** Confirmation for irreversible actions, optionally asking for a reason. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	message,
	confirmLabel,
	destructive,
	reason,
	pending,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	message?: string;
	confirmLabel: string;
	destructive?: boolean;
	/** Ask for a free-text reason; "required" blocks confirming without one. */
	reason?: { label: string; required?: boolean };
	pending?: boolean;
	onConfirm: (reason: string) => void;
}) {
	const [text, setText] = React.useState("");
	React.useEffect(() => {
		if (open) setText("");
	}, [open]);
	const blocked = Boolean(reason?.required && !text.trim());
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader title={title} />
				<DialogBody>
					{message && <p className="text-sm text-muted-foreground">{message}</p>}
					{reason && (
						<Field label={reason.label} required={reason.required} htmlFor="confirm-reason">
							<Textarea id="confirm-reason" value={text} onChange={(e) => setText(e.target.value)} />
						</Field>
					)}
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("Cancel")}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						disabled={blocked || pending}
						onClick={() => onConfirm(text.trim())}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
