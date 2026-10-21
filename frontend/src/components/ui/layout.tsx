// Small presentational primitives: card, badge, skeleton, tabs.
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { isRtl } from "@/i18n";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("rounded-[var(--radius)] border border-border/80 bg-surface shadow-card", className)}
			{...props}
		/>
	);
}

export function CardHeader({
	title,
	action,
	icon,
	count,
	description,
	className,
}: {
	title: React.ReactNode;
	action?: React.ReactNode;
	icon?: React.ReactNode;
	count?: number;
	description?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3.5", className)}>
			<div className="flex min-w-0 items-center gap-2.5">
				{icon && (
					<span
						className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4"
						aria-hidden
					>
						{icon}
					</span>
				)}
				<div className="min-w-0">
					<h2 className="flex items-center gap-2 text-[15px] font-bold leading-tight">
						{title}
						{count !== undefined && (
							<span className="tabular rounded-full bg-muted px-2 py-px text-[11px] font-semibold text-muted-foreground">
								{count}
							</span>
						)}
					</h2>
					{description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
				</div>
			</div>
			{action}
		</div>
	);
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-5", className)} {...props} />;
}

const badgeVariants = cva(
	"inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold leading-5 ring-1 ring-inset",
	{
		variants: {
			tone: {
				neutral: "bg-muted text-muted-foreground ring-border",
				primary: "bg-primary-soft text-primary ring-primary/15",
				success: "bg-success-soft text-success ring-success/15",
				warning: "bg-warning-soft text-warning ring-warning/20",
				danger: "bg-danger-soft text-danger ring-danger/15",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
	className,
	tone,
	dot,
	children,
	...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
	return (
		<span className={cn(badgeVariants({ tone }), className)} {...props}>
			{dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
			{children}
		</span>
	);
}

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden />;
}

/** Radix defaults to LTR and sets dir on the whole tab tree; follow the page direction instead. */
export function Tabs(props: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
	return <TabsPrimitive.Root dir={isRtl() ? "rtl" : "ltr"} {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cn(
				"flex gap-1 overflow-x-auto overflow-y-hidden rounded-xl border border-border/80 bg-surface p-1 shadow-card",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-primary-soft data-[state=active]:text-primary",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content className={cn("pt-4 focus-visible:outline-none", className)} {...props} />;
}
