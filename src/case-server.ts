import consola, { type ConsolaInstance } from "consola";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { matchedRoutes } from "hono/route";

type CaseServerOptions = {
	consola?: ConsolaInstance;
};

export class CaseServer {
	#log: ConsolaInstance;
	#routes: Map<string, { html: string; onRequest: () => void }> = new Map();

	middleware: MiddlewareHandler;

	constructor(options: CaseServerOptions = {}) {
		this.#log = (options.consola ?? consola).withTag("CaseServer");

		this.middleware = createMiddleware(async (ctx, next) => {
			// Base matched routes (hono provides one by default)
			const routes = matchedRoutes(ctx);

			// TODO: HEAD

			// Return a permissive robots.txt to allow the crawlers to index the site
			if (ctx.req.path === "/robots.txt") {
				if (routes.length > 1) {
					this.#log.warn("overriding existing route matching /robots.txt");
				}

				this.#log.debug("returning permissive /robots.txt");

				return ctx.html("User-agent: *\nAllow: /\n");
			}

			// TODO: HEAD

			const route = this.#routes.get(ctx.req.path);
			if (route) {
				if (routes.length > 1) {
					this.#log.warn(`overriding existing route matching ${ctx.req.path}`);
				}

				this.#log.debug(`returning registered route for ${ctx.req.path}`);

				route.onRequest();

				return ctx.html(route.html);
			}

			this.#log.debug(`no registered route for ${ctx.req.path}, continuing`);

			await next();
		});
	}

	registerRoute<TPath extends string>(path: TPath, html: string) {
		if (this.#routes.has(path)) {
			throw new Error(`Route already registered for path "${path}"`);
		}

		this.#log.debug(`registering route for ${path}`);

		const calls: null[] = [];
		const calledPromise = new Promise<void>((resolve) => {
			this.#routes.set(path, {
				html,
				onRequest: () => {
					this.#log.debug(`route for ${path} called`);
					calls.push(null);
					resolve();
				},
			});
		});

		const dispose = () => {
			this.#log.debug(`unregistering route for ${path}`);
			this.#routes.delete(path);
		};

		return {
			wasCalled: () => calls.length > 0,
			get called() {
				return calledPromise;
			},
			[Symbol.dispose]: dispose,
		};
	}
}
