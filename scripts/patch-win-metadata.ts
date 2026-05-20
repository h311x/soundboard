/**
 * Patch Windows bundle executables: embed Soundboard icon + PE version strings.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const APP_NAME = "Soundboard";
const ROOT = join(import.meta.dir, "..");
const BUILD_DIR = join(ROOT, "build");
const ICON_PATH = join(ROOT, "assets/icon/icon.ico");

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

function walkDirectory(dir: string, visit: (path: string, isDir: boolean) => void): void {
	if (!existsSync(dir)) return;
	for (const entry of readdirSync(dir)) {
		visitEntry(dir, entry, visit);
	}
}

function visitEntry(
	dir: string,
	entry: string,
	visit: (path: string, isDir: boolean) => void,
): void {
	const full = join(dir, entry);
	const st = safeStat(full);
	if (!st) return;
	visit(full, st.isDirectory());
}

function safeStat(path: string) {
	try {
		return statSync(path);
	} catch {
		return null;
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

function patchExe(exePath: string, rceditExe: string) {
	const args = [
		exePath,
		"--set-version-string",
		"ProductName",
		APP_NAME,
		"--set-version-string",
		"FileDescription",
		APP_NAME,
		"--set-version-string",
		"InternalName",
		APP_NAME,
		"--set-version-string",
		"OriginalFilename",
		"Soundboard.exe",
		"--set-version-string",
		"CompanyName",
		"h311x",
		"--set-file-version",
		VERSION,
		"--set-product-version",
		VERSION,
	];

	if (existsSync(ICON_PATH)) {
		args.push("--set-icon", ICON_PATH);
	}

	console.log(`Patching ${exePath}`);
	execFileSync(rceditExe, args, { stdio: "inherit" });
}

const rceditPkg = require.resolve("rcedit/package.json");
const rceditDir = dirname(rceditPkg);
const rceditX64 = join(rceditDir, "bin", "rcedit-x64.exe");
const rceditExe = existsSync(rceditX64)
	? rceditX64
	: join(rceditDir, "bin", "rcedit.exe");

if (!existsSync(rceditExe)) {
	console.error("rcedit not found");
	process.exit(1);
}

const targets = findExes(BUILD_DIR).filter(isPatchableExe);

if (targets.length === 0) {
	console.warn(`No patchable .exe under ${BUILD_DIR} — skip Windows bundle patch`);
	process.exit(0);
}

for (const exe of targets) {
	patchExe(exe, rceditExe);
}

console.log(`Patched ${targets.length} executable(s) (v${VERSION}).`);

function isPatchableExe(exe: string): boolean {
	const base = exe.split(/[/\\]/).pop()?.toLowerCase() ?? "";
	if (PATCHABLE_EXE.has(base)) return true;
	return base.startsWith("soundboard");
}
