import * as React from "react";
import { cn } from "@/lib/utils";

const field =
	"w-full rounded-[10px] border border-input bg-surface px-3 text-sm shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors placeholder:text-muted-foreground/80 hover:border-muted-foreground/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => <input ref={ref} className={cn(field, "h-10", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
	({ className, rows = 3, ...props }, ref) => (
		<textarea
			ref={ref}
			rows={rows}
			dir="auto"
			className={cn(field, "py-2 leading-relaxed", className)}
			{...props}
		/>
	),
);
Textarea.displayName = "Textarea";

/** Native select: accessible, RTL-correct and mobile-friendly. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
	({ className, ...props }, ref) => (
		<select ref={ref} className={cn(field, "h-10 cursor-pointer", className)} {...props} />
	),
);
Select.displayName = "Select";

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => (
		<input
			ref={ref}
			type="checkbox"
			className={cn("size-4 rounded border-input accent-primary", className)}
			{...props}
		/>
	),
);
Checkbox.displayName = "Checkbox";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
	return <label className={cn("text-[13px] font-semibold text-foreground/80", className)} {...props} />;
}
