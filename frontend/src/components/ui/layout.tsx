// Small presentational primitives: card, badge, skeleton, tabs.
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("rounded-lg border border-border bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({
	title,
	action,
	className,
}: {
	title: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center justify-between gap-3 border-b border-border px-4 py-3", className)}>
			<h2 className="text-sm font-bold">{title}</h2>
			{action}
		</div>
	);
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-4", className)} {...props} />;
}

const badgeVariants = cva(
	"inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
	{
		variants: {
			tone: {
				neutral: "bg-muted text-muted-foreground",
				primary: "bg-primary-soft text-primary",
				success: "bg-success-soft text-success",
				warning: "bg-warning-soft text-warning",
				danger: "bg-danger-soft text-danger",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
	className,
	tone,
	...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
	return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />;
}

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
	return <TabsPrimitive.List className={cn("flex gap-1 overflow-x-auto border-b border-border", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content className={cn("pt-4 focus-visible:outline-none", className)} {...props} />;
}
