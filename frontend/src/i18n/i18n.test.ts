import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseCsv, toDictionary } from "./csv";
import { setDictionary, t, tv } from "./index";

afterEach(() => setDictionary("en", {}));

describe("csv", () => {
	it("parses quoted fields with commas, quotes and newlines", () => {
		const rows = parseCsv('a,b\n"x, y","say ""hi"""\r\n"multi\nline",z\n');
		expect(rows).toEqual([
			["a", "b"],
			["x, y", 'say "hi"'],
			["multi\nline", "z"],
		]);
	});

	it("reads the real ar.csv and finds known entries", () => {
		const text = readFileSync(path.resolve(__dirname, "../../../sijil/translations/ar.csv"), "utf-8");
		const dict = toDictionary(parseCsv(text));
		expect(Object.keys(dict).length).toBeGreaterThan(500);
		expect(dict["Cases"]).toBeTruthy();
		expect(dict["{0}–{1} of {2}"]).toContain("{2}");
	});
});

describe("t", () => {
	it("falls back to the English source", () => {
		expect(t("Cases")).toBe("Cases");
	});

	it("translates and fills positional placeholders after translation", () => {
		setDictionary("ar", { "{0} of {1}": "{0} من {1}", Overdue: "متأخرة" });
		expect(t("{0} of {1}", 3, 10)).toBe("3 من 10");
		expect(tv("Overdue")).toBe("متأخرة");
		expect(tv(null)).toBe("");
	});
});
