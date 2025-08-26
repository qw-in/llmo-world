import { type ServerType, serve } from "@hono/node-server";
import { defineCommand } from "citty";
import consola from "consola";
import { Hono } from "hono";
import { html } from "hono/html";
import { casesLoad, loadTemplateForCase } from "../cases.ts";
import { render } from "../render.ts";

const log = consola.withTag("cli");

let server: ServerType | null = null;

export const previewCasesCommand = defineCommand({
	meta: {
		description: "Serve the LLMo cases",
		name: "preview-cases",
		version: "0.0.0",
	},
	args: {
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

		const app = new Hono()
			.get("/", async (ctx) => {
				const cases = await casesLoad({
					consola: log,
				});

				const casesHtml = cases.map(
					(case_) =>
						html`<li><a href="/${case_.id}">${case_.name}</a>: ${case_.description}</li>`,
				);

				return ctx.html(
					html`<!doctype html>
					<html>
						<body>
							<h1>LLMo Cases</h1>
							<ul>${casesHtml}</ul>
						</body>
					</html>`,
				);
			})
			.get("/:caseId", async (ctx) => {
				// Load all cases every time to pick up changes
				const cases = await casesLoad({
					consola: log,
				});

				const case_ = cases.find(
					(case_) => case_.id === ctx.req.param("caseId"),
				);
				if (!case_) {
					return ctx.notFound();
				}

				const template = await loadTemplateForCase(case_);

				const rendered = await render({
					template: template.value,
					variables: {
						control: "flag_control",
						test: "flag_test",
					},
				});

				return ctx.html(rendered);
			});

		log.info(`Starting server at "http://localhost:${args.port}"...`);

		server = await serve({
			fetch: app.fetch,
			port: Number.parseInt(args.port, 10),
		});

		log.success(`Preview server "http://localhost:${args.port}"`);

		await new Promise<void>((resolve) => {
			if (server) {
				server.on("close", () => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	},
	async cleanup() {
		if (server) {
			server.close();
			log.info("Shut down the server.");
		}
	},
});
