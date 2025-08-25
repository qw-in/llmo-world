import path from "node:path";
import { snapshot } from "node:test";

/**
 * Moves snapshot files to a __snapshots__ directory rather than the default
 * @see https://nodejs.org/api/test.html#snapshot-testing
 */
snapshot.setResolveSnapshotPath((file) => {
	const dirname = path.dirname(file);
	const basename = path.basename(file);

	return path.join(dirname, "__snapshots__", `${basename}.snapshot`);
});
