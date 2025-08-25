import path from "node:path";
import { describe, it, type TestContext } from "node:test";
import { pathToFileURL } from "node:url";
import { createConsola } from "consola";
import { agentsLoad, loadPromptTemplateForAgent } from "./agents.ts";

const FIXTURE_URL = pathToFileURL(
	path.join(import.meta.dirname, "__fixtures__/agents"),
);

describe("agentsLoad", () => {
	it("should load all valid agents", async (ctx: TestContext) => {
		const agents = await agentsLoad({
			consola: createConsola({ level: 0 }),
			directory: FIXTURE_URL,
		});

		ctx.assert.equal(agents.length, 2);

		// TODO: normalize the paths for snapshot
		ctx.assert.snapshot(agents);
	});
});

describe("loadPromptTemplate", () => {
	it("should load templates and generate a stable hash", async (ctx: TestContext) => {
		const agents = await agentsLoad({
			consola: createConsola({ level: 0 }),
			directory: FIXTURE_URL,
		});

		ctx.assert.ok(agents[0]);

		const template = await loadPromptTemplateForAgent(agents[0]);

		ctx.assert.equal(
			template.hash,
			"ff9855544b8d43427b7c83429494fd877fc732cb445d82fad511b64f6a16d02f",
		);
	});
});
