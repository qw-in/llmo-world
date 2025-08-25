import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { type ConsolaInstance, consola } from "consola";
import z from "zod";
import { hashString } from "./util.ts";

const CaseMetadataSchema = z.object({
	name: z.string(),
	description: z.string(),
});

export type Case = {
	id: string;
	name: string;
	description: string;
	directory: URL;
};

type CasesLoadOptions = {
	directory?: URL;
	consola?: ConsolaInstance;
};

export async function casesLoad(
	options: CasesLoadOptions = {},
): Promise<Case[]> {
	const log = (options.consola ?? consola).withTag("casesLoad");

	const directory =
		options.directory ?? pathToFileURL(path.join(process.cwd(), "cases/"));

	log.debug(`loading cases from "${directory.pathname}"`);

	const dirents = await glob(path.join(directory.pathname, "***/case.json"), {
		withFileTypes: true,
	});

	const cases: Case[] = [];
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
			throw new Error(`failed to read case file "${id}"`, {
				cause,
			});
		}

		let json: unknown;
		try {
			json = JSON.parse(rawJson);
		} catch (cause) {
			throw new Error(`failed to parse case file "${id}"`, {
				cause,
			});
		}

		let metadata: z.infer<typeof CaseMetadataSchema>;
		try {
			metadata = CaseMetadataSchema.parse(json);
		} catch (cause) {
			throw new Error(`invalid case file "${id}"`, { cause });
		}

		cases.push({
			id,
			name: metadata.name,
			description: metadata.description,
			directory: pathToFileURL(`${dirent.parentPath}/`),
		});

		log.debug(`loaded case "${metadata.name}"`);
	}

	log.debug(`loaded ${cases.length} cases`);

	return cases;
}

type CaseTemplate = {
	hash: string;
	value: string;
};

/**
 * Loads the Liquid template for a given case and computes its hash.
 */
export async function loadTemplateForCase(case_: Case): Promise<CaseTemplate> {
	const templatePath = path.join(case_.directory.pathname, "template.liquid");
	let template: string;
	try {
		template = await readFile(templatePath, "utf-8");
	} catch (cause) {
		throw new Error(`failed to read case template ${templatePath}`, { cause });
	}

	return {
		value: template,
		hash: hashString(template),
	};
}
