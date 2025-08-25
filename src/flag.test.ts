import { describe, it, type TestContext } from "node:test";
import { generateFlags } from "./flag.ts";

describe("flag", () => {
	it("should generate flags", (ctx: TestContext) => {
		const [flag1, flag2] = generateFlags(2);
		ctx.assert.match(flag1, /^flag_[a-f0-9]{8}$/);
		ctx.assert.match(flag2, /^flag_[a-f0-9]{8}$/);
		ctx.assert.notEqual(flag1, flag2);
	});
});
