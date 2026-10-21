import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(16,24,40,.12),inset_0_1px_0_rgba(255,255,255,.12)] hover:bg-primary/90",
				secondary: "bg-primary-soft text-primary hover:bg-primary-soft/70",
				outline:
					"border border-border bg-surface text-foreground shadow-[0_1px_2px_rgba(16,24,40,.04)] hover:border-input hover:bg-surface-2",
				ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4",
				sm: "h-8 rounded-lg px-3 text-xs",
				lg: "h-10 px-5",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, type, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...(asChild ? {} : { type: type ?? "button" })}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { buttonVariants };
