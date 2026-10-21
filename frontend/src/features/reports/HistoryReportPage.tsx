import { useQuery } from "@tanstack/react-query";
import { FileDown, Printer } from "lucide-react";
import * as React from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common";
import { LoadingRows, QueryView } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/layout";
import { t } from "@/i18n";
import { reportKeys, reportsApi } from "./api";

/**
 * Case or land history report rendered by the backend template (the same HTML the PDF is made
 * from). Shown in a sandboxed frame; "Download PDF" asks Frappe for the server-side PDF.
 */
export function HistoryReportPage({ kind }: { kind: "case" | "land" }) {
	const { name = "" } = useParams();
	const frame = React.useRef<HTMLIFrameElement>(null);
	const query = useQuery({
		queryKey: reportKeys.history(kind, name),
		queryFn: () => (kind === "case" ? reportsApi.caseHistory(name) : reportsApi.landHistory(name)),
	});
	const pdf = kind === "case" ? reportsApi.casePdfUrl(name) : reportsApi.landPdfUrl(name);
	return (
		<>
			<PageHeader
				back={{ to: kind === "case" ? `/cases/${name}` : `/lands/${name}`, label: kind === "case" ? t("Back to case") : t("Back to land / project") }}
				title={query.data?.title ?? (kind === "case" ? t("Case History Report") : t("Land / Project History Report"))}
				actions={
					<>
						<Button variant="outline" onClick={() => frame.current?.contentWindow?.print()} disabled={!query.data}>
							<Printer />
							{t("Print")}
						</Button>
						<Button asChild>
							<a href={pdf} target="_blank" rel="noreferrer">
								<FileDown />
								{t("Download PDF")}
							</a>
						</Button>
					</>
				}
			/>
			<QueryView query={query} loading={<LoadingRows rows={8} />}>
				{(data) => (
					<Card className="overflow-hidden">
						<iframe
							ref={frame}
							title={data.title}
							srcDoc={data.html}
							// Same-origin is needed for print(); scripts stay disabled.
							sandbox="allow-same-origin allow-modals"
							className="h-[75vh] w-full bg-white"
						/>
					</Card>
				)}
			</QueryView>
		</>
	);
}
