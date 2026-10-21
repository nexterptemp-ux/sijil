/** Minimal RFC-4180 CSV parser (quoted fields, "" escapes, CRLF) for Frappe translation files. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else quoted = false;
			} else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ",") {
			row.push(field);
			field = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && text[i + 1] === "\n") i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else field += c;
	}
	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || (r[0] ?? "") !== "");
}

/** Frappe format: source,translation[,context] */
export function toDictionary(rows: string[][]): Record<string, string> {
	const dict: Record<string, string> = {};
	for (const [source, translation] of rows) {
		if (source && translation) dict[source] = translation;
	}
	return dict;
}
