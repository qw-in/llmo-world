import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { type ConsolaInstance, consola } from "consola";
import z from "zod";
import { hashString } from "./util.ts";

const AgentMetadataSchema = z.object({
	name: z.string(),
	description: z.string(),
	url: z.string().optional(),
});

export type Agent = {
	id: string;
	name: string;
	description: string;
	url?: string;
	directory: URL;
};

type AgentsLoadOptions = {
	directory?: URL;
	consola?: ConsolaInstance;
};

export async function agentsLoad(
	options: AgentsLoadOptions = {},
): Promise<Agent[]> {
	const log = (options.consola ?? consola).withTag("agentsLoad");

	const directory =
		options.directory ?? pathToFileURL(path.join(process.cwd(), "agents/"));

	log.debug(`loading agents from "${directory.pathname}"`);

	const dirents = await glob(path.join(directory.pathname, "***/agent.json"), {
		withFileTypes: true,
	});

	const agents: Agent[] = [];
	for await (const dirent of dirents) {
		if (!dirent.isFile()) continue;

		const id = path.basename(dirent.parentPath);

		log.debug(`loading "${id}"`);

		let rawJson: string;
		try {
			rawJson = await readFile(
				path.join(dirent.parentPath, dirent.name),
				"utf-8",
			);
		} catch (cause) {
			throw new Error(`failed to read agent file "${id}"`, {
				cause,
			});
		}

		let json: unknown;
		try {
			json = JSON.parse(rawJson);
		} catch (cause) {
			throw new Error(`failed to parse agent file "${id}"`, {
				cause,
			});
		}

		let metadata: z.infer<typeof AgentMetadataSchema>;
		try {
			metadata = AgentMetadataSchema.parse(json);
		} catch (cause) {
			throw new Error(`invalid agent file "${id}"`, { cause });
		}

		agents.push({
			id,
			name: metadata.name,
			description: metadata.description,
			directory: pathToFileURL(`${dirent.parentPath}/`),
		});

		log.debug(`loaded agent "${metadata.name}"`);
	}

	log.debug(`loaded ${agents.length} agents`);

	return agents;
}

type PromptTemplate = {
	hash: string;
	value: string;
};

/**
 * Loads the Liquid template for a given agent and computes its hash.
 */
export async function loadPromptTemplateForAgent(
	agent: Agent,
): Promise<PromptTemplate> {
	const templatePath = path.join(agent.directory.pathname, "prompt.liquid");
	let template: string;
	try {
		template = await readFile(templatePath, "utf-8");
	} catch (cause) {
		throw new Error(`failed to read agent prompt template ${templatePath}`, {
			cause,
		});
	}

	return {
		value: template,
		hash: hashString(template),
	};
}
