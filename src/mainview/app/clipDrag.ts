import { getRpc } from "../rpc";
import { clipIdsEqual } from "./clipOrder";

export {
	appStateWithClipOrder,
	appStateWithClipVolume,
	appStateWithMasterVolume,
	clipIdsAfterDrag,
	clipIdsEqual,
} from "./clipOrder";

export function persistClipOrderIfChanged(
	clipIds: string[],
	serverClipIds: string[],
): void {
	if (clipIdsEqual(clipIds, serverClipIds)) return;
	void getRpc().request.reorderClips({ ids: clipIds });
}
