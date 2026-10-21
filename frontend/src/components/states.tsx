import { AlertTriangle, Inbox, Lock } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/layout";
import { t } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export function LoadingRows({ rows = 4, className }: { rows?: number; className?: string }) {
	return (
		<div className={cn("space-y-3", className)} role="status" aria-label={t("Loading...")}>
			{Array.from({ length: rows }, (_, i) => (
				<Skeleton key={i} className="h-12 w-full" />
			))}
		</div>
	);
}

export function EmptyState({
	title,
	hint,
	action,
	icon,
	className,
}: {
	title: string;
	hint?: string;
	action?: React.ReactNode;
	icon?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col items-center gap-1.5 px-4 py-8 text-center", className)}>
			<div className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground ring-8 ring-muted/40 [&_svg]:size-5">
				{icon ?? <Inbox />}
			</div>
			<p className="text-sm font-semibold">{title}</p>
			{hint && <p className="max-w-sm text-xs leading-5 text-muted-foreground">{hint}</p>}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}

export function ErrorState({
	error,
	onRetry,
	className,
}: {
	error: unknown;
	onRetry?: () => void;
	className?: string;
}) {
	const denied = error instanceof ApiError && error.isPermission;
	const missing = error instanceof ApiError && error.isNotFound;
	return (
		<EmptyState
			className={className}
			icon={denied ? <Lock /> : <AlertTriangle />}
			title={denied ? t("You do not have access to this.") : missing ? t("Not found") : t("Could not load data.")}
			hint={denied || missing ? undefined : errorMessage(error)}
			action={
				onRetry && !denied && !missing ? (
					<Button variant="outline" size="sm" onClick={onRetry}>
						{t("Try again")}
					</Button>
				) : undefined
			}
		/>
	);
}

/** Renders loading / error / content for a query. */
export function QueryView<T>({
	query,
	loading,
	children,
}: {
	query: { data: T | undefined; error: unknown; isLoading: boolean; refetch: () => unknown };
	loading?: React.ReactNode;
	children: (data: T) => React.ReactNode;
}) {
	if (query.isLoading) return <>{loading ?? <LoadingRows />}</>;
	if (query.error || query.data === undefined)
		return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
	return <>{children(query.data)}</>;
}
