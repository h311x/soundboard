/**
 * Patch Windows bundle PE version strings (ProductName, etc.) for Task Manager / volume mixer.
 * Icons are handled by Electrobun via build.win.icon — do not re-embed here.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const APP_NAME = "Soundboard";
const ROOT = join(import.meta.dir, "..");
const BUILD_DIR = join(ROOT, "build");

const PATCHABLE_EXE = new Set(["launcher.exe", "bun.exe", "soundboard.exe"]);

function readVersion(): string {
	try {
		const pkg = JSON.parse(
			readFileSync(join(ROOT, "package.json"), "utf8"),
		) as { version?: string };
		if (pkg.version) return pkg.version;
	} catch {
		/* ignore */
	}
	return "0.0.0";
}

const VERSION = readVersion();

function safeStat(path: string) {
	try {
		return statSync(path);
	} catch {
		return null;
	}
}

// fallow-ignore-next-line complexity
function walkDirectory(dir: string, visit: (path: string, isDir: boolean) => void): void {
	if (!existsSync(dir)) return;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const st = safeStat(full);
		if (!st) continue;
		visit(full, st.isDirectory());
	}
}

function findExes(dir: string, out: string[] = []): string[] {
	walkDirectory(dir, (full, isDir) => {
		if (isDir) {
			findExes(full, out);
			return;
		}
		if (full.toLowerCase().endsWith(".exe")) out.push(full);
	});
	return out;
}

function isPatchableExe(exe: string): boolean {
	const base = exe.split(/[/\\]/).pop()?.toLowerCase() ?? "";
	if (PATCHABLE_EXE.has(base)) return true;
	return base.startsWith("soundboard");
}

async function patchExe(exePath: string) {
	const rcedit = (await import("rcedit")).default;
	console.log(`Patching ${exePath}`);
	await rcedit(exePath, {
		"version-string": {
			ProductName: APP_NAME,
			FileDescription: APP_NAME,
			InternalFilename: APP_NAME,
			OriginalFilename: "Soundboard.exe",
			CompanyName: "h311x",
		},
		"file-version": VERSION,
		"product-version": VERSION,
	});
}

function exitIfNoTargets(targets: string[]): void {
	if (targets.length > 0) return;
	const msg = `No patchable .exe under ${BUILD_DIR}`;
	if (process.platform === "win32") {
		console.error(msg);
		process.exit(1);
	}
	console.warn(`${msg} — skip Windows bundle patch`);
	process.exit(0);
}

async function main() {
	const targets = findExes(BUILD_DIR).filter(isPatchableExe);
	exitIfNoTargets(targets);
	for (const exe of targets) {
		await patchExe(exe);
	}
	console.log(`Patched ${targets.length} executable(s) (v${VERSION}).`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
