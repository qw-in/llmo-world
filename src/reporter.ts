import { type ConsolaInstance, consola } from "consola";
import { webcrypto } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Agent } from "./agents.ts";
import type { HttpGetRequest } from "./case-server.ts";
import type { Case } from "./cases.ts";
import type { Flag } from "./flag.ts";

type ExecutionDescription = {
	agent: Agent;
	case: Case;
	controlFlag: Flag;
	html: string;
	htmlTemplateHash: string;
	id: string;
	prompt: string;
	promptTemplateHash: string;
	testFlag: Flag;
};

type ExecutionResult = {
	calls: HttpGetRequest[];
	completedAt: Date;
	controlFound: boolean;
	message: string;
	startedAt: Date;
	testFound: boolean;
};

type JsonReporterOptions = {
	consola?: ConsolaInstance;
};

export class Reporter implements AsyncDisposable {
	#log: ConsolaInstance;

	#id: string = webcrypto.randomUUID();
	#startedAt = Date.now();
	#executions = new Set<{
		description: ExecutionDescription;
		result: ExecutionResult;
	}>();

	constructor(options: JsonReporterOptions) {
		this.#log = (options.consola ?? consola).withTag(
			`Reporter[${this.#id.slice(0, 8)}]`,
		);
	}

	beginExecution(description: ExecutionDescription) {
		this.#log.debug("beginExecution", description.id);

		let resolved = false;

		const startedAt = Date.now();

		const completeExecution = async (
			result: Omit<ExecutionResult, "startedAt" | "completedAt">,
		) => {
			if (resolved) {
				throw new Error("Execution was already completed");
			}

			this.#log.debug("finishExecution", description.id);

			resolved = true;
			const finishedAt = Date.now();

			this.#executions.add({
				description,
				result: {
					...result,
					startedAt: new Date(startedAt),
					completedAt: new Date(finishedAt),
				},
			});
		};

		const dispose = async () => {
			if (!resolved) {
				throw new Error("Execution was not completed before disposal");
			}
		};

		return {
			id: description.id,
			completeExecution,
			[Symbol.asyncDispose]: dispose,
		};
	}

	async [Symbol.asyncDispose]() {
		const fileName = `results-${webcrypto.randomUUID().slice(0, 8)}.json`;
		this.#log.info(`Writing temporary results to "./${fileName}"`);
		await writeFile(
			path.join(process.cwd(), fileName),
			JSON.stringify(
				{
					startedAt: this.#startedAt,
					finishedAt: Date.now(),
					executions: Array.from(this.#executions),
				},
				null,
				2,
			),
			"utf-8",
		);
	}
}
