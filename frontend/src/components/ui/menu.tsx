import * as Menu from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Content>) {
	return (
		<Menu.Portal>
			<Menu.Content
				sideOffset={4}
				align="end"
				className={cn("z-50 min-w-44 rounded-md border border-border bg-surface p-1 shadow-lg", className)}
				{...props}
			/>
		</Menu.Portal>
	);
}

export function DropdownMenuItem({
	className,
	destructive,
	...props
}: React.ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }) {
	return (
		<Menu.Item
			className={cn(
				"flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[disabled]:opacity-50 [&_svg]:size-4",
				destructive && "text-danger",
				className,
			)}
			{...props}
		/>
	);
}

export const DropdownMenuSeparator = () => <Menu.Separator className="my-1 h-px bg-border" />;

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
	className,
	align = "start",
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				sideOffset={4}
				className={cn("z-50 rounded-md border border-border bg-surface p-1 shadow-lg", className)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}
