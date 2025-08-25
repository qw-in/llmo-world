import { webcrypto } from "node:crypto";

/**
 * Generate a short random ID.
 */
function shortId(): string {
	return webcrypto.randomUUID().substring(0, 8);
}

type Flag = `flag_${string}`;

type TupleOf<
	TValue,
	TCount extends number,
	TResult extends TValue[] = [],
> = TResult["length"] extends TCount
	? TResult
	: TupleOf<TValue, TCount, [TValue, ...TResult]>;

/**
 * Generate a set of unique flags.
 */
export function generateFlags<TCount extends number>(
	count: TCount,
): TupleOf<Flag, TCount> {
	const flags: Flag[] = [];

	for (let i = 0; i < count; i++) {
		flags.push(`flag_${shortId()}`);
	}

	return flags as TupleOf<Flag, TCount>;
}
