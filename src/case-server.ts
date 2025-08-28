import consola, { type ConsolaInstance } from "consola";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { matchedRoutes } from "hono/route";

export type HttpGetRequest = {
	headers: Record<string, string>;
	receivedAt: Date;
	url: string;
};

type CaseServerOptions = {
	consola?: ConsolaInstance;
};

export class CaseServer {
	#log: ConsolaInstance;
	#routes: Map<
		string,
		{ html: string; onRequest: (getRequest: HttpGetRequest) => void }
	> = new Map();

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

				if (ctx.req.method === "GET") {
					const getRequest: HttpGetRequest = {
						headers: ctx.req.header(),
						receivedAt: new Date(),
						url: ctx.req.url,
					};

					route.onRequest(getRequest);
				} else {
					this.#log.warn(
						`unreported request with method "${ctx.req.method}" for ${ctx.req.path}`,
					);
				}

				return ctx.html(route.html);
			}

			this.#log.warn(
				`unreported request with method "${ctx.req.method}" for ${ctx.req.path}`,
			);

			this.#log.debug(`no registered route for ${ctx.req.path}, continuing`);

			await next();
		});
	}

	registerRoute<TPath extends string>(path: TPath, html: string) {
		if (this.#routes.has(path)) {
			throw new Error(`Route already registered for path "${path}"`);
		}

		this.#log.debug(`registering route for ${path}`);

		const calls: HttpGetRequest[] = [];
		const calledPromise = new Promise<void>((resolve) => {
			this.#routes.set(path, {
				html,
				onRequest: (call) => {
					this.#log.debug(`route for ${path} called`);
					calls.push(call);
					resolve();
				},
			});
		});

		const dispose = () => {
			this.#log.debug(`unregistering route for ${path}`);
			this.#routes.delete(path);
		};

		return {
			get calls() {
				return calls;
			},
			get firstCall() {
				return calledPromise;
			},
			[Symbol.dispose]: dispose,
		};
	}
}
