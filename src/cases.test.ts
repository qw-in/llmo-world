import path from "node:path";
import { describe, it, type TestContext } from "node:test";
import { pathToFileURL } from "node:url";
import { createConsola } from "consola";
import { casesLoad, loadTemplateForCase } from "./cases.ts";

const FIXTURE_URL = pathToFileURL(
	path.join(import.meta.dirname, "__fixtures__/cases"),
);

describe("casesLoad", () => {
	it("should load all valid cases", async (ctx: TestContext) => {
		const cases = await casesLoad({
			consola: createConsola({ level: 0 }),
			directory: FIXTURE_URL,
		});

		ctx.assert.equal(cases.length, 2);

		// TODO: normalize the paths for snapshot
		ctx.assert.snapshot(cases);
	});
});

describe("loadTemplate", () => {
	it("should load templates and generate a stable hash", async (ctx: TestContext) => {
		const cases = await casesLoad({
			consola: createConsola({ level: 0 }),
			directory: FIXTURE_URL,
		});

		ctx.assert.ok(cases[0]);

		const template = await loadTemplateForCase(cases[0]);

		ctx.assert.equal(
			template.hash,
			"5ce6576124723e54d43fe63bf26e77103f81ac975838244480a4bfccb48ffc6d",
		);
	});
});
