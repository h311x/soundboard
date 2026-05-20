import type { AppState } from "@shared/types";
import { getRpc } from "../rpc";
import { clipIdsEqual } from "./clipOrder";

export {
	clipIdsAfterDrag,
	clipIdsEqual,
	pruneOrderOverride,
	resolveClipIds,
} from "./clipOrder";

export function persistClipOrderIfChanged(
	clipIds: string[],
	serverClipIds: string[],
	applyState: (s: AppState) => Promise<void>,
): void {
	if (clipIdsEqual(clipIds, serverClipIds)) return;
	void getRpc().request.reorderClips({ ids: clipIds }).then(applyState);
}
