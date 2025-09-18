import { type ServerType, serve } from "@hono/node-server";
import { defineCommand } from "citty";
import consola from "consola";
import { Hono } from "hono";

import { agentsLoad, loadPromptTemplateForAgent } from "../agents.ts";
import { CaseServer } from "../case-server.ts";
import { casesLoad, loadTemplateForCase } from "../cases.ts";
import { generateFlags } from "../flag.ts";
import { MatrixScheduler } from "../matrix-scheduler.ts";
import { render } from "../render.ts";
import { Reporter } from "../reporter.ts";

const log = consola.withTag("cli");

let server: ServerType | null = null;

export const runCommand = defineCommand({
	meta: {
		description: "Run the LLMo test runner",
		name: "run",
		version: "0.0.0",
	},
	args: {
		url: {
			description: "Publicly accessible URL of the LLMo server",
			required: true,
			type: "string",
			valueHint: "https://example.com",
		},
		agent: {
			description: "Filter to use a specific agent",
			type: "string",
			valueHint: "openai-chatgpt-search",
		},
		port: {
			default: "3000",
			description: "Port to run the local server on",
			type: "string",
		},
		verbose: {
			type: "boolean",
			description: "Enable verbose logging",
			default: false,
		},
	},
	async run({ args }) {
		if (args.verbose) {
			log.level = 4; // Debug level
		}

		let agents = await agentsLoad({
			consola: log,
		});

		if (args.agent) {
			agents = agents.filter((agent) => agent.id === args.agent);
		}

		if (!agents.length) {
			log.error(`Agents ${args.agent}" not found`);
			return;
		}

		const url = new URL(args.url);

		const app = new Hono();
		const caseServer = new CaseServer({
			consola: log,
		});
		app.use(caseServer.middleware);

		log.info(`Starting server at "http://localhost:${args.port}"...`);

		server = await serve({
			fetch: app.fetch,
			port: Number.parseInt(args.port, 10),
		});

		log.success(`Server is running at "http://localhost:${args.port}"`);
		log.start(`Verifying server is publicly accessible...`);

		// It can take a moment for the server to be publicly accessible for
		// some various reasons, so we retry a few times with a backoff.

		let retries = 5;
		while (true) {
			retries--;
			if (retries < 0) {
				log.error(`Server is not publicly accessible.`);
				return;
			}

			log.debug(`Checking server accessibility, ${retries} retries left...`);

			const testUrl = new URL(`/test-${crypto.randomUUID()}`, url);
			using route = caseServer.registerRoute(testUrl.pathname, "Ok");

			const response = await fetch(testUrl);
			if (!response.ok) {
				// Backoff for 100ms
				await new Promise((resolve) => setTimeout(resolve, 1000));
				continue;
			}
			await route.firstCall;
			break;
		}

		log.success(`Server is publicly accessible`);

		const cases = await casesLoad({
			consola: log,
		});

		const matrix = new MatrixScheduler({
			consola: log,
			matrix: {
				agent: agents,
				case: cases,
			},
		});

		await using reporter = new Reporter({
			consola: log,
		});

		log.info(`${cases.length} cases for ${agents.length} agents.`);

		for (const execution of matrix) {
			const executionId = crypto.randomUUID();

			const elog = log.withTag(executionId.slice(0, 8));

			const [controlFlag, testFlag] = generateFlags(2);

			elog.debug(`Generated flags`, { controlFlag, testFlag });

			const template = await loadTemplateForCase(execution.case);

			const html = await render({
				template: template.value,
				variables: {
					control: controlFlag,
					test: testFlag,
				},
			});

			using route = caseServer.registerRoute(`/${executionId}`, html);

			const promptTemplate = await loadPromptTemplateForAgent(execution.agent);

			const prompt = await render({
				template: promptTemplate.value,
				variables: {
					url: new URL(`/${executionId}`, url).toString(),
				},
			});

			elog.start(
				`Testing "${execution.case.name}" for "${execution.agent.name}". Paste the following prompt into a new session:\n\n${prompt}`,
			);

			await using report = reporter.beginExecution({
				agent: execution.agent,
				case: execution.case,
				controlFlag: controlFlag,
				html,
				htmlTemplateHash: template.hash,
				id: executionId,
				prompt,
				promptTemplateHash: promptTemplate.hash,
				testFlag: testFlag,
			});

			// TODO: Some kind of skip or timeout?

			const response = await elog.prompt(
				"Paste the full response and press enter when done:",
				{
					type: "text",
				},
			);

			const conrolNeedle = controlFlag.replace("flag_", "");
			const testNeedle = testFlag.replace("flag_", "");

			const urlWasCalled = route.calls.length > 0;
			const controlFound = response.includes(conrolNeedle);
			const testFound = response.includes(testNeedle);

			await report.completeExecution({
				calls: route.calls,
				controlFound,
				message: response,
				testFound,
			});

			elog.success("Response received", {
				urlWasCalled,
				controlFound,
				testFound,
			});
		}
	},
	async cleanup() {
		if (server) {
			server.close();
			log.info("Shut down the server.");
		}
	},
});
