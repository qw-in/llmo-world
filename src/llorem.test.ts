import { describe, it, type TestContext } from "node:test";

import { llorem } from "./llorem.ts";

describe("llorem", () => {
	it("should generate correct number of words", ({ assert }: TestContext) => {
		const text = llorem(10);
		const words = text.split(" ");
		assert.equal(words.length, 10);
	});
});
