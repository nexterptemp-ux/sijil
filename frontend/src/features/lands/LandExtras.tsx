import { useBoot } from "@/app/boot";
import { RelatedTasks } from "@/features/tasks/CaseTasks";
import type { Land } from "./api";

/** Land sections owned by other features. */
export function LandExtras({ land }: { land: Land }) {
	const { boot } = useBoot();
	return (
		<RelatedTasks
			filter={{ land: land.name }}
			prefill={{ land: land.name, land_name: land.land_name }}
			canCreate={boot.can_create["Sijil Task"]}
			allLink={`/tasks?land=${land.name}`}
		/>
	);
}
