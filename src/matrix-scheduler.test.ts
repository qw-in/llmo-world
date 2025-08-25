import { describe, it, type TestContext } from "node:test";
import { createConsola } from "consola";
import { MatrixScheduler } from "./matrix-scheduler.ts";

describe("MatrixScheduler", () => {
	it("should support the simple case", (ctx: TestContext) => {
		const matrix = new MatrixScheduler({
			matrix: {
				agents: ["agent1", "agent2"],
				cases: ["case1", "case2"],
			},
			consola: createConsola({ level: 0 }),
		});

		const result = Array.from(matrix);
		ctx.assert.deepEqual(result, [
			{ agents: "agent1", cases: "case1" },
			{ agents: "agent1", cases: "case2" },
			{ agents: "agent2", cases: "case1" },
			{ agents: "agent2", cases: "case2" },
		]);
	});

	it("should should be resumable", (ctx: TestContext) => {
		const definition = {
			agents: ["agent1", "agent2"],
			cases: ["case1", "case2"],
		} as const;

		const matrix1 = new MatrixScheduler({
			matrix: definition,
			consola: createConsola({ level: 0 }),
		});

		const first = matrix1.next();
		ctx.assert.deepEqual(first.value, { agents: "agent1", cases: "case1" });

		const cursor = matrix1.save();

		const matrix2 = new MatrixScheduler({
			consola: createConsola({ level: 0 }),
			cursor,
			matrix: definition,
		});

		const result = Array.from(matrix2);

		ctx.assert.deepEqual(result, [
			{ agents: "agent1", cases: "case2" },
			{ agents: "agent2", cases: "case1" },
			{ agents: "agent2", cases: "case2" },
		]);
	});

	it("should should reject an out of bounds cursor", (ctx: TestContext) => {
		const matrix1 = new MatrixScheduler({
			matrix: {
				agents: ["agent1", "agent2"],
				cases: ["case1", "case2"],
			},
			consola: createConsola({ level: 0 }),
		});

		const first = matrix1.next();
		ctx.assert.deepEqual(first.value, { agents: "agent1", cases: "case1" });

		const cursor = matrix1.save();

		ctx.assert.throws(() => {
			new MatrixScheduler({
				consola: createConsola({ level: 0 }),
				cursor,
				matrix: {
					agents: ["agent1"],
					cases: ["case1", "case2"],
				},
			});
		});
	});
});
