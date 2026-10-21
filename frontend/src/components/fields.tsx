// Form building blocks: labelled field, typeahead pickers for linked records and users.
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Label } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/menu";
import { t } from "@/i18n";
import { metaApi, metaKeys } from "@/lib/api/meta";
import type { LookupDoctype, Option } from "@/lib/api/types";
import { useDebounced } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function Field({
	label,
	htmlFor,
	error,
	hint,
	required,
	className,
	children,
}: {
	label: string;
	htmlFor?: string;
	error?: string;
	hint?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={htmlFor}>
				{label}
				{required && <span className="text-danger"> *</span>}
			</Label>
			{children}
			{error ? (
				<p className="text-xs text-danger" role="alert">
					{error}
				</p>
			) : hint ? (
				<p className="text-xs text-muted-foreground">{hint}</p>
			) : null}
		</div>
	);
}

interface ComboboxProps {
	id?: string;
	value: string | null | undefined;
	onChange: (value: string | null, option?: Option) => void;
	/** Options for the current search text. */
	useOptions: (text: string, open: boolean) => { options: Option[]; loading: boolean };
	/** Display label for the current value when it isn't in the loaded options. */
	selectedLabel?: string | null;
	placeholder?: string;
	disabled?: boolean;
	invalid?: boolean;
	clearable?: boolean;
}

/** Accessible typeahead: input + listbox in a popover, keyboard navigable. */
export function Combobox({
	id,
	value,
	onChange,
	useOptions,
	selectedLabel,
	placeholder,
	disabled,
	invalid,
	clearable = true,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const [text, setText] = React.useState("");
	const [active, setActive] = React.useState(0);
	const listId = React.useId();
	const inputRef = React.useRef<HTMLInputElement>(null);
	const { options, loading } = useOptions(text, open);

	const choose = (option: Option) => {
		onChange(option.value, option);
		setOpen(false);
		setText("");
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
			setOpen(true);
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive((i) => Math.min(i + 1, options.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const option = options[active];
			if (option) choose(option);
		} else if (e.key === "Escape") setOpen(false);
	};

	const display = open ? text : selectedLabel || value || "";

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverAnchor asChild>
				<div
					className={cn(
						"flex h-10 items-center rounded-[10px] border border-input bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors hover:border-muted-foreground/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
						invalid && "border-danger",
						disabled && "opacity-50",
					)}
				>
					<input
						id={id}
						ref={inputRef}
						role="combobox"
						aria-expanded={open}
						aria-controls={listId}
						aria-autocomplete="list"
						aria-invalid={invalid || undefined}
						disabled={disabled}
						dir="auto"
						className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
						placeholder={placeholder ?? t("Select...")}
						value={display}
						onFocus={() => setOpen(true)}
						onClick={() => setOpen(true)}
						onChange={(e) => {
							setText(e.target.value);
							setActive(0);
							setOpen(true);
						}}
						onKeyDown={onKeyDown}
					/>
					{clearable && value && !disabled ? (
						<button
							type="button"
							className="px-2 text-muted-foreground hover:text-foreground"
							aria-label={t("Clear")}
							onClick={() => onChange(null)}
						>
							<X className="size-4" />
						</button>
					) : (
						<ChevronsUpDown className="mx-2 size-4 text-muted-foreground" aria-hidden />
					)}
				</div>
			</PopoverAnchor>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] min-w-56"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={(e) => {
					if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
				}}
			>
				<ul id={listId} role="listbox" className="max-h-64 overflow-y-auto">
					{loading && <li className="px-2 py-1.5 text-sm text-muted-foreground">{t("Loading...")}</li>}
					{!loading && options.length === 0 && (
						<li className="px-2 py-1.5 text-sm text-muted-foreground">{t("No results")}</li>
					)}
					{options.map((option, i) => (
						<li
							key={option.value}
							role="option"
							aria-selected={option.value === value}
							className={cn(
								"flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-sm",
								i === active && "bg-muted",
							)}
							onMouseEnter={() => setActive(i)}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => choose(option)}
						>
							<span className="truncate" dir="auto">
								{option.label}
							</span>
							{option.value === value && <Check className="size-4 text-primary" />}
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

/** Picker for a linked record using meta.lookup (title-aware). */
export function LookupSelect({
	doctype,
	filters,
	label,
	...props
}: Omit<ComboboxProps, "useOptions" | "selectedLabel"> & {
	doctype: LookupDoctype;
	filters?: Record<string, string>;
	/** Known label of the current value (avoids an extra request). */
	label?: string | null;
}) {
	const labelQuery = useQuery({
		queryKey: metaKeys.label(doctype, props.value ?? ""),
		queryFn: () => metaApi.labelFor(doctype, props.value as string),
		enabled: Boolean(props.value) && !label,
		staleTime: 5 * 60_000,
	});
	const useOptions = (text: string, open: boolean) => {
		const q = useDebounced(text, 250);
		const query = useQuery({
			queryKey: metaKeys.lookup(doctype, q, filters),
			queryFn: () => metaApi.lookup(doctype, q, filters),
			enabled: open,
			staleTime: 30_000,
		});
		return { options: query.data ?? [], loading: query.isFetching && !query.data };
	};
	return <Combobox {...props} useOptions={useOptions} selectedLabel={label ?? labelQuery.data} />;
}

export function useUsers() {
	return useQuery({ queryKey: metaKeys.users, queryFn: () => metaApi.users(), staleTime: 5 * 60_000 });
}

export function UserSelect(props: Omit<ComboboxProps, "useOptions" | "selectedLabel">) {
	const users = useUsers();
	const all = React.useMemo<Option[]>(
		() => (users.data ?? []).map((u) => ({ value: u.name, label: u.full_name || u.name })),
		[users.data],
	);
	const useOptions = (text: string) => {
		const q = text.trim().toLowerCase();
		return {
			options: q
				? all.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
				: all,
			loading: users.isLoading,
		};
	};
	const selected = all.find((o) => o.value === props.value)?.label;
	return <Combobox {...props} useOptions={useOptions} selectedLabel={selected} />;
}
