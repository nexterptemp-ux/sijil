import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/i18n";
import { ApiError } from "./client";

export function errorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message;
	if (error instanceof Error) return error.message;
	return t("Something went wrong. Please try again.");
}

export function notifyError(error: unknown) {
	toast.error(errorMessage(error));
}

/**
 * A mutation that shows server errors as a toast, optionally shows a success message, and
 * invalidates the given query keys (prefix match) when it succeeds.
 */
export function useApiMutation<TArgs, TResult>(
	fn: (args: TArgs) => Promise<TResult>,
	options: {
		invalidate?: QueryKey[];
		success?: string | ((result: TResult) => string);
		onSuccess?: (result: TResult, args: TArgs) => void;
	} = {},
) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: async (result, args) => {
			await Promise.all((options.invalidate ?? []).map((key) => qc.invalidateQueries({ queryKey: key })));
			if (options.success)
				toast.success(typeof options.success === "function" ? options.success(result) : options.success);
			options.onSuccess?.(result, args);
		},
		onError: notifyError,
	});
}
