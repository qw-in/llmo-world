import { Liquid } from "liquidjs";
import { llorem } from "./llorem.ts";

const liquid = new Liquid({
	strictFilters: true,
	strictVariables: true,
});

/**
 * Specifies a custom Liquid tag that generates "Lorem Ipsum" style text using
 * the `llorem` utility function.
 *
 * @example
 *   ```liquid
 *   <p>{% llorem 20 %}</p>
 *   ```
 */
liquid.registerTag("llorem", {
	parse(tagToken) {
		this.count = Number.parseInt(tagToken.args, 10);
		if (Number.isNaN(this.count) || this.count < 1) {
			this.count = 10;
		}
	},
	render(_, emitter) {
		emitter.write(llorem(this.count));
	},
});

/**
 * LiquidJS doesn't have a built-in filter for base64 encoding so we define one
 * @see https://shopify.dev/docs/api/liquid/filters/base64_encode
 */
liquid.registerFilter("base64_encode", (value) => {
	if (typeof value !== "string") {
		throw new Error("base64_encode filter only supports string values");
	}
	return globalThis.btoa(value);
});

type RenderTemplateOptions = {
	template: string;
	variables?: Record<string, string>;
};

/**
 * Renders a Liquid template string with the provided variables.
 */
export async function render(options: RenderTemplateOptions): Promise<string> {
	try {
		return await liquid.parseAndRender(options.template, options.variables);
	} catch (cause) {
		throw new Error("failed to render template", { cause });
	}
}
