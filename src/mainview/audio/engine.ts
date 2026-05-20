import { getRpc } from "../rpc";

type ActivePlay = {
	clipId: string;
	source: AudioBufferSourceNode;
	startedAt: number;
	duration: number;
	ended: boolean;
};

type ProgressListener = () => void;

export type PlaybackSnapshot = {
	progress: Record<string, number>;
	playing: Record<string, boolean>;
};

const EMPTY_SNAPSHOT: PlaybackSnapshot = { progress: {}, playing: {} };

export class AudioEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private buffers = new Map<string, AudioBuffer>();
	private clipGains = new Map<string, GainNode>();
	private active: ActivePlay[] = [];
	private unlocked = false;
	private rafId: number | null = null;
	private progressListeners = new Set<ProgressListener>();
	private snapshot: PlaybackSnapshot = EMPTY_SNAPSHOT;

	private ensureContext(): AudioContext {
		if (!this.ctx) {
			this.ctx = new AudioContext();
			this.masterGain = this.ctx.createGain();
			this.masterGain.connect(this.ctx.destination);
		}
		return this.ctx;
	}

	subscribeProgress(listener: ProgressListener): () => void {
		this.progressListeners.add(listener);
		return () => this.progressListeners.delete(listener);
	}

	getPlaybackSnapshot(): PlaybackSnapshot {
		return this.snapshot;
	}

	private buildSnapshot(): PlaybackSnapshot {
		const ctx = this.ctx;
		const progress: Record<string, number> = {};
		const playing: Record<string, boolean> = {};

		if (!ctx) return EMPTY_SNAPSHOT;

		const now = ctx.currentTime;
		for (const play of this.active) {
			if (!play.ended) {
				playing[play.clipId] = true;
			}
			if (play.ended) {
				progress[play.clipId] = 1;
				continue;
			}
			const elapsed = now - play.startedAt;
			const raw = play.duration > 0 ? elapsed / play.duration : 0;
			const p =
				raw >= 0.995 || elapsed >= play.duration - 0.02
					? 1
					: Math.min(1, Math.max(0, raw));
			progress[play.clipId] = Math.max(progress[play.clipId] ?? 0, p);
		}
		return { progress, playing };
	}

	private emitProgress() {
		this.snapshot = this.buildSnapshot();
		for (const listener of this.progressListeners) {
			listener();
		}
	}

	private startProgressLoop() {
		if (this.rafId != null) return;
		const tick = () => {
			this.emitProgress();
			if (this.active.length > 0) {
				this.rafId = requestAnimationFrame(tick);
			} else {
				this.rafId = null;
				this.emitProgress();
			}
		};
		this.rafId = requestAnimationFrame(tick);
	}

	private stopProgressLoopIfIdle() {
		if (this.active.length === 0 && this.rafId != null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
			this.emitProgress();
		}
	}

	async unlock(): Promise<boolean> {
		const ctx = this.ensureContext();
		if (ctx.state === "suspended") {
			await ctx.resume();
		}
		this.unlocked = ctx.state === "running";
		return this.unlocked;
	}

	isUnlocked(): boolean {
		return this.unlocked && this.ctx?.state === "running";
	}

	setMasterVolume(volume: number) {
		if (this.masterGain) this.masterGain.gain.value = volume;
	}

	private getClipGain(clipId: string): GainNode {
		const ctx = this.ensureContext();
		let gain = this.clipGains.get(clipId);
		if (!gain) {
			gain = ctx.createGain();
			gain.connect(this.masterGain!);
			this.clipGains.set(clipId, gain);
		}
		return gain;
	}

	setClipVolume(clipId: string, volume: number) {
		this.getClipGain(clipId).gain.value = volume;
	}

	async loadClip(clipId: string, fileName: string): Promise<void> {
		if (this.buffers.has(clipId)) return;
		const bytes = await getRpc().request.readSoundFile({ fileName });
		const ctx = this.ensureContext();
		const arrayBuffer = new Uint8Array(bytes).buffer;
		const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
		this.buffers.set(clipId, audioBuffer);
	}

	async preloadAll(
		clips: { id: string; fileName: string; missing?: boolean }[],
	): Promise<void> {
		await Promise.all(
			clips
				.filter((c) => !c.missing)
				.map((c) => this.loadClip(c.id, c.fileName).catch(console.error)),
		);
	}

	async play(clipId: string, volume: number): Promise<boolean> {
		const ok = await this.unlock();
		if (!ok) return false;

		const buffer = this.buffers.get(clipId);
		if (!buffer) return false;

		const ctx = this.ensureContext();
		const clipGain = this.getClipGain(clipId);
		clipGain.gain.value = volume;

		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(clipGain);

		const startedAt = ctx.currentTime;
		const play: ActivePlay = {
			clipId,
			source,
			startedAt,
			duration: buffer.duration,
			ended: false,
		};
		this.active.push(play);

		source.onended = () => {
			play.ended = true;
			this.emitProgress();
			requestAnimationFrame(() => {
				this.active = this.active.filter((a) => a !== play);
				this.stopProgressLoopIfIdle();
				this.emitProgress();
			});
		};

		source.start(0);
		this.startProgressLoop();
		this.emitProgress();
		return true;
	}

	stopClip(clipId: string) {
		for (const play of this.active) {
			if (play.clipId !== clipId) continue;
			play.source.onended = null;
			try {
				play.source.stop();
			} catch {
				/* already stopped */
			}
		}
		this.active = this.active.filter((p) => p.clipId !== clipId);
		this.stopProgressLoopIfIdle();
		this.emitProgress();
	}

	stopAll() {
		for (const { source } of this.active) {
			source.onended = null;
			try {
				source.stop();
			} catch {
				/* already stopped */
			}
		}
		this.active = [];
		this.stopProgressLoopIfIdle();
		this.emitProgress();
	}

	removeClip(clipId: string) {
		this.buffers.delete(clipId);
		this.clipGains.delete(clipId);
	}
}

export const audioEngine = new AudioEngine();
