import { defineCommand, runMain } from "citty";
import { previewCasesCommand } from "./commands/preview-cases.ts";
import { runCommand } from "./commands/run.ts";

const main = defineCommand({
	meta: {
		name: "llmo",
		version: "0.0.0",
		description: "LLMo command line tool",
	},
	subCommands: {
		run: runCommand,
		["preview-cases"]: previewCasesCommand,
	},
});

await runMain(main);
