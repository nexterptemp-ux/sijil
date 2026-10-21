import * as React from "react";
import { cn } from "@/lib/utils";

const field =
	"w-full rounded-md border border-input bg-surface px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => <input ref={ref} className={cn(field, "h-9", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
	({ className, rows = 3, ...props }, ref) => (
		<textarea ref={ref} rows={rows} dir="auto" className={cn(field, "py-2 leading-relaxed", className)} {...props} />
	),
);
Textarea.displayName = "Textarea";

/** Native select: accessible, RTL-correct and mobile-friendly. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
	({ className, ...props }, ref) => <select ref={ref} className={cn(field, "h-9", className)} {...props} />,
);
Select.displayName = "Select";

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => (
		<input ref={ref} type="checkbox" className={cn("size-4 rounded border-input accent-primary", className)} {...props} />
	),
);
Checkbox.displayName = "Checkbox";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
	return <label className={cn("text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
