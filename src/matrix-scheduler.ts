import { type ConsolaInstance, consola } from "consola";

type AnyMatrix = Record<string, readonly unknown[]>;

type MatrixStep<TMatrix extends AnyMatrix> = {
	readonly [Key in keyof TMatrix]: TMatrix[Key][number];
};

type MatrixSchdulerOptions<TMatrix extends AnyMatrix> = {
	consola?: ConsolaInstance;
	cursor?: string;
	matrix: TMatrix;
};

export class MatrixScheduler<const TMatrix extends AnyMatrix>
	implements IterableIterator<MatrixStep<TMatrix>>
{
	#cursor: Uint8Array;
	#exhausted = false;
	#log: ConsolaInstance;
	#matrix: TMatrix;

	constructor(options: MatrixSchdulerOptions<TMatrix>) {
		this.#log = (options.consola ?? consola).withTag("MatrixScheduler");
		this.#matrix = options.matrix;

		if (options.cursor) {
			this.#cursor = Uint8Array.from(Buffer.from(options.cursor, "hex"));

			const entries = Object.entries(this.#matrix);
			if (entries.length !== this.#cursor.length) {
				throw new Error("invalid cursor");
			}

			let cursorIndex = 0;
			for (const [_, values] of entries) {
				const index = this.#cursor[cursorIndex];
				if (index >= values.length) {
					throw new Error("invalid cursor");
				}
				cursorIndex++;
			}
		} else {
			this.#cursor = new Uint8Array(Object.keys(this.#matrix).length).fill(0);
		}

		this.#log.trace("constructed");
	}

	[Symbol.iterator](): IterableIterator<MatrixStep<TMatrix>> {
		this.#log.trace("interator");
		return this;
	}

	save(): string {
		this.#log.trace("save");

		if (this.#exhausted) {
			throw new Error("already exhausted");
		}

		this.#exhausted = true;
		return Buffer.from(this.#cursor).toString("hex");
	}

	next(): IteratorResult<MatrixStep<TMatrix>, undefined> {
		this.#log.debug("next");

		if (this.#exhausted) {
			return { done: true, value: undefined };
		}

		const step = {};

		let cursorIndex = 0;
		let carry = true;
		for (const [key, values] of Object.entries(this.#matrix).reverse()) {
			const index = this.#cursor[cursorIndex];

			const item = values[index];
			this.#log.debug(`step[${key}] = ${item}`);
			step[key] = item;

			if (carry) {
				this.#cursor[cursorIndex] = (index + 1) % values.length;
				carry = this.#cursor[cursorIndex] === 0;
			}

			cursorIndex++;
		}

		this.#exhausted ||= carry;

		return {
			done: false,
			value: step as MatrixStep<TMatrix>,
		};
	}

	return(): IteratorResult<MatrixStep<TMatrix>, undefined> {
		this.#log.trace("return");
		this.#exhausted = true;
		return { done: true, value: undefined };
	}
}
