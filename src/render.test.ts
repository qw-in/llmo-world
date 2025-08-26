import { describe, it, type TestContext } from "node:test";
import { render } from "./render.ts";

describe("renderTemplate", () => {
	it("should render a template with variables", async (ctx: TestContext) => {
		const result = await render({
			template:
				"<html><body><p>{{ control }}</p><p>{{ test }}</p></body></html>",
			variables: { control: "Hello", test: "World" },
		});
		ctx.assert.snapshot(result);
	});

	it("should throw if missing variables", async (ctx: TestContext) => {
		await ctx.assert.rejects(async () => {
			await render({
				template:
					"<html><body><p>{{ control }}</p><p>{{ test }}</p></body></html>",
				variables: { control: "Hello" },
			});
		});
	});

	it("should accept extra variables", async (ctx: TestContext) => {
		await ctx.assert.doesNotReject(async () => {
			await render({
				template:
					"<html><body><p>{{ control }}</p><p>{{ test }}</p></body></html>",
				variables: { control: "Hello", test: "World", extra: "!" },
			});
		});
	});

	// TODO: could be nice to support this for more descriptive variable names
	it("should not convert variables to snake_case", async (ctx: TestContext) => {
		await ctx.assert.rejects(async () => {
			await render({
				template:
					"<html><body><p>{{ control_flag }}</p><p>{{ test_flag }}</p></body></html>",
				variables: { controlFlag: "Hello", testFlag: "World" },
			});
		});
	});

	describe("llorem tag", () => {
		it("should render the default number of words", async (ctx: TestContext) => {
			const result = await render({
				template: "{% llorem %}",
			});
			const words = result.split(" ");
			ctx.assert.equal(words.length, 10);
		});

		it("should render specificed number of words", async (ctx: TestContext) => {
			const result = await render({
				template: "{% llorem 5 %}",
			});
			const words = result.split(" ");
			ctx.assert.equal(words.length, 5);
		});
	});

	describe("base64_encode filter", () => {
		it("should base64 encode a string literal", async (ctx: TestContext) => {
			const result = await render({
				template: `{{ 'hello world!' | base64_encode }}`,
			});
			ctx.assert.equal(globalThis.atob(result), "hello world!");
		});

		it("should base64 encode a string variable", async (ctx: TestContext) => {
			const result = await render({
				template: `{{ var | base64_encode }}`,
				variables: { var: "hello world!" },
			});
			ctx.assert.equal(globalThis.atob(result), "hello world!");
		});

		it("should throw for non-string values", async (ctx: TestContext) => {
			ctx.assert.rejects(async () => {
				await render({
					template: `{{ 123 | base64_encode }}`,
				});
			});
		});
	});
});
