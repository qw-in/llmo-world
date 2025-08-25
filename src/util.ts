import { createHash } from "node:crypto";

/**
 * Returns the SHA-256 hash of a string in hexadecimal format.
 */
export function hashString(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}
