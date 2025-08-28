import { createConsola } from "consola";
import { Hono } from "hono";
import { describe, it, type TestContext } from "node:test";
import { CaseServer } from "./case-server.ts";

describe("CaseServer", () => {
	it("should return a permissive /robots.txt", async (ctx: TestContext) => {
		const caseServer = new CaseServer({
			consola: createConsola({ level: 0 }),
		});

		const app = new Hono();

		app.use(caseServer.middleware);

		const response = await app.request("/robots.txt");
		ctx.assert.equal(response.status, 200);
		ctx.assert.equal(
			response.headers.get("Content-Type"),
			"text/html; charset=UTF-8",
		);
		ctx.assert.snapshot(await response.text());
	});

	it("should support registering routes", async (ctx: TestContext) => {
		const caseServer = new CaseServer({
			consola: createConsola({ level: 0 }),
		});

		const app = new Hono();

		app.use(caseServer.middleware);

		const path = "/test";
		const html = "<h1>Test</h1>";

		const preResponse = await app.request(path);
		ctx.assert.equal(preResponse.status, 404, "route should not exist yet");

		{
			using route = caseServer.registerRoute(path, html);

			// TODO make util
			// Intrument route.called for assertions
			const inpect = (() => {
				let state: "pending" | "resolved" | "rejected" = "pending";

				route.firstCall.then(
					() => {
						state = "resolved";
					},
					() => {
						state = "rejected";
					},
				);

				return {
					get state() {
						return state;
					},
				};
			})();

			ctx.assert.equal(inpect.state, "pending");

			const response = await app.request(path, {
				headers: {
					"X-Custom-Header": "value",
				},
			});

			ctx.assert.equal(response.status, 200);
			ctx.assert.equal(await response.text(), html);

			ctx.assert.equal(inpect.state, "resolved");
			ctx.assert.deepEqual(
				route.calls.map((c) => ({
					...c,
					receivedAt: null,
				})),
				[
					{
						headers: {
							"x-custom-header": "value",
						},
						receivedAt: null,
						url: "http://localhost/test",
					},
				],
			);
		}

		const postResponse = await app.request(path);

		// NOTE: I experienced a bug here in node 24.4.0 which was fixed by upgrading to 24.6.0.
		//       was broken by the promise-wrapping above
		ctx.assert.equal(postResponse.status, 404, "route should be unregistered");
	});
});
