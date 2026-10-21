import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogClose = DialogPrimitive.Close;

const WIDTH = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function DialogContent({
	className,
	children,
	size = "md",
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: keyof typeof WIDTH }) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
			<div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
				<DialogPrimitive.Content
					className={cn(
						"pointer-events-auto relative flex max-h-[90vh] w-full flex-col rounded-lg border border-border bg-surface shadow-xl focus:outline-none",
						WIDTH[size],
						className,
					)}
					{...props}
				>
					{children}
					<DialogPrimitive.Close
						className="absolute end-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
						aria-label={t("Close")}
					>
						<X className="size-4" />
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</div>
		</DialogPrimitive.Portal>
	);
}

export function DialogHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="border-b border-border px-5 py-4 pe-12">
			<DialogPrimitive.Title className="text-base font-bold">{title}</DialogPrimitive.Title>
			<DialogPrimitive.Description className={description ? "mt-1 text-xs text-muted-foreground" : "sr-only"}>
				{description || title}
			</DialogPrimitive.Description>
		</div>
	);
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("flex-1 space-y-4 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3", className)}
			{...props}
		/>
	);
}
